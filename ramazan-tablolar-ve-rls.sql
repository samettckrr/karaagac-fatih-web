-- ============================================
-- RAMAZAN TABLOLARI VE RLS POLİTİKALARI
-- ============================================
-- Bu dosya iftar-sahur-yonetim.html için gerekli tabloları ve RLS politikalarını içerir.

-- ============================================
-- 1. EKSİK TABLOLAR
-- ============================================

-- Teberru kayıtları tablosu
CREATE TABLE IF NOT EXISTS public.teberru_kayitlari (
  id TEXT NOT NULL PRIMARY KEY,
  bagisci TEXT,
  miktar NUMERIC,
  tarih TIMESTAMPTZ,
  yil INTEGER,
  ay INTEGER,
  odemeYontemi TEXT,
  odeme TEXT,
  personel TEXT,
  kaydedenPersonel TEXT,
  personelUid TEXT,
  kaydedenPersonelUid TEXT,
  "not" TEXT,
  aciklama TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teberru_kayitlari_yil ON public.teberru_kayitlari(yil);
CREATE INDEX IF NOT EXISTS idx_teberru_kayitlari_tarih ON public.teberru_kayitlari(tarih);

-- Not: taahhut_kayitlari için veriler tablosunu kullanıyoruz (tur='taahhut' ile)

-- ============================================
-- 2. MEVCUT TABLOLAR İÇİN EKSİK KOLONLAR
-- ============================================

-- ramazan_kayitlari tablosuna eksik kolonları ekle (eğer yoksa)
ALTER TABLE public.ramazan_kayitlari 
ADD COLUMN IF NOT EXISTS tip TEXT,
ADD COLUMN IF NOT EXISTS sahip TEXT,
ADD COLUMN IF NOT EXISTS tutar NUMERIC,
ADD COLUMN IF NOT EXISTS istirak BOOLEAN,
ADD COLUMN IF NOT EXISTS musafirAdedi INTEGER,
ADD COLUMN IF NOT EXISTS ay INTEGER,
ADD COLUMN IF NOT EXISTS mahalId TEXT,
ADD COLUMN IF NOT EXISTS mahal TEXT,
ADD COLUMN IF NOT EXISTS personel TEXT,
ADD COLUMN IF NOT EXISTS personelAdi TEXT,
ADD COLUMN IF NOT EXISTS personelUid TEXT,
ADD COLUMN IF NOT EXISTS kaydedenPersonel TEXT,
ADD COLUMN IF NOT EXISTS kaydedenPersonelUid TEXT,
ADD COLUMN IF NOT EXISTS "not" TEXT,
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS tarih TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ramazan_kayitlari_tarih ON public.ramazan_kayitlari(tarih);
CREATE INDEX IF NOT EXISTS idx_ramazan_kayitlari_tip ON public.ramazan_kayitlari(tip);

-- ramazan_veriler tablosuna eksik kolonları ekle (eğer yoksa)
ALTER TABLE public.ramazan_veriler
ADD COLUMN IF NOT EXISTS sahip TEXT,
ADD COLUMN IF NOT EXISTS referans TEXT,
ADD COLUMN IF NOT EXISTS diger TEXT;

-- veriler tablosuna taahhut için eksik kolonları ekle (eğer yoksa)
-- Not: veriler tablosu genel bir tablo olabilir, sadece taahhut için kullanıyoruz
-- Eğer tablo yoksa oluşturun:
CREATE TABLE IF NOT EXISTS public.veriler (
  id TEXT NOT NULL PRIMARY KEY,
  tur TEXT, -- 'taahhut' değeri ile filtreleme yapıyoruz
  bagisci TEXT,
  miktar NUMERIC,
  tarih TIMESTAMPTZ,
  yil INTEGER,
  ay INTEGER,
  personel TEXT,
  kaydedenPersonel TEXT,
  personelUid TEXT,
  kaydedenPersonelUid TEXT,
  "not" TEXT,
  aciklama TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veriler_tur ON public.veriler(tur);
CREATE INDEX IF NOT EXISTS idx_veriler_yil ON public.veriler(yil);
CREATE INDEX IF NOT EXISTS idx_veriler_tarih ON public.veriler(tarih);

-- ============================================
-- 3. RLS POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.ramazan_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teberru_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_mahaller ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_hedefler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_veriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_menuler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_yillar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_ayarlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramazan_secenekler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ramazan_kayitlari (İftar-Sahur Kayıtları)
-- ============================================

-- Okuma: Tüm kullanıcılar okuyabilir (authenticated)
DROP POLICY IF EXISTS "ramazan_kayitlari_select" ON public.ramazan_kayitlari;
CREATE POLICY "ramazan_kayitlari_select" ON public.ramazan_kayitlari
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma: Tüm kullanıcılar yazabilir (authenticated)
DROP POLICY IF EXISTS "ramazan_kayitlari_insert" ON public.ramazan_kayitlari;
CREATE POLICY "ramazan_kayitlari_insert" ON public.ramazan_kayitlari
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme: Tüm kullanıcılar güncelleyebilir (authenticated)
DROP POLICY IF EXISTS "ramazan_kayitlari_update" ON public.ramazan_kayitlari;
CREATE POLICY "ramazan_kayitlari_update" ON public.ramazan_kayitlari
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme: Tüm kullanıcılar silebilir (authenticated)
DROP POLICY IF EXISTS "ramazan_kayitlari_delete" ON public.ramazan_kayitlari;
CREATE POLICY "ramazan_kayitlari_delete" ON public.ramazan_kayitlari
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- teberru_kayitlari (Teberru Kayıtları)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "teberru_kayitlari_select" ON public.teberru_kayitlari;
CREATE POLICY "teberru_kayitlari_select" ON public.teberru_kayitlari
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "teberru_kayitlari_insert" ON public.teberru_kayitlari;
CREATE POLICY "teberru_kayitlari_insert" ON public.teberru_kayitlari
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "teberru_kayitlari_update" ON public.teberru_kayitlari;
CREATE POLICY "teberru_kayitlari_update" ON public.teberru_kayitlari
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "teberru_kayitlari_delete" ON public.teberru_kayitlari;
CREATE POLICY "teberru_kayitlari_delete" ON public.teberru_kayitlari
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- veriler (Taahhut Kayıtları - tur='taahhut')
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "veriler_select" ON public.veriler;
CREATE POLICY "veriler_select" ON public.veriler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "veriler_insert" ON public.veriler;
CREATE POLICY "veriler_insert" ON public.veriler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "veriler_update" ON public.veriler;
CREATE POLICY "veriler_update" ON public.veriler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "veriler_delete" ON public.veriler;
CREATE POLICY "veriler_delete" ON public.veriler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_mahaller (Mahaller)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_mahaller_select" ON public.ramazan_mahaller;
CREATE POLICY "ramazan_mahaller_select" ON public.ramazan_mahaller
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_mahaller_insert" ON public.ramazan_mahaller;
CREATE POLICY "ramazan_mahaller_insert" ON public.ramazan_mahaller
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_mahaller_update" ON public.ramazan_mahaller;
CREATE POLICY "ramazan_mahaller_update" ON public.ramazan_mahaller
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_mahaller_delete" ON public.ramazan_mahaller;
CREATE POLICY "ramazan_mahaller_delete" ON public.ramazan_mahaller
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_hedefler (Personel Hedefleri)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_hedefler_select" ON public.ramazan_hedefler;
CREATE POLICY "ramazan_hedefler_select" ON public.ramazan_hedefler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_hedefler_insert" ON public.ramazan_hedefler;
CREATE POLICY "ramazan_hedefler_insert" ON public.ramazan_hedefler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_hedefler_update" ON public.ramazan_hedefler;
CREATE POLICY "ramazan_hedefler_update" ON public.ramazan_hedefler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_hedefler_delete" ON public.ramazan_hedefler;
CREATE POLICY "ramazan_hedefler_delete" ON public.ramazan_hedefler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_veriler (Analiz Verileri)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_veriler_select" ON public.ramazan_veriler;
CREATE POLICY "ramazan_veriler_select" ON public.ramazan_veriler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_veriler_insert" ON public.ramazan_veriler;
CREATE POLICY "ramazan_veriler_insert" ON public.ramazan_veriler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_veriler_update" ON public.ramazan_veriler;
CREATE POLICY "ramazan_veriler_update" ON public.ramazan_veriler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_veriler_delete" ON public.ramazan_veriler;
CREATE POLICY "ramazan_veriler_delete" ON public.ramazan_veriler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_menuler (Menüler)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_menuler_select" ON public.ramazan_menuler;
CREATE POLICY "ramazan_menuler_select" ON public.ramazan_menuler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_menuler_insert" ON public.ramazan_menuler;
CREATE POLICY "ramazan_menuler_insert" ON public.ramazan_menuler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_menuler_update" ON public.ramazan_menuler;
CREATE POLICY "ramazan_menuler_update" ON public.ramazan_menuler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_menuler_delete" ON public.ramazan_menuler;
CREATE POLICY "ramazan_menuler_delete" ON public.ramazan_menuler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_yillar (Ramazan Yılları)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_yillar_select" ON public.ramazan_yillar;
CREATE POLICY "ramazan_yillar_select" ON public.ramazan_yillar
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_yillar_insert" ON public.ramazan_yillar;
CREATE POLICY "ramazan_yillar_insert" ON public.ramazan_yillar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_yillar_update" ON public.ramazan_yillar;
CREATE POLICY "ramazan_yillar_update" ON public.ramazan_yillar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_yillar_delete" ON public.ramazan_yillar;
CREATE POLICY "ramazan_yillar_delete" ON public.ramazan_yillar
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_ayarlar (Genel Ayarlar)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_ayarlar_select" ON public.ramazan_ayarlar;
CREATE POLICY "ramazan_ayarlar_select" ON public.ramazan_ayarlar
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_ayarlar_insert" ON public.ramazan_ayarlar;
CREATE POLICY "ramazan_ayarlar_insert" ON public.ramazan_ayarlar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_ayarlar_update" ON public.ramazan_ayarlar;
CREATE POLICY "ramazan_ayarlar_update" ON public.ramazan_ayarlar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_ayarlar_delete" ON public.ramazan_ayarlar;
CREATE POLICY "ramazan_ayarlar_delete" ON public.ramazan_ayarlar
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ramazan_secenekler (Tutar Seçenekleri)
-- ============================================

-- Okuma
DROP POLICY IF EXISTS "ramazan_secenekler_select" ON public.ramazan_secenekler;
CREATE POLICY "ramazan_secenekler_select" ON public.ramazan_secenekler
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Yazma
DROP POLICY IF EXISTS "ramazan_secenekler_insert" ON public.ramazan_secenekler;
CREATE POLICY "ramazan_secenekler_insert" ON public.ramazan_secenekler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme
DROP POLICY IF EXISTS "ramazan_secenekler_update" ON public.ramazan_secenekler;
CREATE POLICY "ramazan_secenekler_update" ON public.ramazan_secenekler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Silme
DROP POLICY IF EXISTS "ramazan_secenekler_delete" ON public.ramazan_secenekler;
CREATE POLICY "ramazan_secenekler_delete" ON public.ramazan_secenekler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- kullanicilar (Kullanıcılar - Sadece okuma)
-- ============================================

-- Okuma: Tüm authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "kullanicilar_select" ON public.kullanicilar;
CREATE POLICY "kullanicilar_select" ON public.kullanicilar
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Not: kullanicilar tablosuna yazma/güncelleme/silme politikaları admin panelinden yönetilmeli
-- Bu yüzden sadece SELECT politikası ekliyoruz

-- ============================================
-- SON NOTLAR
-- ============================================
-- 1. Tüm politikalar authenticated kullanıcılar için açık
-- 2. Daha kısıtlayıcı politikalar gerekiyorsa, kullanıcı rollerine göre düzenleyebilirsiniz
-- 3. Admin kontrolleri için kullanicilar tablosundaki 'rol' alanını kullanabilirsiniz
-- 4. Örnek kısıtlayıcı politika: USING (auth.uid()::text = personelUid OR (SELECT rol FROM kullanicilar WHERE id = auth.uid()::text) = 'admin')


