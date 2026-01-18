-- ============================================
-- KULLANICI ŞİFRELERİ TABLOSU
-- ============================================
-- Admin'in belirlediği şifreleri saklamak için tablo
-- ÖNEMLİ: Şifreler plain text olarak saklanır (güvenlik riski var, ancak kullanıcı talebi doğrultusunda)
-- ============================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS public.kullanici_sifreleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    sifre TEXT NOT NULL,
    olusturan_admin_uid UUID REFERENCES auth.users(id),
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(uid)
);

-- Index oluştur (hızlı arama için)
CREATE INDEX IF NOT EXISTS idx_kullanici_sifreleri_uid ON public.kullanici_sifreleri(uid);
CREATE INDEX IF NOT EXISTS idx_kullanici_sifreleri_email ON public.kullanici_sifreleri(email);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE public.kullanici_sifreleri ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Sadece admin'ler görebilir
-- Admin kontrolü: kullanicilar tablosunda rol='admin' olan kullanıcılar
CREATE POLICY "Sadece admin'ler şifreleri görebilir"
    ON public.kullanici_sifreleri
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.kullanicilar 
            WHERE kullanicilar.id = auth.uid() 
            AND kullanicilar.rol = 'admin'
            AND kullanicilar.aktif = true
        )
    );

-- RLS Politikası: Sadece admin'ler şifre ekleyebilir/güncelleyebilir
CREATE POLICY "Sadece admin'ler şifre ekleyebilir/güncelleyebilir"
    ON public.kullanici_sifreleri
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.kullanicilar 
            WHERE kullanicilar.id = auth.uid() 
            AND kullanicilar.rol = 'admin'
            AND kullanicilar.aktif = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.kullanicilar 
            WHERE kullanicilar.id = auth.uid() 
            AND kullanicilar.rol = 'admin'
            AND kullanicilar.aktif = true
        )
    );

-- Güncelleme tarihi otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_kullanici_sifreleri_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.guncelleme_tarihi = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kullanici_sifreleri_timestamp_trigger
    BEFORE UPDATE ON public.kullanici_sifreleri
    FOR EACH ROW
    EXECUTE FUNCTION update_kullanici_sifreleri_timestamp();

-- ============================================
-- KONTROL
-- ============================================
-- Tablonun oluşturulduğunu kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'kullanici_sifreleri'
ORDER BY ordinal_position;

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu tablo admin'in belirlediği şifreleri saklar
-- 2. Kullanıcı kendi şifresini değiştirdiğinde bu tablo güncellenmez
-- 3. Sadece admin'ler bu tabloya erişebilir (RLS politikaları ile)
-- 4. Şifreler plain text olarak saklanır (güvenlik riski var)
-- 5. Kullanıcı silindiğinde şifre kaydı da otomatik silinir (CASCADE)
