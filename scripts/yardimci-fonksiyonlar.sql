-- ============================================
-- YARDIMCI FONKSİYONLAR
-- ============================================
-- Email ve UID eşleştirme için yardımcı fonksiyonlar
-- ============================================

-- ============================================
-- 1. EMAIL'DEN YENİ UID BULMA
-- ============================================
-- Email adresine göre kullanicilar tablosundan UID döndürür

CREATE OR REPLACE FUNCTION get_uid_by_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_uid TEXT;
BEGIN
    SELECT id INTO v_uid
    FROM public.kullanicilar
    WHERE LOWER(email) = LOWER(p_email)
    LIMIT 1;
    
    RETURN v_uid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. ESKİ UID'DEN YENİ UID BULMA
-- ============================================
-- uid_eslestirme tablosundan eski UID'ye karşılık gelen yeni UID'yi döndürür

CREATE OR REPLACE FUNCTION get_new_uid_by_old_uid(p_old_uid TEXT)
RETURNS TEXT AS $$
DECLARE
    v_new_uid TEXT;
BEGIN
    SELECT yeni_uid INTO v_new_uid
    FROM public.uid_eslestirme
    WHERE eski_uid = p_old_uid
    LIMIT 1;
    
    RETURN v_new_uid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. EMAIL'DEN YENİ UID BULMA (ESLEŞTIRME TABLOSU ÜZERİNDEN)
-- ============================================
-- Email'e göre önce uid_eslestirme tablosundan, yoksa kullanicilar tablosundan UID bulur

CREATE OR REPLACE FUNCTION get_uid_by_email_with_mapping(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_uid TEXT;
BEGIN
    -- Önce esleştirme tablosundan bak
    SELECT yeni_uid INTO v_uid
    FROM public.uid_eslestirme
    WHERE LOWER(email) = LOWER(p_email)
    LIMIT 1;
    
    -- Bulunamazsa kullanicilar tablosundan bak
    IF v_uid IS NULL THEN
        SELECT id INTO v_uid
        FROM public.kullanicilar
        WHERE LOWER(email) = LOWER(p_email)
        LIMIT 1;
    END IF;
    
    RETURN v_uid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. EMAIL'DEN PERSONEL ADI BULMA
-- ============================================
-- Email'e göre personel adını döndürür (islemler, tahakkuklar vs tabloları için)

CREATE OR REPLACE FUNCTION get_personel_name_by_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_ad_soyad TEXT;
BEGIN
    SELECT adSoyad INTO v_ad_soyad
    FROM public.kullanicilar
    WHERE LOWER(email) = LOWER(p_email)
    LIMIT 1;
    
    RETURN v_ad_soyad;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TOPLU UID GÜNCELLEME FONKSİYONU
-- ============================================
-- Belirli bir tablo ve kolon için UID güncelleme yapar

CREATE OR REPLACE FUNCTION update_uid_in_table(
    p_table_name TEXT,
    p_column_name TEXT,
    p_old_uid TEXT,
    p_new_uid TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
    v_sql TEXT;
BEGIN
    -- SQL injection koruması için tablo ve kolon isimlerini kontrol et
    IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'Geçersiz tablo ismi: %', p_table_name;
    END IF;
    
    IF p_column_name !~ '^[a-z_][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'Geçersiz kolon ismi: %', p_column_name;
    END IF;
    
    -- Dinamik SQL oluştur
    v_sql := format(
        'UPDATE %I SET %I = $1 WHERE %I = $2',
        p_table_name,
        p_column_name,
        p_column_name
    );
    
    -- Güncelleme yap
    EXECUTE v_sql USING p_new_uid, p_old_uid;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. EMAIL İLE TOPLU UID GÜNCELLEME
-- ============================================
-- Email bazlı eşleştirme ile UID güncelleme yapar

CREATE OR REPLACE FUNCTION update_uid_by_email(
    p_table_name TEXT,
    p_column_name TEXT,
    p_email TEXT,
    p_new_uid TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
    v_sql TEXT;
BEGIN
    -- SQL injection koruması
    IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'Geçersiz tablo ismi: %', p_table_name;
    END IF;
    
    IF p_column_name !~ '^[a-z_][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'Geçersiz kolon ismi: %', p_column_name;
    END IF;
    
    -- Email ile eşleşen kayıtları bul ve güncelle
    -- NOT: Bu fonksiyon sadece email kolonu olan tablolar için çalışır
    -- Diğer tablolar için get_uid_by_email_with_mapping kullanılmalı
    
    v_sql := format(
        'UPDATE %I SET %I = $1 WHERE LOWER(email) = LOWER($2)',
        p_table_name,
        p_column_name
    );
    
    EXECUTE v_sql USING p_new_uid, p_email;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ESLEŞTIRME DURUMU KONTROL FONKSİYONU
-- ============================================
-- Bir email'in eşleştirilip eşleştirilmediğini kontrol eder

CREATE OR REPLACE FUNCTION is_email_mapped(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.uid_eslestirme
    WHERE LOWER(email) = LOWER(p_email);
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. ESLEŞTIRILMEMIŞ EMAIL'LERİ LİSTELE
-- ============================================
-- Eşleştirilmemiş email'leri döndüren fonksiyon

CREATE OR REPLACE FUNCTION get_unmapped_emails()
RETURNS TABLE(email TEXT, old_uid TEXT, ad_soyad TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        COALESCE(
            (SELECT email FROM public.kullanicilar WHERE id = t.uid LIMIT 1),
            t.email
        ) as email,
        t.uid as old_uid,
        COALESCE(
            (SELECT adSoyad FROM public.kullanicilar WHERE id = t.uid LIMIT 1),
            'Bilinmiyor'
        ) as ad_soyad
    FROM (
        -- kullanici_log tablosundan
        SELECT DISTINCT uid, email
        FROM public.kullanici_log
        WHERE uid IS NOT NULL
        UNION
        -- sayfa_erisimleri tablosundan
        SELECT DISTINCT uid, email
        FROM public.sayfa_erisimleri
        WHERE uid IS NOT NULL
        UNION
        -- sayfa_loglari tablosundan
        SELECT DISTINCT uid, '' as email
        FROM public.sayfa_loglari
        WHERE uid IS NOT NULL
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM public.uid_eslestirme
        WHERE eski_uid = t.uid
    )
    AND t.uid IS NOT NULL
    ORDER BY email;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu fonksiyonlar uid_eslestirme tablosunun varlığını varsayar
-- 2. uid_eslestirme tablosu uid-eslestirme.sql script'i ile oluşturulacak
-- 3. Fonksiyonlar güvenlik için SQL injection koruması içerir
-- 4. Tablo ve kolon isimleri sadece küçük harf, alt çizgi ve rakam içerebilir



