-- ============================================
-- TÜM TABLOLAR İÇİN RLS POLİTİKALARI
-- ============================================
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın
-- Tüm tablolar için RLS'yi etkinleştirir ve temel politikaları oluşturur

-- ============================================
-- 1. RLS'Yİ ETKİNLEŞTİR
-- ============================================

-- Mevcut tüm tablolar için RLS'yi etkinleştir
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- ============================================
-- 2. GENEL POLİTİKA FONKSİYONU
-- ============================================

-- Her tablo için aynı politikaları oluşturan fonksiyon
CREATE OR REPLACE FUNCTION create_rls_policies_for_table(table_name TEXT)
RETURNS void AS $$
BEGIN
    -- SELECT politikası
    EXECUTE format('
        DROP POLICY IF EXISTS %I ON public.%I;
        CREATE POLICY %I ON public.%I
        FOR SELECT
        USING (auth.role() = ''authenticated'');
    ', 
        table_name || '_select',
        table_name,
        table_name || '_select',
        table_name
    );
    
    -- INSERT politikası
    EXECUTE format('
        DROP POLICY IF EXISTS %I ON public.%I;
        CREATE POLICY %I ON public.%I
        FOR INSERT
        WITH CHECK (auth.role() = ''authenticated'');
    ',
        table_name || '_insert',
        table_name,
        table_name || '_insert',
        table_name
    );
    
    -- UPDATE politikası
    EXECUTE format('
        DROP POLICY IF EXISTS %I ON public.%I;
        CREATE POLICY %I ON public.%I
        FOR UPDATE
        USING (auth.role() = ''authenticated'')
        WITH CHECK (auth.role() = ''authenticated'');
    ',
        table_name || '_update',
        table_name,
        table_name || '_update',
        table_name
    );
    
    -- DELETE politikası
    EXECUTE format('
        DROP POLICY IF EXISTS %I ON public.%I;
        CREATE POLICY %I ON public.%I
        FOR DELETE
        USING (auth.role() = ''authenticated'');
    ',
        table_name || '_delete',
        table_name,
        table_name || '_delete',
        table_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TÜM TABLOLAR İÇİN POLİTİKALARI OLUŞTUR
-- ============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        PERFORM create_rls_policies_for_table(r.tablename);
        RAISE NOTICE 'RLS policies created for table: %', r.tablename;
    END LOOP;
END $$;

-- ============================================
-- 4. ÖZEL POLİTİKALAR (Gerekirse)
-- ============================================

-- kullanicilar tablosu için özel politika (admin kontrolü)
-- Eğer admin kullanıcılar tüm kayıtları görebilmeli ise:
-- DROP POLICY IF EXISTS "kullanicilar_select_admin" ON public.kullanicilar;
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

-- ============================================
-- 5. POLİTİKALARI KONTROL ET
-- ============================================

-- Tüm politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RLS etkin olmayan tabloları bul
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
);

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script tüm tablolar için temel RLS politikaları oluşturur
-- 2. Tüm authenticated kullanıcılar SELECT, INSERT, UPDATE, DELETE yapabilir
-- 3. Daha kısıtlayıcı politikalar gerekiyorsa, yukarıdaki özel politika örneğini kullanın
-- 4. Ramazan tabloları için ramazan-tablolar-ve-rls.sql dosyasını kullanın

