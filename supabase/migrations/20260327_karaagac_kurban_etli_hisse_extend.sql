-- Karaağaç kurban kesim kaydı (hayvan) + etli hisse bağlantısı
-- sqleditor.md ile uyumlu: karaagac_kurban; kurban_2026_etli_hisse.kurban_id, kapora, tahsilat
-- Çalıştırma: supabase db push / SQL Editor

-- 1) Kurban kartı (yıl + kesim sırası benzersiz; küpe, kg, grup, birim fiyat…)
CREATE TABLE IF NOT EXISTS public.karaagac_kurban (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  yil integer NOT NULL,
  kesim_sirasi integer NOT NULL CHECK (kesim_sirasi >= 1),
  kupe_no text,
  canli_kg numeric,
  hisse_grubu text NOT NULL,
  hissedar_adedi integer NOT NULL DEFAULT 7 CHECK (hissedar_adedi >= 1 AND hissedar_adedi <= 7),
  hisse_fiyati numeric,
  CONSTRAINT karaagac_kurban_pkey PRIMARY KEY (id),
  CONSTRAINT karaagac_kurban_yil_kesim_key UNIQUE (yil, kesim_sirasi)
);

COMMENT ON TABLE public.karaagac_kurban IS 'Kesim operasyonu: bir hayvan; yıl kurban_kategoriler ile uyumlu';
COMMENT ON COLUMN public.karaagac_kurban.hisse_grubu IS 'Örn. 1.Grup, 2.Grup (uygulama ile aynı metin)';
COMMENT ON COLUMN public.karaagac_kurban.hisse_fiyati IS 'Birim hisse fiyatı (₺)';

CREATE INDEX IF NOT EXISTS idx_karaagac_kurban_yil
  ON public.karaagac_kurban (yil DESC);
CREATE INDEX IF NOT EXISTS idx_karaagac_kurban_created
  ON public.karaagac_kurban (created_at DESC);

-- 2) Etli hisse: kurban bağlantısı ve özet ödeme alanları (atama sonrası doldurulabilir)
ALTER TABLE public.kurban_2026_etli_hisse
  ADD COLUMN IF NOT EXISTS kurban_id uuid;
ALTER TABLE public.kurban_2026_etli_hisse
  ADD COLUMN IF NOT EXISTS kapora numeric;
ALTER TABLE public.kurban_2026_etli_hisse
  ADD COLUMN IF NOT EXISTS tahsilat numeric;

COMMENT ON COLUMN public.kurban_2026_etli_hisse.kurban_id IS 'Atama sonrası karaagac_kurban.id';
COMMENT ON COLUMN public.kurban_2026_etli_hisse.kapora IS 'Hissedar bazlı kapora (nullable)';
COMMENT ON COLUMN public.kurban_2026_etli_hisse.tahsilat IS 'Hissedar bazlı tahsilat (nullable)';

CREATE INDEX IF NOT EXISTS idx_kurban_2026_etli_kurban_id
  ON public.kurban_2026_etli_hisse (kurban_id)
  WHERE kurban_id IS NOT NULL;

-- 3) FK (tablo zaten varsa güvenli ekleme)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kurban_2026_etli_hisse_kurban_id_fkey'
      AND conrelid = 'public.kurban_2026_etli_hisse'::regclass
  ) THEN
    ALTER TABLE public.kurban_2026_etli_hisse
      ADD CONSTRAINT kurban_2026_etli_hisse_kurban_id_fkey
      FOREIGN KEY (kurban_id) REFERENCES public.karaagac_kurban (id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) RLS: mevcut kurban tabloları ile aynı sade model
ALTER TABLE public.karaagac_kurban ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "karaagac_kurban_select" ON public.karaagac_kurban;
CREATE POLICY "karaagac_kurban_select" ON public.karaagac_kurban
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "karaagac_kurban_insert" ON public.karaagac_kurban;
CREATE POLICY "karaagac_kurban_insert" ON public.karaagac_kurban
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "karaagac_kurban_update" ON public.karaagac_kurban;
CREATE POLICY "karaagac_kurban_update" ON public.karaagac_kurban
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "karaagac_kurban_delete" ON public.karaagac_kurban;
CREATE POLICY "karaagac_kurban_delete" ON public.karaagac_kurban
  FOR DELETE USING (true);
