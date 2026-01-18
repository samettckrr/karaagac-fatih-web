-- ============================================
-- UID EŞLEŞTİRME SCRIPTİ
-- ============================================
-- Email bazlı otomatik eşleştirme ve manuel eşleştirme için tablo
-- ============================================

-- ============================================
-- 1. UID EŞLEŞTİRME TABLOSU OLUŞTUR
-- ============================================

CREATE TABLE IF NOT EXISTS public.uid_eslestirme (
    id SERIAL PRIMARY KEY,
    eski_uid TEXT NOT NULL,
    yeni_uid TEXT NOT NULL,
    email TEXT NOT NULL,
    ad_soyad TEXT,
    eslestirme_tipi TEXT DEFAULT 'otomatik', -- 'otomatik' veya 'manuel'
    eslestirme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eslestiren_uid TEXT, -- Manuel eşleştirme yapan kullanıcının UID'si
    notlar TEXT,
    UNIQUE(eski_uid),
    UNIQUE(yeni_uid, email) -- Aynı email ve yeni UID kombinasyonu tekrar edemez
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_uid_eslestirme_eski_uid ON public.uid_eslestirme(eski_uid);
CREATE INDEX IF NOT EXISTS idx_uid_eslestirme_yeni_uid ON public.uid_eslestirme(yeni_uid);
CREATE INDEX IF NOT EXISTS idx_uid_eslestirme_email ON public.uid_eslestirme(email);

-- ============================================
-- 2. EMAIL BAZLI OTOMATIK EŞLEŞTİRME
-- ============================================
-- Mevcut verilerdeki email'leri kullanarak otomatik eşleştirme yapar

DO $$
DECLARE
    r RECORD;
    v_yeni_uid TEXT;
    v_ad_soyad TEXT;
    v_eski_uid TEXT;
    v_email TEXT;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Email bazlı otomatik eşleştirme başlatılıyor...';
    
    -- kullanici_log tablosundan email'leri topla
    FOR r IN 
        SELECT DISTINCT 
            uid as eski_uid,
            email
        FROM public.kullanici_log
        WHERE uid IS NOT NULL 
        AND email IS NOT NULL
        AND email != ''
        AND NOT EXISTS (
            SELECT 1 FROM public.uid_eslestirme 
            WHERE eski_uid = kullanici_log.uid
        )
    LOOP
        v_eski_uid := r.eski_uid;
        v_email := LOWER(r.email);
        
        -- Yeni UID'yi email ile bul
        SELECT id, adSoyad INTO v_yeni_uid, v_ad_soyad
        FROM public.kullanicilar
        WHERE LOWER(email) = v_email
        LIMIT 1;
        
        -- Eğer yeni UID bulunduysa eşleştirme kaydı oluştur
        IF v_yeni_uid IS NOT NULL THEN
            INSERT INTO public.uid_eslestirme (
                eski_uid, yeni_uid, email, ad_soyad, eslestirme_tipi
            ) VALUES (
                v_eski_uid, v_yeni_uid, v_email, v_ad_soyad, 'otomatik'
            )
            ON CONFLICT (eski_uid) DO NOTHING;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    -- sayfa_erisimleri tablosundan email'leri topla
    FOR r IN 
        SELECT DISTINCT 
            uid as eski_uid,
            email
        FROM public.sayfa_erisimleri
        WHERE uid IS NOT NULL 
        AND email IS NOT NULL
        AND email != ''
        AND NOT EXISTS (
            SELECT 1 FROM public.uid_eslestirme 
            WHERE eski_uid = sayfa_erisimleri.uid
        )
    LOOP
        v_eski_uid := r.eski_uid;
        v_email := LOWER(r.email);
        
        -- Yeni UID'yi email ile bul
        SELECT id, adSoyad INTO v_yeni_uid, v_ad_soyad
        FROM public.kullanicilar
        WHERE LOWER(email) = v_email
        LIMIT 1;
        
        -- Eğer yeni UID bulunduysa eşleştirme kaydı oluştur
        IF v_yeni_uid IS NOT NULL THEN
            INSERT INTO public.uid_eslestirme (
                eski_uid, yeni_uid, email, ad_soyad, eslestirme_tipi
            ) VALUES (
                v_eski_uid, v_yeni_uid, v_email, v_ad_soyad, 'otomatik'
            )
            ON CONFLICT (eski_uid) DO NOTHING;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    -- sayfa_loglari tablosundan UID'leri topla (email yoksa kullanicilar tablosundan email bul)
    FOR r IN 
        SELECT DISTINCT 
            uid as eski_uid
        FROM public.sayfa_loglari
        WHERE uid IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.uid_eslestirme 
            WHERE eski_uid = sayfa_loglari.uid
        )
    LOOP
        v_eski_uid := r.eski_uid;
        
        -- Eski UID'den email bul (kullanicilar tablosundan - eğer hala orada varsa)
        -- NOT: Bu kısım eski veritabanından email bilgisini almak için kullanılabilir
        -- Şimdilik atlanıyor, manuel eşleştirme ile yapılacak
        
        -- Alternatif: Eski UID'yi direkt yeni UID olarak kullan (eğer aynıysa)
        SELECT id, email, adSoyad INTO v_yeni_uid, v_email, v_ad_soyad
        FROM public.kullanicilar
        WHERE id = v_eski_uid
        LIMIT 1;
        
        -- Eğer aynı UID ile kullanıcı bulunduysa eşleştirme kaydı oluştur
        IF v_yeni_uid IS NOT NULL THEN
            INSERT INTO public.uid_eslestirme (
                eski_uid, yeni_uid, email, ad_soyad, eslestirme_tipi
            ) VALUES (
                v_eski_uid, v_yeni_uid, v_email, v_ad_soyad, 'otomatik'
            )
            ON CONFLICT (eski_uid) DO NOTHING;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Otomatik eşleştirme tamamlandı. % kayıt eşleştirildi.', v_count;
END $$;

-- ============================================
-- 3. EŞLEŞTİRME RAPORU
-- ============================================
-- Eşleştirme durumunu gösteren rapor

SELECT 
    'Toplam Eşleştirme' as kategori,
    COUNT(*) as sayi
FROM public.uid_eslestirme
UNION ALL
SELECT 
    'Otomatik Eşleştirme' as kategori,
    COUNT(*) as sayi
FROM public.uid_eslestirme
WHERE eslestirme_tipi = 'otomatik'
UNION ALL
SELECT 
    'Manuel Eşleştirme' as kategori,
    COUNT(*) as sayi
FROM public.uid_eslestirme
WHERE eslestirme_tipi = 'manuel';

-- ============================================
-- 4. EŞLEŞTİRİLMEMİŞ KAYITLAR
-- ============================================
-- Eşleştirilmemiş UID'leri göster

SELECT 
    'Eşleştirilmemiş UID Sayısı' as kategori,
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
-- 5. MANUEL EŞLEŞTİRME FONKSİYONU
-- ============================================
-- Manuel eşleştirme yapmak için fonksiyon

CREATE OR REPLACE FUNCTION manuel_uid_eslestir(
    p_eski_uid TEXT,
    p_yeni_uid TEXT,
    p_email TEXT,
    p_eslestiren_uid TEXT DEFAULT NULL,
    p_notlar TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_ad_soyad TEXT;
    v_count INTEGER;
BEGIN
    -- Yeni UID'den ad soyad al
    SELECT adSoyad INTO v_ad_soyad
    FROM public.kullanicilar
    WHERE id = p_yeni_uid
    LIMIT 1;
    
    -- Eşleştirme kaydı oluştur
    INSERT INTO public.uid_eslestirme (
        eski_uid, yeni_uid, email, ad_soyad, 
        eslestirme_tipi, eslestiren_uid, notlar
    ) VALUES (
        p_eski_uid, p_yeni_uid, p_email, v_ad_soyad,
        'manuel', p_eslestiren_uid, p_notlar
    )
    ON CONFLICT (eski_uid) DO UPDATE SET
        yeni_uid = EXCLUDED.yeni_uid,
        email = EXCLUDED.email,
        ad_soyad = EXCLUDED.ad_soyad,
        eslestirme_tipi = 'manuel',
        eslestiren_uid = EXCLUDED.eslestiren_uid,
        notlar = EXCLUDED.notlar,
        eslestirme_tarihi = CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script çalıştırılmadan önce yardimci-fonksiyonlar.sql çalıştırılmalı
-- 2. Otomatik eşleştirme sadece email bilgisi olan kayıtlar için çalışır
-- 3. Eşleştirilmemiş kayıtlar manuel eşleştirme arayüzü ile eşleştirilebilir
-- 4. Eşleştirme kayıtları silinemez, sadece güncellenebilir



