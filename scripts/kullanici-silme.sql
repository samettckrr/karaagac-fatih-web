-- ============================================
-- KULLANICI SİLME SCRIPTİ
-- ============================================
-- DİKKAT: Bu script tüm kullanıcıları siler!
-- Çalıştırmadan önce MUTLAKA veritabanı yedeği alın!
-- ============================================

-- ============================================
-- 1. YEDEK ALMA UYARISI
-- ============================================
-- Bu script'i çalıştırmadan önce:
-- 1. Supabase Dashboard > Database > Backups bölümünden yedek alın
-- 2. Veya pg_dump ile manuel yedek alın
-- 3. Test ortamında önce deneyin

-- ============================================
-- 2. KULLANICILAR TABLOSUNDAN SİLME
-- ============================================
-- Önce kullanicilar tablosundaki tüm kayıtları sil
-- (Foreign key constraint'ler nedeniyle önce bu tabloyu temizliyoruz)

DELETE FROM public.kullanicilar;

-- Silinen kayıt sayısını göster
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'kullanicilar tablosundan % kayıt silindi', deleted_count;
END $$;

-- ============================================
-- 3. AUTH.USERS TABLOSUNDAN SİLME
-- ============================================
-- Supabase auth.users tablosundan tüm kullanıcıları sil
-- NOT: Bu işlem Supabase Admin API veya Dashboard üzerinden yapılmalı
-- SQL ile doğrudan auth.users silinemez (güvenlik nedeniyle)

-- Alternatif 1: Supabase Dashboard üzerinden
-- Dashboard > Authentication > Users > Tümünü seç > Delete

-- Alternatif 2: Supabase Admin API ile (Node.js script gerekir)
-- Bu script auth.users'ı silmez, sadece kullanicilar tablosunu temizler
-- Auth kullanıcılarını silmek için ayrı bir script veya manuel işlem gerekir

-- ============================================
-- 4. İLGİLİ TABLOLARI KONTROL ET
-- ============================================
-- Kullanıcı referansı olan tablolarda kaç kayıt olduğunu kontrol et

SELECT 
    'kullanici_log' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.kullanici_log
UNION ALL
SELECT 
    'sayfa_erisimleri' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.sayfa_erisimleri
UNION ALL
SELECT 
    'sayfa_loglari' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.sayfa_loglari
UNION ALL
SELECT 
    'hedefler' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.hedefler
UNION ALL
SELECT 
    'nobet_planlari' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.nobet_planlari
UNION ALL
SELECT 
    'takrir_gunluk' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.takrir_gunluk
ORDER BY tablo;

-- ============================================
-- 5. TEMİZLİK SONRASI KONTROL
-- ============================================
-- kullanicilar tablosunun boş olduğunu doğrula

SELECT 
    COUNT(*) as kalan_kullanici_sayisi
FROM public.kullanicilar;

-- Eğer 0 değilse, hata var demektir

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu script sadece kullanicilar tablosunu temizler
-- 2. auth.users tablosunu temizlemek için Supabase Dashboard veya Admin API kullanılmalı
-- 3. Diğer tablolardaki veriler (alacak takibi, hedefler vs) bu script ile silinmez
-- 4. Bu veriler daha sonra UID eşleştirme ile güncellenecek



