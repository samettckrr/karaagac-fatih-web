-- ============================================
-- ADMIN KULLANICI EKLEME SCRIPTİ
-- ============================================
-- Bu script Supabase SQL Editor'de çalıştırılmalı
-- ÖNEMLİ: Önce Supabase Dashboard > Authentication > Users üzerinden kullanıcıyı ekleyin!
-- ============================================

-- ============================================
-- ADIM 1: SUPABASE DASHBOARD'DAN KULLANICI EKLE
-- ============================================
-- 1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
-- 2. Projenizi seçin
-- 3. Sol menüden "Authentication" > "Users" seçin
-- 4. "Add User" butonuna tıklayın
-- 5. Şu bilgileri girin:
--    - Email: chakaer5534@gmail.com
--    - Password: 123456
--    - Auto Confirm User: ✅ (işaretli olmalı!)
-- 6. "Create User" butonuna tıklayın
-- 7. Kullanıcı oluşturulduktan sonra bu script'in ADIM 2'sini çalıştırın

-- ============================================
-- ADIM 2: KULLANICILAR TABLOSUNA KAYIT EKLE
-- ============================================

DO $$
DECLARE
    v_user_id TEXT;
    v_email TEXT := 'chakaer5534@gmail.com';
    v_ad_soyad TEXT := 'Admin Kullanıcı';
    v_rol TEXT := 'admin';
    v_gorev TEXT := 'Sistem Yöneticisi';
    v_yetkiler TEXT[] := ARRAY['*']; -- Tüm yetkiler (* = tüm yetkiler)
    v_aktif BOOLEAN := true;
BEGIN
    -- Auth.users'dan UID'yi al
    SELECT id::TEXT INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcı auth.users tablosunda bulunamadı! Önce Supabase Dashboard > Authentication > Users üzerinden kullanıcıyı ekleyin. Email: %, Şifre: 123456, Auto Confirm: true', v_email;
    END IF;
    
    RAISE NOTICE 'Kullanıcı bulundu. UID: %', v_user_id;
    
    -- kullanicilar tablosuna ekle veya güncelle
    INSERT INTO public.kullanicilar (
        id,
        adsoyad,
        email,
        rol,
        gorev,
        aktif,
        eklenmetarihi,
        yetkiler
    ) VALUES (
        v_user_id,
        v_ad_soyad,
        v_email,
        v_rol,
        v_gorev,
        v_aktif,
        NOW(),
        v_yetkiler
    )
    ON CONFLICT (id) DO UPDATE SET
        adsoyad = EXCLUDED.adsoyad,
        email = EXCLUDED.email,
        rol = EXCLUDED.rol,
        gorev = EXCLUDED.gorev,
        aktif = EXCLUDED.aktif,
        yetkiler = EXCLUDED.yetkiler;
    
    RAISE NOTICE '✅ Kullanıcı başarıyla eklendi/güncellendi!';
    RAISE NOTICE 'UID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Şifre: 123456';
    RAISE NOTICE 'Rol: %', v_rol;
    RAISE NOTICE 'Yetkiler: %', v_yetkiler;
END $$;

-- ============================================
-- 3. KONTROL
-- ============================================
-- Eklenen kullanıcıyı kontrol et

SELECT 
    id,
    adsoyad,
    email,
    rol,
    gorev,
    aktif,
    yetkiler,
    eklenmetarihi
FROM public.kullanicilar
WHERE email = 'chakaer5534@gmail.com';

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script çalıştırılmadan önce Supabase Dashboard > Authentication > Users üzerinden
--    kullanıcıyı manuel olarak eklemeniz gerekebilir
-- 2. Email: chakaer5534@gmail.com
-- 3. Password: 123456
-- 4. Auto Confirm: true (önemli!)
-- 5. Eğer kullanıcı zaten varsa, sadece kullanicilar tablosuna kayıt eklenir/güncellenir

