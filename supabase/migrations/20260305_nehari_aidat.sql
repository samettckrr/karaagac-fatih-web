-- Nehari Aidat Takibi
-- nehari_aidat: Talebe bazlı aylık aidat planı (başlangıç-bit injuryıl/ay)
-- nehari_aidat_odemeler: Her ödeme (tam ay, eksik ay, taksitli ödemeler)

-- Aidat planı: Her talebe için aylık tutar + başlangıç/bitiş dönemi
CREATE TABLE IF NOT EXISTS public.nehari_aidat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL REFERENCES public.nehari_talebeler(id) ON DELETE CASCADE,
  aylik_tutar numeric NOT NULL CHECK (aylik_tutar >= 0),
  baslangic_yil integer NOT NULL,
  baslangic_ay integer NOT NULL CHECK (baslangic_ay >= 1 AND baslangic_ay <= 12),
  bitis_yil integer NOT NULL,
  bitis_ay integer NOT NULL CHECK (bitis_ay >= 1 AND bitis_ay <= 12),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_aidat_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_aidat_talebe_unique UNIQUE (talebe_id)
);

CREATE INDEX IF NOT EXISTS idx_nehari_aidat_talebe
  ON public.nehari_aidat (talebe_id);

-- Ödemeler: Her taksit/ödeme kaydı (ay içinde birden fazla taksit olabilir)
CREATE TABLE IF NOT EXISTS public.nehari_aidat_odemeler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL REFERENCES public.nehari_talebeler(id) ON DELETE CASCADE,
  aidat_id uuid NOT NULL REFERENCES public.nehari_aidat(id) ON DELETE CASCADE,
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  tutar numeric NOT NULL CHECK (tutar > 0),
  odeme_tarihi date,
  taksit_sira integer NOT NULL DEFAULT 1,
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_aidat_odemeler_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_nehari_aidat_odemeler_talebe
  ON public.nehari_aidat_odemeler (talebe_id);
CREATE INDEX IF NOT EXISTS idx_nehari_aidat_odemeler_yil_ay
  ON public.nehari_aidat_odemeler (talebe_id, yil, ay);

-- RLS
ALTER TABLE public.nehari_aidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nehari_aidat_odemeler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nehari_aidat_select" ON public.nehari_aidat;
CREATE POLICY "nehari_aidat_select" ON public.nehari_aidat
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_insert" ON public.nehari_aidat;
CREATE POLICY "nehari_aidat_insert" ON public.nehari_aidat
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_update" ON public.nehari_aidat;
CREATE POLICY "nehari_aidat_update" ON public.nehari_aidat
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_delete" ON public.nehari_aidat;
CREATE POLICY "nehari_aidat_delete" ON public.nehari_aidat
  FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_odemeler_select" ON public.nehari_aidat_odemeler;
CREATE POLICY "nehari_aidat_odemeler_select" ON public.nehari_aidat_odemeler
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_odemeler_insert" ON public.nehari_aidat_odemeler;
CREATE POLICY "nehari_aidat_odemeler_insert" ON public.nehari_aidat_odemeler
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_odemeler_update" ON public.nehari_aidat_odemeler;
CREATE POLICY "nehari_aidat_odemeler_update" ON public.nehari_aidat_odemeler
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_aidat_odemeler_delete" ON public.nehari_aidat_odemeler;
CREATE POLICY "nehari_aidat_odemeler_delete" ON public.nehari_aidat_odemeler
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.nehari_aidat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nehari_aidat_updated_at ON public.nehari_aidat;
CREATE TRIGGER trg_nehari_aidat_updated_at
  BEFORE UPDATE ON public.nehari_aidat
  FOR EACH ROW
  EXECUTE PROCEDURE public.nehari_aidat_updated_at();
