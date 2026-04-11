-- Ahavat: sabit hedef adet + bağış hisse ile izlenecek isim listesi (ihvan_ahavat ahavat kaydı değil)
CREATE TABLE IF NOT EXISTS public.kurban_ahavat_hedef (
  yil integer NOT NULL,
  hedef_adet integer NOT NULL CHECK (hedef_adet >= 0),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by_uid text,
  CONSTRAINT kurban_ahavat_hedef_pkey PRIMARY KEY (yil)
);

COMMENT ON TABLE public.kurban_ahavat_hedef IS 'Kurban yılına göre ahavat toplam (ör. 35 kişi)';

CREATE TABLE IF NOT EXISTS public.kurban_ahavat_bagis_izle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  ad_soyad text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  CONSTRAINT kurban_ahavat_bagis_izle_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_ahavat_bagis_izle_yil_ad_unique UNIQUE (yil, ad_soyad)
);

COMMENT ON TABLE public.kurban_ahavat_bagis_izle IS 'Ahavat havuzundan bağış hisse ile eşleştirilecek isimler (talebe/ihvandan sonra kalan havuz)';

CREATE INDEX IF NOT EXISTS idx_kurban_ahavat_bagis_izle_yil ON public.kurban_ahavat_bagis_izle (yil);

ALTER TABLE public.kurban_ahavat_hedef ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kurban_ahavat_bagis_izle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_ahavat_hedef_select" ON public.kurban_ahavat_hedef;
CREATE POLICY "kurban_ahavat_hedef_select" ON public.kurban_ahavat_hedef FOR SELECT USING (true);
DROP POLICY IF EXISTS "kurban_ahavat_hedef_insert" ON public.kurban_ahavat_hedef;
CREATE POLICY "kurban_ahavat_hedef_insert" ON public.kurban_ahavat_hedef FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kurban_ahavat_hedef_update" ON public.kurban_ahavat_hedef;
CREATE POLICY "kurban_ahavat_hedef_update" ON public.kurban_ahavat_hedef FOR UPDATE USING (true);

DROP POLICY IF EXISTS "kurban_ahavat_bagis_izle_select" ON public.kurban_ahavat_bagis_izle;
CREATE POLICY "kurban_ahavat_bagis_izle_select" ON public.kurban_ahavat_bagis_izle FOR SELECT USING (true);
DROP POLICY IF EXISTS "kurban_ahavat_bagis_izle_insert" ON public.kurban_ahavat_bagis_izle;
CREATE POLICY "kurban_ahavat_bagis_izle_insert" ON public.kurban_ahavat_bagis_izle FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kurban_ahavat_bagis_izle_delete" ON public.kurban_ahavat_bagis_izle;
CREATE POLICY "kurban_ahavat_bagis_izle_delete" ON public.kurban_ahavat_bagis_izle FOR DELETE USING (true);
