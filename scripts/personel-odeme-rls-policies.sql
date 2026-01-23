-- ============================================
-- PERSONEL_ODEME Tablosu RLS Politikaları
-- ============================================
-- Bu script, personel_odeme tablosu için Row Level Security (RLS) politikalarını oluşturur.
-- Tüm kullanıcılar SELECT, INSERT, UPDATE, DELETE yapabilir (ihtiyaca göre düzenlenebilir)

-- Önce RLS'yi etkinleştir
ALTER TABLE public.personel_odeme ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "personel_odeme_select" ON public.personel_odeme;
DROP POLICY IF EXISTS "personel_odeme_insert" ON public.personel_odeme;
DROP POLICY IF EXISTS "personel_odeme_update" ON public.personel_odeme;
DROP POLICY IF EXISTS "personel_odeme_delete" ON public.personel_odeme;

-- SELECT Politikası - Tüm kullanıcılar okuyabilir
CREATE POLICY "personel_odeme_select"
ON public.personel_odeme
FOR SELECT
USING (true);

-- INSERT Politikası - Tüm kullanıcılar ekleyebilir
CREATE POLICY "personel_odeme_insert"
ON public.personel_odeme
FOR INSERT
WITH CHECK (true);

-- UPDATE Politikası - Tüm kullanıcılar güncelleyebilir
CREATE POLICY "personel_odeme_update"
ON public.personel_odeme
FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE Politikası - Tüm kullanıcılar silebilir
CREATE POLICY "personel_odeme_delete"
ON public.personel_odeme
FOR DELETE
USING (true);

-- ============================================
-- NOT: Eğer sadece belirli kullanıcıların erişmesini istiyorsanız,
-- yukarıdaki politikaları aşağıdaki gibi değiştirebilirsiniz:
-- ============================================

-- Örnek: Sadece authenticated kullanıcılar
-- CREATE POLICY "personel_odeme_select"
-- ON public.personel_odeme
-- FOR SELECT
-- USING (auth.role() = 'authenticated');

-- Örnek: Sadece belirli email'e sahip kullanıcılar
-- CREATE POLICY "personel_odeme_select"
-- ON public.personel_odeme
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND auth.users.email = 'samettckrr@gmail.com'
--   )
-- );
