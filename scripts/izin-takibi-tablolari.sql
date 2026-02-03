-- İzin Takibi Tabloları ve RLS Politikaları
-- izinler, yoklama tabloları + izin_oturumlari RLS
-- talebeler zaten var. Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın.

-- ============================================
-- 1. İZİNLER TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS public.izinler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe text,
  talebeuid text,
  devre text,
  baslatan text,
  baslangic timestamp with time zone NOT NULL,
  planlanandonus timestamp with time zone,
  aciklama text,
  durum text NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'dondu', 'iptal')),
  uid text,
  createdby text,
  cihaz text,
  useragent text,
  createdat timestamp with time zone DEFAULT now(),
  iptalat timestamp with time zone,
  iptalby text,
  donusat timestamp with time zone,
  donusnot text,
  updatedat timestamp with time zone,
  updatedby text,
  CONSTRAINT izinler_pkey PRIMARY KEY (id)
);

-- Index: durum (aktif izinleri hızlı listelemek için)
CREATE INDEX IF NOT EXISTS idx_izinler_durum ON public.izinler (durum);

-- Index: createdat (sıralama için)
CREATE INDEX IF NOT EXISTS idx_izinler_createdat ON public.izinler (createdat DESC);

-- Index: devre
CREATE INDEX IF NOT EXISTS idx_izinler_devre ON public.izinler (devre);

-- RLS
ALTER TABLE public.izinler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "izinler_select_authenticated" ON public.izinler
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "izinler_insert_authenticated" ON public.izinler
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "izinler_update_authenticated" ON public.izinler
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "izinler_delete_authenticated" ON public.izinler
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 2. YOKLAMA TABLOSU
-- devre + gun + talebeuid = benzersiz (talebe/gün başına tek kayıt)
-- ============================================

CREATE TABLE IF NOT EXISTS public.yoklama (
  devre text NOT NULL,
  gun date NOT NULL,
  talebeuid text NOT NULL,
  durum text DEFAULT 'none' CHECK (durum IN ('geldi', 'gelmedi', 'izinli', 'none')),
  personel text,
  personeluid text,
  donussaatiso text,
  islemiso timestamp with time zone,
  islemisostr text,
  izinbitisiso timestamp with time zone,
  izinveren text,
  izinaciklama text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  CONSTRAINT yoklama_pkey PRIMARY KEY (devre, gun, talebeuid)
);

-- Index: devre + gun (tarih bazlı sorgular için)
CREATE INDEX IF NOT EXISTS idx_yoklama_devre_gun ON public.yoklama (devre, gun);

-- Index: talebeuid (talebe bazlı sorgular için)
CREATE INDEX IF NOT EXISTS idx_yoklama_talebeuid ON public.yoklama (talebeuid);

-- Trigger: updatedat otomatik güncelleme
CREATE OR REPLACE FUNCTION update_yoklama_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yoklama_updated_at ON public.yoklama;
CREATE TRIGGER trigger_yoklama_updated_at
  BEFORE UPDATE ON public.yoklama
  FOR EACH ROW
  EXECUTE FUNCTION update_yoklama_updated_at();

-- RLS
ALTER TABLE public.yoklama ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yoklama_select_authenticated" ON public.yoklama
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "yoklama_insert_authenticated" ON public.yoklama
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "yoklama_update_authenticated" ON public.yoklama
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "yoklama_delete_authenticated" ON public.yoklama
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 3. İZİN_OTURUMLARI RLS (tablo zaten var)
-- ============================================

ALTER TABLE public.izin_oturumlari ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları kaldır (varsa) ve yeniden oluştur
DROP POLICY IF EXISTS "izin_oturumlari_select_authenticated" ON public.izin_oturumlari;
DROP POLICY IF EXISTS "izin_oturumlari_insert_authenticated" ON public.izin_oturumlari;
DROP POLICY IF EXISTS "izin_oturumlari_update_authenticated" ON public.izin_oturumlari;
DROP POLICY IF EXISTS "izin_oturumlari_delete_authenticated" ON public.izin_oturumlari;

CREATE POLICY "izin_oturumlari_select_authenticated" ON public.izin_oturumlari
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "izin_oturumlari_insert_authenticated" ON public.izin_oturumlari
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "izin_oturumlari_update_authenticated" ON public.izin_oturumlari
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "izin_oturumlari_delete_authenticated" ON public.izin_oturumlari
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- NOTLAR
-- ============================================
-- talebeler tablosu zaten mevcut, RLS politikaları scripts/talebeler-tablosu.sql'de
-- izin_oturumlari tablosu zaten mevcut, sadece RLS eklendi
-- izinler: Hususi izin kayıtları (başlat, dönüş, iptal)
-- yoklama: Yoklama durumları (geldi/gelmedi/izinli) - devre + gun + talebeuid PK
