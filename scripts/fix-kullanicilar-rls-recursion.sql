-- ============================================
-- KULLANICILAR RLS SONSuz DÖNGÜ DÜZELTMESİ
-- ============================================
-- Sorun: RLS politikası kendi kendini sorgulayarak sonsuz döngü oluşturuyor
-- Hata: "infinite recursion detected in policy for relation kullanicilar"
-- Çözüm: Tüm politikaları silip, basit ve güvenli bir politika oluştur

-- 1. Mevcut tüm politikaları sil
DROP POLICY IF EXISTS "kullanicilar_select" ON public.kullanicilar;
DROP POLICY IF EXISTS "kullanicilar_select_own" ON public.kullanicilar;
DROP POLICY IF EXISTS "kullanicilar_select_admin" ON public.kullanicilar;
DROP POLICY IF EXISTS "kullanicilar_insert" ON public.kullanicilar;
DROP POLICY IF EXISTS "kullanicilar_update" ON public.kullanicilar;
DROP POLICY IF EXISTS "kullanicilar_delete" ON public.kullanicilar;

-- 2. RLS'yi etkinleştir (eğer değilse)
ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;

-- 3. Basit ve güvenli SELECT politikası
-- Kullanıcılar sadece kendi kayıtlarını okuyabilir
-- NOT: Sonsuz döngü yok - direkt auth.uid() kullanıyoruz, kullanicilar tablosunu sorgulamıyoruz
CREATE POLICY "kullanicilar_select_own" ON public.kullanicilar
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- 4. INSERT politikası (opsiyonel - eğer kullanıcılar kendi kayıtlarını oluşturabilmeli ise)
-- Genellikle admin tarafından oluşturulur, bu yüzden yorum satırında bırakıyoruz
-- CREATE POLICY "kullanicilar_insert_own" ON public.kullanicilar
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (id = auth.uid()::text);

-- 5. UPDATE politikası - Kullanıcılar sadece kendi kayıtlarını güncelleyebilir
CREATE POLICY "kullanicilar_update_own" ON public.kullanicilar
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 6. DELETE politikası - Genellikle admin işlemi, bu yüzden yorum satırında
-- CREATE POLICY "kullanicilar_delete_own" ON public.kullanicilar
--   FOR DELETE
--   TO authenticated
--   USING (id = auth.uid()::text);

-- 7. Politikaları kontrol et
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'kullanicilar'
ORDER BY policyname;

-- NOT: Admin kullanıcılar için tüm kayıtları görmek istiyorsanız,
-- service_role kullanın veya ayrı bir admin tablosu oluşturun.
-- RLS politikası içinde kullanicilar tablosunu sorgulamak sonsuz döngüye neden olur.
