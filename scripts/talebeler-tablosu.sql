-- Talebeler Tablosu ve İlgili Yapılar
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın

-- ============================================
-- 1. TABLO OLUŞTURMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.talebeler (
  id text NOT NULL,
  devre text NOT NULL,
  talebe_adi text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT talebeler_pkey PRIMARY KEY (id)
);

-- ============================================
-- 2. INDEX'LER (Performans Optimizasyonu)
-- ============================================

-- Devre bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_talebeler_devre 
  ON public.talebeler (devre);

-- İsim bazlı arama
CREATE INDEX IF NOT EXISTS idx_talebeler_adi 
  ON public.talebeler (talebe_adi);

-- Devre + İsim kombinasyonu (sık kullanılabilir)
CREATE INDEX IF NOT EXISTS idx_talebeler_devre_adi 
  ON public.talebeler (devre, talebe_adi);

-- ============================================
-- 3. TRIGGER: updated_at Otomatik Güncelleme
-- ============================================

CREATE OR REPLACE FUNCTION update_talebeler_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_talebeler_updated_at
  BEFORE UPDATE ON public.talebeler
  FOR EACH ROW
  EXECUTE FUNCTION update_talebeler_updated_at();

-- ============================================
-- 4. RLS (Row Level Security) ETKİNLEŞTİRME
-- ============================================

ALTER TABLE public.talebeler ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLİTİKALARI
-- ============================================

-- SELECT: Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "talebeler_select_all" ON public.talebeler
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Tüm authenticated kullanıcılar ekleyebilir
CREATE POLICY "talebeler_insert_all" ON public.talebeler
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Tüm authenticated kullanıcılar güncelleyebilir
CREATE POLICY "talebeler_update_all" ON public.talebeler
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Tüm authenticated kullanıcılar silebilir
-- İleride admin kontrolü eklenebilir
CREATE POLICY "talebeler_delete_all" ON public.talebeler
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Tablo oluşturulduktan sonra RLS politikaları aktif olacak
-- 2. Index'ler sorgu performansını artıracak
-- 3. id alanı text olarak tutulur (Firebase UID'leri veya manuel ID'ler için)
-- 4. updated_at otomatik olarak güncellenecek
-- 5. Aynı id farklı devrelerde olabilir (UNIQUE constraint sadece id üzerinde)
