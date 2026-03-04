-- Nehari Yoklama Kayıtları
-- Her talebe-tarih için: geldi / gelmedi / izinli

CREATE TABLE IF NOT EXISTS public.nehari_yoklama_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarih date NOT NULL,
  talebe_id uuid NOT NULL REFERENCES public.nehari_talebeler(id) ON DELETE CASCADE,
  durum text NOT NULL DEFAULT 'gelmedi' CHECK (durum IN ('geldi', 'gelmedi', 'izinli')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_yoklama_kayitlari_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_yoklama_kayitlari_tarih_talebe_unique UNIQUE (tarih, talebe_id)
);

CREATE INDEX IF NOT EXISTS idx_nehari_yoklama_kayitlari_tarih
  ON public.nehari_yoklama_kayitlari (tarih);
CREATE INDEX IF NOT EXISTS idx_nehari_yoklama_kayitlari_talebe
  ON public.nehari_yoklama_kayitlari (talebe_id);

ALTER TABLE public.nehari_yoklama_kayitlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nehari_yoklama_kayitlari_select" ON public.nehari_yoklama_kayitlari;
CREATE POLICY "nehari_yoklama_kayitlari_select" ON public.nehari_yoklama_kayitlari
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_kayitlari_insert" ON public.nehari_yoklama_kayitlari;
CREATE POLICY "nehari_yoklama_kayitlari_insert" ON public.nehari_yoklama_kayitlari
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_kayitlari_update" ON public.nehari_yoklama_kayitlari;
CREATE POLICY "nehari_yoklama_kayitlari_update" ON public.nehari_yoklama_kayitlari
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nehari_yoklama_kayitlari_delete" ON public.nehari_yoklama_kayitlari;
CREATE POLICY "nehari_yoklama_kayitlari_delete" ON public.nehari_yoklama_kayitlari
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.nehari_yoklama_kayitlari_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nehari_yoklama_kayitlari_updated_at ON public.nehari_yoklama_kayitlari;
CREATE TRIGGER trg_nehari_yoklama_kayitlari_updated_at
  BEFORE UPDATE ON public.nehari_yoklama_kayitlari
  FOR EACH ROW
  EXECUTE PROCEDURE public.nehari_yoklama_kayitlari_updated_at();
