-- Nehari: talebe seçimli detaylı kayıt formu (adres, aile, kardeşler)
-- sqleditor.md ile senkron tutulur.

CREATE TABLE IF NOT EXISTS public.nehari_talebe_kayit_formu (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL,
  ad text NOT NULL,
  soyad text NOT NULL,
  sinif integer NOT NULL,
  dogum_tarihi date,
  memleket text,
  tc_kimlik_no text,
  adres_il text,
  adres_ilce text,
  adres_mahalle text,
  adres_cadde text,
  adres_sokak text,
  adres_site_apartman text,
  adres_bina_no text,
  adres_kat text,
  adres_daire text,
  anne_adi text NOT NULL,
  anne_meslek text NOT NULL,
  anne_durum text NOT NULL,
  baba_adi text NOT NULL,
  baba_meslek text NOT NULL,
  baba_durum text NOT NULL,
  anne_baba_beraber boolean NOT NULL,
  aile_maddi_durum text NOT NULL,
  kardes_sayisi integer NOT NULL DEFAULT 0,
  kardesler jsonb NOT NULL DEFAULT '[]'::jsonb,
  olusturan uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nehari_talebe_kayit_formu_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_talebe_kayit_formu_talebe_id_fkey
    FOREIGN KEY (talebe_id) REFERENCES public.nehari_talebeler (id) ON DELETE CASCADE,
  CONSTRAINT nehari_talebe_kayit_formu_sinif_check
    CHECK (sinif >= 1 AND sinif <= 12),
  CONSTRAINT nehari_talebe_kayit_formu_anne_durum_check
    CHECK (anne_durum = ANY (ARRAY['ahavat'::text, 'muhibban'::text, 'diger'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_baba_durum_check
    CHECK (baba_durum = ANY (ARRAY['ihvan'::text, 'muhibban'::text, 'diger'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_maddi_check
    CHECK (aile_maddi_durum = ANY (ARRAY['zayif'::text, 'orta'::text, 'iyi'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_kardes_sayisi_check
    CHECK (kardes_sayisi >= 0 AND kardes_sayisi <= 20)
);

CREATE INDEX IF NOT EXISTS idx_nehari_talebe_kayit_formu_talebe
  ON public.nehari_talebe_kayit_formu (talebe_id);

CREATE INDEX IF NOT EXISTS idx_nehari_talebe_kayit_formu_created
  ON public.nehari_talebe_kayit_formu (created_at DESC);

ALTER TABLE public.nehari_talebe_kayit_formu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nehari_talebe_kayit_formu_select" ON public.nehari_talebe_kayit_formu;
CREATE POLICY "nehari_talebe_kayit_formu_select" ON public.nehari_talebe_kayit_formu
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_talebe_kayit_formu_insert" ON public.nehari_talebe_kayit_formu;
CREATE POLICY "nehari_talebe_kayit_formu_insert" ON public.nehari_talebe_kayit_formu
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_talebe_kayit_formu_update" ON public.nehari_talebe_kayit_formu;
CREATE POLICY "nehari_talebe_kayit_formu_update" ON public.nehari_talebe_kayit_formu
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_talebe_kayit_formu_delete" ON public.nehari_talebe_kayit_formu;
CREATE POLICY "nehari_talebe_kayit_formu_delete" ON public.nehari_talebe_kayit_formu
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.nehari_talebe_kayit_formu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nehari_talebe_kayit_formu_updated_at ON public.nehari_talebe_kayit_formu;
CREATE TRIGGER trg_nehari_talebe_kayit_formu_updated_at
  BEFORE UPDATE ON public.nehari_talebe_kayit_formu
  FOR EACH ROW
  EXECUTE PROCEDURE public.nehari_talebe_kayit_formu_updated_at();
