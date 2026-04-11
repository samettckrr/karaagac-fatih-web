-- Kurban: İhvan / Ahavat kayıtları (veriler tablosundan ayrı)
CREATE TABLE IF NOT EXISTS public.ihvan_ahavat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  kayit_tipi text NOT NULL CHECK (kayit_tipi = ANY (ARRAY['ihvan'::text, 'ahavat'::text])),
  kurum_adi text NOT NULL,
  ad_soyad text NOT NULL,
  telefon text,
  adet integer NOT NULL DEFAULT 1 CHECK (adet >= 1),
  aciklama text,
  yil integer NOT NULL DEFAULT 2026,
  CONSTRAINT ihvan_ahavat_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.ihvan_ahavat IS 'Kurban süreci ihvan ve ahavat kayıtları';

CREATE INDEX IF NOT EXISTS idx_ihvan_ahavat_created_at ON public.ihvan_ahavat (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ihvan_ahavat_yil ON public.ihvan_ahavat (yil);
CREATE INDEX IF NOT EXISTS idx_ihvan_ahavat_kayit_tipi ON public.ihvan_ahavat (kayit_tipi);

ALTER TABLE public.ihvan_ahavat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ihvan_ahavat_select" ON public.ihvan_ahavat;
CREATE POLICY "ihvan_ahavat_select" ON public.ihvan_ahavat
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ihvan_ahavat_insert" ON public.ihvan_ahavat;
CREATE POLICY "ihvan_ahavat_insert" ON public.ihvan_ahavat
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ihvan_ahavat_update" ON public.ihvan_ahavat;
CREATE POLICY "ihvan_ahavat_update" ON public.ihvan_ahavat
  FOR UPDATE USING (true);
