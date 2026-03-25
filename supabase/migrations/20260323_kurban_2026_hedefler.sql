-- 2026 Kurban: Personel bağış hisse ve etli hisse hedefleri
-- hedef-grafik.html Kurban ekranında kullanılır

CREATE TABLE IF NOT EXISTS public.kurban_2026_hedefler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel text,
  bagis_hedef integer NOT NULL DEFAULT 0 CHECK (bagis_hedef >= 0),
  etli_hedef integer NOT NULL DEFAULT 0 CHECK (etli_hedef >= 0),
  yil integer NOT NULL DEFAULT 2026,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kurban_2026_hedefler_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_2026_hedefler_uid_yil_unique UNIQUE (personel_uid, yil)
);

COMMENT ON TABLE public.kurban_2026_hedefler IS '2026 Kurban personel hedefleri: bağış hisse ve etli hisse adet hedefleri';

CREATE INDEX IF NOT EXISTS idx_kurban_2026_hedefler_uid
  ON public.kurban_2026_hedefler (personel_uid);
CREATE INDEX IF NOT EXISTS idx_kurban_2026_hedefler_yil
  ON public.kurban_2026_hedefler (yil);

ALTER TABLE public.kurban_2026_hedefler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_2026_hedefler_select" ON public.kurban_2026_hedefler;
CREATE POLICY "kurban_2026_hedefler_select" ON public.kurban_2026_hedefler
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "kurban_2026_hedefler_insert" ON public.kurban_2026_hedefler;
CREATE POLICY "kurban_2026_hedefler_insert" ON public.kurban_2026_hedefler
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "kurban_2026_hedefler_update" ON public.kurban_2026_hedefler;
CREATE POLICY "kurban_2026_hedefler_update" ON public.kurban_2026_hedefler
  FOR UPDATE USING (true);
