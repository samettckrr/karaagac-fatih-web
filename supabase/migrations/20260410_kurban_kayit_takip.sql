-- Talebe / ihvan için manuel "kayıt var — yok" takibi (kurban kayıt takip sayfası)
CREATE TABLE IF NOT EXISTS public.kurban_kayit_takip (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  tur text NOT NULL CHECK (tur = ANY (ARRAY['talebe'::text, 'ihvan'::text])),
  ref_id text NOT NULL,
  durum text NOT NULL CHECK (durum = ANY (ARRAY['var'::text, 'yok'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by_uid text,
  CONSTRAINT kurban_kayit_takip_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_kayit_takip_yil_tur_ref_unique UNIQUE (yil, tur, ref_id)
);

COMMENT ON TABLE public.kurban_kayit_takip IS 'Kurban kayıt takibi: talebe/ihvan satırı için manuel var-yok';

CREATE INDEX IF NOT EXISTS idx_kurban_kayit_takip_yil ON public.kurban_kayit_takip (yil);
CREATE INDEX IF NOT EXISTS idx_kurban_kayit_takip_tur ON public.kurban_kayit_takip (tur);

ALTER TABLE public.kurban_kayit_takip ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_kayit_takip_select" ON public.kurban_kayit_takip;
CREATE POLICY "kurban_kayit_takip_select" ON public.kurban_kayit_takip
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "kurban_kayit_takip_insert" ON public.kurban_kayit_takip;
CREATE POLICY "kurban_kayit_takip_insert" ON public.kurban_kayit_takip
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "kurban_kayit_takip_update" ON public.kurban_kayit_takip;
CREATE POLICY "kurban_kayit_takip_update" ON public.kurban_kayit_takip
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "kurban_kayit_takip_delete" ON public.kurban_kayit_takip;
CREATE POLICY "kurban_kayit_takip_delete" ON public.kurban_kayit_takip
  FOR DELETE USING (true);
