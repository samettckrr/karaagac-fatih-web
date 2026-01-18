-- kullanici_log tablosunu oluştur

CREATE TABLE IF NOT EXISTS public.kullanici_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT,
    email TEXT,
    durum TEXT NOT NULL,
    mesaj TEXT NOT NULL,
    zaman TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_kullanici_log_zaman ON public.kullanici_log(zaman DESC);
CREATE INDEX IF NOT EXISTS idx_kullanici_log_uid ON public.kullanici_log(uid);
CREATE INDEX IF NOT EXISTS idx_kullanici_log_durum ON public.kullanici_log(durum);

-- Row Level Security (RLS) - Eğer RLS aktifse, insert'e izin ver
-- Önce RLS'i kontrol et, eğer aktifse politikaları ekle
DO $$
BEGIN
    -- RLS aktif mi kontrol et
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'kullanici_log'
    ) THEN
        -- RLS'i devre dışı bırak (log tablosu için genelde gerekli değil)
        ALTER TABLE public.kullanici_log DISABLE ROW LEVEL SECURITY;
        
        -- Veya eğer RLS aktif kalacaksa, herkese insert izni ver
        -- ALTER TABLE public.kullanici_log ENABLE ROW LEVEL SECURITY;
        -- CREATE POLICY "Herkes log ekleyebilir" ON public.kullanici_log
        --     FOR INSERT WITH (true);
    END IF;
END $$;

