-- Ders Kayıtları Tablosu ve İlgili Yapılar
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın

-- ============================================
-- 1. TABLO OLUŞTURMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.ders_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  devre text NOT NULL,
  kitap text NOT NULL,
  ders_adi text NOT NULL,
  ders_gunu date NOT NULL,
  kaydeden_personel text,
  kaydeden_personel_uid text,
  talebe_uid text NOT NULL,
  talebe_adi text,
  ders_verme_durumu text CHECK (ders_verme_durumu IN ('henuz_verilmedi', 'verdi', 'veremedi', 'yarim') OR ders_verme_durumu IS NULL),
  ders_verme_tarihi timestamp with time zone,
  ders_veren_personel text,
  ders_veren_personel_uid text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ders_kayitlari_pkey PRIMARY KEY (id),
  CONSTRAINT ders_kayitlari_unique UNIQUE (devre, kitap, ders_adi, talebe_uid)
);

-- ============================================
-- 2. INDEX'LER (Performans Optimizasyonu)
-- ============================================

-- En sık kullanılan filtreleme: devre + kitap + ders
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_devre_kitap_ders 
  ON public.ders_kayitlari (devre, kitap, ders_adi);

-- Talebe bazlı filtreleme: devre + kitap + talebe
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_devre_kitap_talebe 
  ON public.ders_kayitlari (devre, kitap, talebe_uid);

-- Talebe bazlı tüm dersler
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_talebe_uid 
  ON public.ders_kayitlari (talebe_uid);

-- Tarih bazlı filtreleme (kayıt tarihi)
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_ders_gunu 
  ON public.ders_kayitlari (ders_gunu);

-- Personel bazlı (kim kaydetti)
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_kaydeden_uid 
  ON public.ders_kayitlari (kaydeden_personel_uid);

-- Personel bazlı (kim verdi)
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_veren_uid 
  ON public.ders_kayitlari (ders_veren_personel_uid);

-- Tarih bazlı (bugün kimler ders vermiş)
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_verme_tarihi 
  ON public.ders_kayitlari (ders_verme_tarihi);

-- Devre bazlı talebe dersleri
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_devre_talebe 
  ON public.ders_kayitlari (devre, talebe_uid);

-- Durum bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_ders_kayitlari_durum 
  ON public.ders_kayitlari (ders_verme_durumu);

-- ============================================
-- 3. TRIGGER: updated_at Otomatik Güncelleme
-- ============================================

CREATE OR REPLACE FUNCTION update_ders_kayitlari_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ders_kayitlari_updated_at
  BEFORE UPDATE ON public.ders_kayitlari
  FOR EACH ROW
  EXECUTE FUNCTION update_ders_kayitlari_updated_at();

-- ============================================
-- 4. RLS (Row Level Security) ETKİNLEŞTİRME
-- ============================================

ALTER TABLE public.ders_kayitlari ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLİTİKALARI
-- ============================================

-- SELECT: Tüm authenticated kullanıcılar okuyabilir
-- (İleride devre bazlı kısıtlama eklenebilir)
CREATE POLICY "ders_kayitlari_select_all" ON public.ders_kayitlari
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Tüm authenticated kullanıcılar ekleyebilir
CREATE POLICY "ders_kayitlari_insert_all" ON public.ders_kayitlari
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Tüm authenticated kullanıcılar güncelleyebilir
CREATE POLICY "ders_kayitlari_update_all" ON public.ders_kayitlari
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Sadece admin silebilir (şimdilik tüm authenticated kullanıcılar)
-- İleride admin kontrolü eklenebilir
CREATE POLICY "ders_kayitlari_delete_all" ON public.ders_kayitlari
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 6. YARDIMCI FONKSİYONLAR (Opsiyonel)
-- ============================================

-- Talebe adını otomatik güncelleme fonksiyonu (opsiyonel)
-- Bu fonksiyon talebeler tablosundan adı çekip güncelleyebilir
-- Şimdilik manuel tutulacak, ileride trigger ile otomatikleştirilebilir

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Tablo oluşturulduktan sonra RLS politikaları aktif olacak
-- 2. Index'ler sorgu performansını artıracak
-- 3. UNIQUE constraint bir talebenin aynı devre-kitap-ders için sadece bir kaydı olmasını sağlar
-- 4. updated_at otomatik olarak güncellenecek
-- 5. Durum değerleri: NULL (henüz işlem yapılmadı), 'henuz_verilmedi', 'verdi', 'veremedi', 'yarim'
