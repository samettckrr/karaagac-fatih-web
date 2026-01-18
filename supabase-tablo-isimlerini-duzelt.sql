-- ============================================
-- TABLO VE KOLON İSİMLERİNİ DÜZELT
-- ============================================
-- Bu script, büyük harf içeren tablo ve kolon isimlerini küçük harfe çevirir
-- PostgreSQL'de tablo/kolon isimleri tırnak içinde yazılmazsa otomatik küçük harfe çevrilir
-- Ancak mevcut tablolarda büyük harf varsa, bunları düzeltmemiz gerekir

-- ============================================
-- 1. BÜYÜK HARF İÇEREN TABLOLARI BUL
-- ============================================

-- Önce kontrol et
SELECT 
    tablename,
    LOWER(tablename) as should_be
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename != LOWER(tablename)
ORDER BY tablename;

-- ============================================
-- 2. TABLO İSİMLERİNİ DÜZELT
-- ============================================

-- DİKKAT: Bu script tabloları yeniden adlandırır
-- Önce yedek alın!

DO $$
DECLARE
    r RECORD;
    new_name TEXT;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != LOWER(tablename)
    LOOP
        new_name := LOWER(r.tablename);
        
        -- Eğer hedef isimde tablo yoksa, yeniden adlandır
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = new_name
        ) THEN
            EXECUTE format('ALTER TABLE %I RENAME TO %I', r.tablename, new_name);
            RAISE NOTICE 'Table renamed: % -> %', r.tablename, new_name;
        ELSE
            RAISE WARNING 'Target table name already exists: %. Skipping rename of %', new_name, r.tablename;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 3. BÜYÜK HARF İÇEREN KOLONLARI BUL
-- ============================================

-- Her tablo için büyük harf içeren kolonları bul
SELECT 
    t.table_name,
    c.column_name,
    LOWER(c.column_name) as should_be
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name != LOWER(c.column_name)
ORDER BY t.table_name, c.column_name;

-- ============================================
-- 4. KOLON İSİMLERİNİ DÜZELT
-- ============================================

-- DİKKAT: Bu script kolonları yeniden adlandırır
-- Önce yedek alın!

DO $$
DECLARE
    r RECORD;
    new_name TEXT;
BEGIN
    FOR r IN 
        SELECT 
            t.table_name,
            c.column_name
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON t.table_schema = c.table_schema 
            AND t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND c.column_name != LOWER(c.column_name)
    LOOP
        new_name := LOWER(r.column_name);
        
        -- Eğer hedef isimde kolon yoksa, yeniden adlandır
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = r.table_name
            AND column_name = new_name
        ) THEN
            EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', 
                r.table_name, r.column_name, new_name);
            RAISE NOTICE 'Column renamed: %.% -> %.%', 
                r.table_name, r.column_name, r.table_name, new_name;
        ELSE
            RAISE WARNING 'Target column name already exists: %.%. Skipping rename of %.%', 
                r.table_name, new_name, r.table_name, r.column_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 5. YAYGIN KOLON İSİM SORUNLARI
-- ============================================

-- Bazı yaygın kolon ismi sorunlarını düzelt
-- Örnek: adSoyad -> ad_soyad, personelUid -> personel_uid

-- adSoyad -> ad_soyad
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'adSoyad'
    ) THEN
        -- Her tabloda adSoyad varsa düzelt
        FOR r IN 
            SELECT DISTINCT table_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND column_name = 'adSoyad'
        LOOP
            EXECUTE format('ALTER TABLE %I RENAME COLUMN "adSoyad" TO ad_soyad', r.table_name);
            RAISE NOTICE 'Column renamed: %.adSoyad -> %.ad_soyad', r.table_name, r.table_name;
        END LOOP;
    END IF;
END $$;

-- personelUid -> personel_uid
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'personelUid'
    LOOP
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "personelUid" TO personel_uid', r.table_name);
        RAISE NOTICE 'Column renamed: %.personelUid -> %.personel_uid', r.table_name, r.table_name;
    END LOOP;
END $$;

-- kaydedenPersonelUid -> kaydeden_personel_uid
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'kaydedenPersonelUid'
    LOOP
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "kaydedenPersonelUid" TO kaydeden_personel_uid', r.table_name);
        RAISE NOTICE 'Column renamed: %.kaydedenPersonelUid -> %.kaydeden_personel_uid', r.table_name, r.table_name;
    END LOOP;
END $$;

-- personelAdi -> personel_adi
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'personelAdi'
    LOOP
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "personelAdi" TO personel_adi', r.table_name);
        RAISE NOTICE 'Column renamed: %.personelAdi -> %.personel_adi', r.table_name, r.table_name;
    END LOOP;
END $$;

-- ============================================
-- 6. SONUÇLARI KONTROL ET
-- ============================================

-- Hala büyük harf içeren tablolar var mı?
SELECT 
    tablename,
    'Table still has uppercase' as issue
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename != LOWER(tablename);

-- Hala büyük harf içeren kolonlar var mı?
SELECT 
    t.table_name,
    c.column_name,
    'Column still has uppercase' as issue
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name != LOWER(c.column_name)
ORDER BY t.table_name, c.column_name;

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script'i çalıştırmadan önce MUTLAKA yedek alın
-- 2. Script çalıştıktan sonra kodda kolon isimlerini de güncellemeniz gerekir
-- 3. Örnek: adSoyad -> ad_soyad, personelUid -> personel_uid
-- 4. Kod güncellemeleri için grep kullanın:
--    grep -r "adSoyad" --include="*.js" --include="*.html"
--    grep -r "personelUid" --include="*.js" --include="*.html"

