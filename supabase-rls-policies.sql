-- Supabase RLS (Row Level Security) Politikaları
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. sayfa_manifesti tablosu için RLS politikası
-- Tüm kullanıcılar sayfa manifestini okuyabilir (authenticated users)
CREATE POLICY "sayfa_manifesti_select_all" ON public.sayfa_manifesti
  FOR SELECT
  TO authenticated
  USING (true);

-- Alternatif: Sadece aktif kullanıcılar
-- CREATE POLICY "sayfa_manifesti_select_active" ON public.sayfa_manifesti
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.kullanicilar
--       WHERE kullanicilar.id = auth.uid()::text
--       AND kullanicilar.aktif = true
--     )
--   );

-- 2. kullanicilar tablosu için RLS politikası
-- Kullanıcılar sadece kendi kayıtlarını okuyabilir
-- NOT: id alanı text tipinde olduğu için auth.uid()'i text'e çeviriyoruz
CREATE POLICY "kullanicilar_select_own" ON public.kullanicilar
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Eğer admin kullanıcılar tüm kayıtları görebilmeli ise:
-- CREATE POLICY "kullanicilar_select_admin" ON public.kullanicilar
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.kullanicilar
--       WHERE kullanicilar.id = auth.uid()::text
--       AND (
--         kullanicilar.rol = 'admin'
--         OR 'admin' = ANY(kullanicilar.yetkiler)
--         OR '*' = ANY(kullanicilar.yetkiler)
--       )
--     )
--   );

-- 3. RLS'yi etkinleştir (eğer henüz etkin değilse)
ALTER TABLE public.sayfa_manifesti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;

-- 4. Politikaları kontrol et
-- SELECT * FROM pg_policies WHERE tablename IN ('sayfa_manifesti', 'kullanicilar');

