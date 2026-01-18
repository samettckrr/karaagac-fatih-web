-- Bildirim sistemi için gerekli tabloları oluştur

-- 1. Ana bildirimler tablosu
CREATE TABLE IF NOT EXISTS public.bildirimler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik TEXT NOT NULL,
    icerik TEXT NOT NULL,
    tip TEXT NOT NULL CHECK (tip IN ('toplu', 'kisisel')),
    gonderici_uid TEXT NOT NULL,
    hedef_rol TEXT,
    hedef_uid TEXT,
    hedef_kullanici_sayisi INTEGER DEFAULT 0,
    yeniden_gonderildi BOOLEAN DEFAULT FALSE,
    orijinal_bildirim_id UUID,
    guncellendi BOOLEAN DEFAULT FALSE,
    guncelleme_zamani TIMESTAMPTZ,
    zaman TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kullanıcı bildirimleri tablosu (her kullanıcının aldığı bildirimler)
CREATE TABLE IF NOT EXISTS public.kullanici_bildirimleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kullanici_uid TEXT NOT NULL,
    bildirim_id UUID NOT NULL REFERENCES public.bildirimler(id) ON DELETE CASCADE,
    baslik TEXT NOT NULL,
    icerik TEXT NOT NULL,
    tip TEXT NOT NULL CHECK (tip IN ('toplu', 'kisisel')),
    gonderici_uid TEXT NOT NULL,
    okundu_mu BOOLEAN DEFAULT FALSE,
    okunma_zamani TIMESTAMPTZ,
    guncelleme_zamani TIMESTAMPTZ,
    zaman TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kullanici_uid, bildirim_id)
);

-- 3. Kullanıcı bildirim sayacı tablosu
CREATE TABLE IF NOT EXISTS public.kullanici_bildirim_sayac (
    kullanici_uid TEXT PRIMARY KEY,
    toplam_bildirim INTEGER DEFAULT 0,
    okunmamis_bildirim INTEGER DEFAULT 0,
    son_guncelleme TIMESTAMPTZ DEFAULT NOW()
);

-- 4. İşlem log tablosu (varsa kullanılır, yoksa oluşturulur)
CREATE TABLE IF NOT EXISTS public.islem_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    islem TEXT NOT NULL,
    uid TEXT,
    zaman TIMESTAMPTZ DEFAULT NOW(),
    detay JSONB
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_bildirimler_created_at ON public.bildirimler(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bildirimler_tip ON public.bildirimler(tip);
CREATE INDEX IF NOT EXISTS idx_kullanici_bildirimleri_kullanici_uid ON public.kullanici_bildirimleri(kullanici_uid);
CREATE INDEX IF NOT EXISTS idx_kullanici_bildirimleri_bildirim_id ON public.kullanici_bildirimleri(bildirim_id);
CREATE INDEX IF NOT EXISTS idx_kullanici_bildirimleri_okundu_mu ON public.kullanici_bildirimleri(okundu_mu);
CREATE INDEX IF NOT EXISTS idx_islem_log_zaman ON public.islem_log(zaman DESC);

-- Row Level Security (RLS) politikaları (isteğe bağlı - güvenlik için)
-- ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.kullanici_bildirimleri ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.kullanici_bildirim_sayac ENABLE ROW LEVEL SECURITY;

-- Örnek RLS politikaları (kullanıcılar sadece kendi bildirimlerini görebilir)
-- CREATE POLICY "Kullanıcılar kendi bildirimlerini görebilir" ON public.kullanici_bildirimleri
--     FOR SELECT USING (kullanici_uid = auth.uid()::text);

