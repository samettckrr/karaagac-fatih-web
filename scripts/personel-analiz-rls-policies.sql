-- ============================================
-- PERSONEL ANALİZ TABLOLARI RLS Politikaları
-- ============================================
-- Bu script, personel_odeme_takvim, arsiv_hedefler ve gecmis_teberru_kayitlari
-- tabloları için Row Level Security (RLS) politikalarını oluşturur.
-- 
-- Politika Mantığı:
-- - Personel: Sadece kendi personel_uid'sine ait kayıtları görebilir
-- - Admin: Tüm kayıtları görebilir (rol kontrolü ile)
-- - INSERT/UPDATE/DELETE: Admin ve ilgili personel yapabilir

-- ============================================
-- 1. PERSONEL_ODEME_TAKVIM Tablosu RLS
-- ============================================

ALTER TABLE public.personel_odeme_takvim ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "personel_odeme_takvim_select" ON public.personel_odeme_takvim;
DROP POLICY IF EXISTS "personel_odeme_takvim_insert" ON public.personel_odeme_takvim;
DROP POLICY IF EXISTS "personel_odeme_takvim_update" ON public.personel_odeme_takvim;
DROP POLICY IF EXISTS "personel_odeme_takvim_delete" ON public.personel_odeme_takvim;

-- SELECT Politikası: Personel kendi verilerini, admin tümünü görebilir
CREATE POLICY "personel_odeme_takvim_select"
ON public.personel_odeme_takvim
FOR SELECT
TO authenticated
USING (
  -- Admin kontrolü: rol = 'admin' veya yetkiler array'inde 'admin' veya '*' varsa
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  -- Personel kendi verilerini görebilir
  personel_uid = auth.uid()::text
);

-- INSERT Politikası: Admin ve authenticated kullanıcılar ekleyebilir
CREATE POLICY "personel_odeme_takvim_insert"
ON public.personel_odeme_takvim
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  personel_uid = auth.uid()::text
);

-- UPDATE Politikası: Admin ve ilgili personel güncelleyebilir
CREATE POLICY "personel_odeme_takvim_update"
ON public.personel_odeme_takvim
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  personel_uid = auth.uid()::text
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  personel_uid = auth.uid()::text
);

-- DELETE Politikası: Admin ve ilgili personel silebilir
CREATE POLICY "personel_odeme_takvim_delete"
ON public.personel_odeme_takvim
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  personel_uid = auth.uid()::text
);

-- ============================================
-- 2. ARSIV_HEDEFLER Tablosu RLS
-- ============================================

ALTER TABLE public.arsiv_hedefler ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "arsiv_hedefler_select" ON public.arsiv_hedefler;
DROP POLICY IF EXISTS "arsiv_hedefler_insert" ON public.arsiv_hedefler;
DROP POLICY IF EXISTS "arsiv_hedefler_update" ON public.arsiv_hedefler;
DROP POLICY IF EXISTS "arsiv_hedefler_delete" ON public.arsiv_hedefler;

-- SELECT Politikası: Personel kendi hedeflerini, admin tümünü görebilir
CREATE POLICY "arsiv_hedefler_select"
ON public.arsiv_hedefler
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  uid = auth.uid()::text
);

-- INSERT Politikası: Admin ve authenticated kullanıcılar ekleyebilir
CREATE POLICY "arsiv_hedefler_insert"
ON public.arsiv_hedefler
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  uid = auth.uid()::text
);

-- UPDATE Politikası: Admin ve ilgili personel güncelleyebilir
CREATE POLICY "arsiv_hedefler_update"
ON public.arsiv_hedefler
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  uid = auth.uid()::text
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  uid = auth.uid()::text
);

-- DELETE Politikası: Admin ve ilgili personel silebilir
CREATE POLICY "arsiv_hedefler_delete"
ON public.arsiv_hedefler
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  uid = auth.uid()::text
);

-- ============================================
-- 3. GECMIS_TEBERRU_KAYITLARI Tablosu RLS
-- ============================================

ALTER TABLE public.gecmis_teberru_kayitlari ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "gecmis_teberru_kayitlari_select" ON public.gecmis_teberru_kayitlari;
DROP POLICY IF EXISTS "gecmis_teberru_kayitlari_insert" ON public.gecmis_teberru_kayitlari;
DROP POLICY IF EXISTS "gecmis_teberru_kayitlari_update" ON public.gecmis_teberru_kayitlari;
DROP POLICY IF EXISTS "gecmis_teberru_kayitlari_delete" ON public.gecmis_teberru_kayitlari;

-- SELECT Politikası: Personel kendi teberrularını (referans ile), admin tümünü görebilir
CREATE POLICY "gecmis_teberru_kayitlari_select"
ON public.gecmis_teberru_kayitlari
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  referans = auth.uid()::text
  OR
  diger = auth.uid()::text
);

-- INSERT Politikası: Admin ve authenticated kullanıcılar ekleyebilir
CREATE POLICY "gecmis_teberru_kayitlari_insert"
ON public.gecmis_teberru_kayitlari
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  referans = auth.uid()::text
  OR
  diger = auth.uid()::text
);

-- UPDATE Politikası: Admin ve ilgili personel güncelleyebilir
CREATE POLICY "gecmis_teberru_kayitlari_update"
ON public.gecmis_teberru_kayitlari
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  referans = auth.uid()::text
  OR
  diger = auth.uid()::text
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  referans = auth.uid()::text
  OR
  diger = auth.uid()::text
);

-- DELETE Politikası: Admin ve ilgili personel silebilir
CREATE POLICY "gecmis_teberru_kayitlari_delete"
ON public.gecmis_teberru_kayitlari
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE kullanicilar.id = auth.uid()::text
    AND (
      kullanicilar.rol = 'admin'
      OR 'admin' = ANY(kullanicilar.yetkiler)
      OR '*' = ANY(kullanicilar.yetkiler)
      OR 'all' = ANY(kullanicilar.yetkiler)
    )
  )
  OR
  referans = auth.uid()::text
  OR
  diger = auth.uid()::text
);

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Admin kontrolü: kullanicilar tablosundaki 'rol' = 'admin' veya 
--    'yetkiler' array'inde 'admin', '*', 'all' değerlerinden biri varsa admin sayılır
-- 2. Personel kontrolü: personel_uid/uid/referans alanı auth.uid() ile eşleşiyorsa
--    kendi verilerine erişebilir
-- 3. Tüm politikalar authenticated kullanıcılar için geçerlidir
