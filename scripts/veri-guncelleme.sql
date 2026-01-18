-- ============================================
-- VERİ GÜNCELLEME SCRIPTİ
-- ============================================
-- Tüm tablolarda UID güncelleme
-- uid_eslestirme tablosunu kullanarak eski UID'leri yeni UID'lere günceller
-- ============================================

-- DİKKAT: Bu script tüm verileri günceller!
-- Çalıştırmadan önce MUTLAKA veritabanı yedeği alın!

-- ============================================
-- 1. ÖN KONTROL
-- ============================================
-- Eşleştirme tablosunun varlığını kontrol et

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uid_eslestirme') THEN
        RAISE EXCEPTION 'uid_eslestirme tablosu bulunamadı! Önce scripts/uid-eslestirme.sql script''ini çalıştırın.';
    END IF;
END $$;

-- ============================================
-- 2. KULLANICI_LOG TABLOSU
-- ============================================
-- uid kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.kullanici_log kl
    SET uid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE kl.uid = ue.eski_uid
    AND kl.uid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'kullanici_log: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 3. SAYFA_ERISIMLERI TABLOSU
-- ============================================
-- uid kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.sayfa_erisimleri se
    SET uid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE se.uid = ue.eski_uid
    AND se.uid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'sayfa_erisimleri: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 4. SAYFA_LOGLARI TABLOSU
-- ============================================
-- uid kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.sayfa_loglari sl
    SET uid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE sl.uid = ue.eski_uid
    AND sl.uid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'sayfa_loglari: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 5. HEDEFLER TABLOSU
-- ============================================
-- uid, personel ve updatedBy kolonlarını güncelle

DO $$
DECLARE
    v_updated_uid INTEGER := 0;
    v_updated_personel INTEGER := 0;
    v_updated_updatedby INTEGER := 0;
BEGIN
    -- uid kolonunu güncelle
    UPDATE public.hedefler h
    SET uid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE h.uid = ue.eski_uid
    AND h.uid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated_uid = ROW_COUNT;
    
    -- personel kolonunu güncelle (email ile eşleştirme)
    UPDATE public.hedefler h
    SET personel = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE h.personel = ue.eski_uid
    AND h.personel IS NOT NULL;
    
    GET DIAGNOSTICS v_updated_personel = ROW_COUNT;
    
    -- updatedBy kolonunu güncelle
    UPDATE public.hedefler h
    SET "updatedBy" = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE h."updatedBy" = ue.eski_uid
    AND h."updatedBy" IS NOT NULL;
    
    GET DIAGNOSTICS v_updated_updatedby = ROW_COUNT;
    
    RAISE NOTICE 'hedefler: uid=% personel=% updatedBy=% kayıt güncellendi', 
        v_updated_uid, v_updated_personel, v_updated_updatedby;
END $$;

-- ============================================
-- 6. ISLEMLER TABLOSU
-- ============================================
-- personelId ve personelAd kolonlarını güncelle
-- NOT: personelAd email ile eşleştirilerek güncellenebilir

DO $$
DECLARE
    v_updated_personelid INTEGER := 0;
    v_updated_personelad INTEGER := 0;
    r RECORD;
BEGIN
    -- personelId kolonunu güncelle
    UPDATE public.islemler i
    SET personelId = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE i.personelId = ue.eski_uid
    AND i.personelId IS NOT NULL;
    
    GET DIAGNOSTICS v_updated_personelid = ROW_COUNT;
    
    -- personelAd kolonunu email ile eşleştirerek güncelle
    FOR r IN 
        SELECT DISTINCT i.id, ue.yeni_uid, k.adSoyad
        FROM public.islemler i
        JOIN public.uid_eslestirme ue ON i.personelId = ue.eski_uid
        JOIN public.kullanicilar k ON ue.yeni_uid = k.id
        WHERE i.personelId IS NOT NULL
    LOOP
        UPDATE public.islemler
        SET personelAd = r.adSoyad
        WHERE id = r.id;
        
        v_updated_personelad := v_updated_personelad + 1;
    END LOOP;
    
    RAISE NOTICE 'islemler: personelId=% personelAd=% kayıt güncellendi', 
        v_updated_personelid, v_updated_personelad;
END $$;

-- ============================================
-- 7. TAHAKKUKLAR TABLOSU
-- ============================================
-- personel kolonunu güncelle (email ile eşleştirme)

DO $$
DECLARE
    v_updated INTEGER := 0;
    r RECORD;
BEGIN
    -- personel kolonu UID veya email içerebilir
    -- Önce UID olarak eşleştirmeyi dene
    UPDATE public.tahakkuklar t
    SET personel = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE t.personel = ue.eski_uid
    AND t.personel IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Email ile eşleştirme (eğer personel kolonu email içeriyorsa)
    FOR r IN 
        SELECT DISTINCT t.id, ue.yeni_uid
        FROM public.tahakkuklar t
        JOIN public.uid_eslestirme ue ON LOWER(t.personel) = LOWER(ue.email)
        WHERE t.personel IS NOT NULL
        AND t.personel NOT LIKE '%-%-%-%-%' -- UID formatında değilse
    LOOP
        UPDATE public.tahakkuklar
        SET personel = r.yeni_uid
        WHERE id = r.id;
        
        v_updated := v_updated + 1;
    END LOOP;
    
    RAISE NOTICE 'tahakkuklar: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 8. TAHSILATLAR TABLOSU
-- ============================================
-- personel kolonunu güncelle (email ile eşleştirme)

DO $$
DECLARE
    v_updated INTEGER := 0;
    r RECORD;
BEGIN
    -- personel kolonu UID veya email içerebilir
    -- Önce UID olarak eşleştirmeyi dene
    UPDATE public.tahsilatlar t
    SET personel = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE t.personel = ue.eski_uid
    AND t.personel IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Email ile eşleştirme (eğer personel kolonu email içeriyorsa)
    FOR r IN 
        SELECT DISTINCT t.id, ue.yeni_uid
        FROM public.tahsilatlar t
        JOIN public.uid_eslestirme ue ON LOWER(t.personel) = LOWER(ue.email)
        WHERE t.personel IS NOT NULL
        AND t.personel NOT LIKE '%-%-%-%-%' -- UID formatında değilse
    LOOP
        UPDATE public.tahsilatlar
        SET personel = r.yeni_uid
        WHERE id = r.id;
        
        v_updated := v_updated + 1;
    END LOOP;
    
    RAISE NOTICE 'tahsilatlar: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 9. NOBET_PLANLARI TABLOSU
-- ============================================
-- createdBy kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.nobet_planlari np
    SET "createdBy" = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE np."createdBy" = ue.eski_uid
    AND np."createdBy" IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'nobet_planlari: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 10. NOBET_INDEX TABLOSU
-- ============================================
-- person kolonunu güncelle (email ile eşleştirme)

DO $$
DECLARE
    v_updated INTEGER := 0;
    r RECORD;
BEGIN
    -- person kolonu UID veya email içerebilir
    -- Önce UID olarak eşleştirmeyi dene
    UPDATE public.nobet_index ni
    SET person = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE ni.person = ue.eski_uid
    AND ni.person IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Email ile eşleştirme (eğer person kolonu email içeriyorsa)
    FOR r IN 
        SELECT DISTINCT ni.id, ue.yeni_uid
        FROM public.nobet_index ni
        JOIN public.uid_eslestirme ue ON LOWER(ni.person) = LOWER(ue.email)
        WHERE ni.person IS NOT NULL
        AND ni.person NOT LIKE '%-%-%-%-%' -- UID formatında değilse
    LOOP
        UPDATE public.nobet_index
        SET person = r.yeni_uid
        WHERE id = r.id;
        
        v_updated := v_updated + 1;
    END LOOP;
    
    RAISE NOTICE 'nobet_index: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 11. TAKRIR_GUNLUK TABLOSU
-- ============================================
-- girenUid kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.takrir_gunluk tg
    SET girenUid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE tg.girenUid = ue.eski_uid
    AND tg.girenUid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'takrir_gunluk: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 12. GENEL_TEMIZLIK_KONTROL TABLOSU
-- ============================================
-- kaydeden_uid kolonunu güncelle

DO $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    UPDATE public.genel_temizlik_kontrol gtk
    SET kaydeden_uid = ue.yeni_uid
    FROM public.uid_eslestirme ue
    WHERE gtk.kaydeden_uid = ue.eski_uid
    AND gtk.kaydeden_uid IS NOT NULL;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'genel_temizlik_kontrol: % kayıt güncellendi', v_updated;
END $$;

-- ============================================
-- 13. GÜNCELLEME RAPORU
-- ============================================
-- Güncelleme sonrası özet rapor

SELECT 
    'Güncelleme Tamamlandı' as durum,
    COUNT(*) as toplam_eslestirme
FROM public.uid_eslestirme;

-- Eşleştirilmemiş kayıt sayısı (yaklaşık)
SELECT 
    'Eşleştirilmemiş UID Sayısı (Tahmini)' as kategori,
    COUNT(DISTINCT uid) as sayi
FROM (
    SELECT uid FROM public.kullanici_log WHERE uid IS NOT NULL
    UNION
    SELECT uid FROM public.sayfa_erisimleri WHERE uid IS NOT NULL
    UNION
    SELECT uid FROM public.sayfa_loglari WHERE uid IS NOT NULL
) t
WHERE NOT EXISTS (
    SELECT 1 FROM public.uid_eslestirme 
    WHERE eski_uid = t.uid
);

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script çalıştırılmadan önce uid-eslestirme.sql çalıştırılmalı
-- 2. Tüm güncellemeler transaction içinde yapılmalı (ROLLBACK için)
-- 3. Her tablo için ayrı ayrı kontrol edilmeli
-- 4. Email bazlı eşleştirme yapılan tablolarda veri formatı kontrol edilmeli
-- 5. Güncelleme sonrası veri bütünlüğü kontrol edilmeli



