-- 2026 Kurban: Bağış Hisse ve Etli Hisse kayıt tabloları
-- Bağış Hisse: Ad Soyad, Telefon (SMS için), Fiyat (tek tip), Açıklama
-- Etli Hisse: Hissedar Ad Soyad, Telefon, Hisse Grubu, Hisse Adedi, Açıklama

-- Bağış hisse (bağışlanan hisse - tek fiyat)
CREATE TABLE IF NOT EXISTS public.kurban_2026_bagis_hisse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  fiyat numeric NOT NULL DEFAULT 0,
  aciklama text,
  durum text DEFAULT 'kayit_alindi',
  CONSTRAINT kurban_2026_bagis_hisse_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.kurban_2026_bagis_hisse IS '2026 Kurban bağış hisse kayıtları (SMS: kayıt alındı, kesildi vb.)';
COMMENT ON COLUMN public.kurban_2026_bagis_hisse.telefon IS 'SMS bildirimleri için zorunlu (kayıt alındı, kesildi vb.)';
COMMENT ON COLUMN public.kurban_2026_bagis_hisse.durum IS 'Örn: kayit_alindi, kesildi';

CREATE INDEX IF NOT EXISTS idx_kurban_2026_bagis_created
  ON public.kurban_2026_bagis_hisse (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kurban_2026_bagis_created_by
  ON public.kurban_2026_bagis_hisse (created_by_uid);

-- Etli hisse (hissedar bilgileri)
CREATE TABLE IF NOT EXISTS public.kurban_2026_etli_hisse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  hisedar_ad_soyad text NOT NULL,
  telefon text NOT NULL,
  hisse_grubu text NOT NULL,
  hisse_adedi integer NOT NULL DEFAULT 1 CHECK (hisse_adedi >= 1),
  aciklama text,
  CONSTRAINT kurban_2026_etli_hisse_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.kurban_2026_etli_hisse IS '2026 Kurban etli hisse kayıtları';

CREATE INDEX IF NOT EXISTS idx_kurban_2026_etli_created
  ON public.kurban_2026_etli_hisse (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kurban_2026_etli_created_by
  ON public.kurban_2026_etli_hisse (created_by_uid);

-- RLS: Bağış hisse
ALTER TABLE public.kurban_2026_bagis_hisse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_2026_bagis_select" ON public.kurban_2026_bagis_hisse;
CREATE POLICY "kurban_2026_bagis_select" ON public.kurban_2026_bagis_hisse
  FOR SELECT USING (
    true
    OR (created_by_uid IS NOT NULL AND auth.uid()::text = created_by_uid)
  );

DROP POLICY IF EXISTS "kurban_2026_bagis_insert" ON public.kurban_2026_bagis_hisse;
CREATE POLICY "kurban_2026_bagis_insert" ON public.kurban_2026_bagis_hisse
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "kurban_2026_bagis_update" ON public.kurban_2026_bagis_hisse;
CREATE POLICY "kurban_2026_bagis_update" ON public.kurban_2026_bagis_hisse
  FOR UPDATE USING (true);

-- RLS: Etli hisse
ALTER TABLE public.kurban_2026_etli_hisse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_2026_etli_select" ON public.kurban_2026_etli_hisse;
CREATE POLICY "kurban_2026_etli_select" ON public.kurban_2026_etli_hisse
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "kurban_2026_etli_insert" ON public.kurban_2026_etli_hisse;
CREATE POLICY "kurban_2026_etli_insert" ON public.kurban_2026_etli_hisse
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "kurban_2026_etli_update" ON public.kurban_2026_etli_hisse;
CREATE POLICY "kurban_2026_etli_update" ON public.kurban_2026_etli_hisse
  FOR UPDATE USING (true);
