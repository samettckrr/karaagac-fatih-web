-- Kurban yıl/kategori sistemi: 2025 Kurban, 2026 Kurban vb. - aktif/pasif
-- Ayarlar sekmesinde yönetilir, kayıtlar yıla göre filtrelenir

-- Kategori tablosu: yıl seç, kaydet, aktif yap
CREATE TABLE IF NOT EXISTS public.kurban_kategoriler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  aktif boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kurban_kategoriler_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.kurban_kategoriler IS 'Kurban yılları: 2025 Kurban, 2026 Kurban vb. - tek bir yıl aktif olabilir';

CREATE INDEX IF NOT EXISTS idx_kurban_kategoriler_aktif
  ON public.kurban_kategoriler (aktif) WHERE aktif = true;

ALTER TABLE public.kurban_kategoriler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_kategoriler_select" ON public.kurban_kategoriler;
CREATE POLICY "kurban_kategoriler_select" ON public.kurban_kategoriler FOR SELECT USING (true);
DROP POLICY IF EXISTS "kurban_kategoriler_insert" ON public.kurban_kategoriler;
CREATE POLICY "kurban_kategoriler_insert" ON public.kurban_kategoriler FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kurban_kategoriler_update" ON public.kurban_kategoriler;
CREATE POLICY "kurban_kategoriler_update" ON public.kurban_kategoriler FOR UPDATE USING (true);
DROP POLICY IF EXISTS "kurban_kategoriler_delete" ON public.kurban_kategoriler;
CREATE POLICY "kurban_kategoriler_delete" ON public.kurban_kategoriler FOR DELETE USING (true);

-- Mevcut tablolara yil kolonu ekle
ALTER TABLE public.kurban_2026_bagis_hisse
  ADD COLUMN IF NOT EXISTS yil integer DEFAULT 2026;

ALTER TABLE public.kurban_2026_etli_hisse
  ADD COLUMN IF NOT EXISTS yil integer DEFAULT 2026;

ALTER TABLE public.kurban_onkayit
  ADD COLUMN IF NOT EXISTS yil integer DEFAULT 2026;

-- Mevcut kayıtları 2026 yap
UPDATE public.kurban_2026_bagis_hisse SET yil = 2026 WHERE yil IS NULL;
UPDATE public.kurban_2026_etli_hisse SET yil = 2026 WHERE yil IS NULL;
UPDATE public.kurban_onkayit SET yil = 2026 WHERE yil IS NULL;

CREATE INDEX IF NOT EXISTS idx_kurban_bagis_yil ON public.kurban_2026_bagis_hisse (yil);
CREATE INDEX IF NOT EXISTS idx_kurban_etli_yil ON public.kurban_2026_etli_hisse (yil);
CREATE INDEX IF NOT EXISTS idx_kurban_onkayit_yil ON public.kurban_onkayit (yil);

-- Başlangıç: 2026 Kurban aktif
INSERT INTO public.kurban_kategoriler (yil, label, aktif)
VALUES (2026, '2026 Kurban', true)
ON CONFLICT (yil) DO UPDATE SET label = EXCLUDED.label, aktif = EXCLUDED.aktif;
