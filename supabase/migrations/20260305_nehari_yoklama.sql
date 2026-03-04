-- Nehari Yoklama Sistemi
-- Her gün için: tarih, seçilen sınıflar, yoklama açık/kapalı
-- nehari.html tarafında bu ayara göre yoklama gösterilir/alınır

CREATE TABLE IF NOT EXISTS public.nehari_yoklama_gunleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarih date NOT NULL,
  siniflar integer[] NOT NULL DEFAULT '{}',
  yoklama_acik boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_yoklama_gunleri_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_yoklama_gunleri_tarih_unique UNIQUE (tarih)
);

CREATE INDEX IF NOT EXISTS idx_nehari_yoklama_gunleri_tarih
  ON public.nehari_yoklama_gunleri (tarih);

-- RLS
ALTER TABLE public.nehari_yoklama_gunleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nehari_yoklama_select" ON public.nehari_yoklama_gunleri;
CREATE POLICY "nehari_yoklama_select" ON public.nehari_yoklama_gunleri
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_insert" ON public.nehari_yoklama_gunleri;
CREATE POLICY "nehari_yoklama_insert" ON public.nehari_yoklama_gunleri
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_update" ON public.nehari_yoklama_gunleri;
CREATE POLICY "nehari_yoklama_update" ON public.nehari_yoklama_gunleri
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_delete" ON public.nehari_yoklama_gunleri;
CREATE POLICY "nehari_yoklama_delete" ON public.nehari_yoklama_gunleri
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.nehari_yoklama_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nehari_yoklama_updated_at ON public.nehari_yoklama_gunleri;
CREATE TRIGGER trg_nehari_yoklama_updated_at
  BEFORE UPDATE ON public.nehari_yoklama_gunleri
  FOR EACH ROW
  EXECUTE PROCEDURE public.nehari_yoklama_updated_at();
