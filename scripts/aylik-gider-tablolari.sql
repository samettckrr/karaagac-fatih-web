-- AYLIK GIDER TABLOLARI VE RLS
-- ============================================
-- gider_kalemleri: ana/alt kategori (İaşe, Domates, Salatalık vb.)
-- aylik_giderler: hareket (tarih, kalem, tutar)
-- Genel Mizan / Aylık Giderler sayfası için.

-- ============================================
-- 1. TABLOLAR
-- ============================================

-- Gider kalemleri (sözlük): ana kategori parent_id NULL, alt kategori parent_id = ana id
CREATE TABLE IF NOT EXISTS public.gider_kalemleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  parent_id uuid REFERENCES public.gider_kalemleri(id) ON DELETE SET NULL,
  sira integer NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gider_kalemleri_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.gider_kalemleri IS 'Gider kalemleri sözlüğü: ana kategori (örn. İaşe) ve alt kalemler (Domates, Salatalık). Ödeme sadece alt kaleme yazılır.';
COMMENT ON COLUMN public.gider_kalemleri.parent_id IS 'NULL = ana kategori; dolu = alt kategori (bu ana altında)';

-- Aylık gider hareketleri: her ödeme bir satır, kalem_id = alt kalem (yaprak)
CREATE TABLE IF NOT EXISTS public.aylik_giderler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  kalem_id uuid NOT NULL REFERENCES public.gider_kalemleri(id) ON DELETE RESTRICT,
  tutar numeric NOT NULL CHECK (tutar >= 0),
  tarih date NOT NULL,
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT aylik_giderler_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.aylik_giderler IS 'Aylık gider hareketleri; kalem_id her zaman alt kalem (gider_kalemleri.parent_id IS NOT NULL).';
COMMENT ON COLUMN public.aylik_giderler.kalem_id IS 'Alt kalem (örn. Domates, Salatalık); ana kaleme doğrudan yazılmaz.';

-- İndeksler (raporlama hızı)
CREATE INDEX IF NOT EXISTS idx_aylik_giderler_yil_ay ON public.aylik_giderler(yil, ay);
CREATE INDEX IF NOT EXISTS idx_aylik_giderler_kalem_id ON public.aylik_giderler(kalem_id);
CREATE INDEX IF NOT EXISTS idx_aylik_giderler_tarih ON public.aylik_giderler(tarih);
CREATE INDEX IF NOT EXISTS idx_gider_kalemleri_parent_id ON public.gider_kalemleri(parent_id);
CREATE INDEX IF NOT EXISTS idx_gider_kalemleri_aktif ON public.gider_kalemleri(aktif) WHERE aktif = true;

-- ============================================
-- 2. RLS
-- ============================================

ALTER TABLE public.gider_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aylik_giderler ENABLE ROW LEVEL SECURITY;

-- gider_kalemleri: authenticated okuma/yazma
DROP POLICY IF EXISTS "gider_kalemleri_select" ON public.gider_kalemleri;
CREATE POLICY "gider_kalemleri_select" ON public.gider_kalemleri
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "gider_kalemleri_insert" ON public.gider_kalemleri;
CREATE POLICY "gider_kalemleri_insert" ON public.gider_kalemleri
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "gider_kalemleri_update" ON public.gider_kalemleri;
CREATE POLICY "gider_kalemleri_update" ON public.gider_kalemleri
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "gider_kalemleri_delete" ON public.gider_kalemleri;
CREATE POLICY "gider_kalemleri_delete" ON public.gider_kalemleri
  FOR DELETE USING (auth.role() = 'authenticated');

-- aylik_giderler: authenticated okuma/yazma
DROP POLICY IF EXISTS "aylik_giderler_select" ON public.aylik_giderler;
CREATE POLICY "aylik_giderler_select" ON public.aylik_giderler
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aylik_giderler_insert" ON public.aylik_giderler;
CREATE POLICY "aylik_giderler_insert" ON public.aylik_giderler
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aylik_giderler_update" ON public.aylik_giderler;
CREATE POLICY "aylik_giderler_update" ON public.aylik_giderler
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aylik_giderler_delete" ON public.aylik_giderler;
CREATE POLICY "aylik_giderler_delete" ON public.aylik_giderler
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 3. SEED: Örnek kalemler (İaşe ana; Domates, Salatalık alt)
-- ============================================

INSERT INTO public.gider_kalemleri (id, ad, parent_id, sira, aktif)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'İaşe', NULL, 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gider_kalemleri (id, ad, parent_id, sira, aktif)
VALUES
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Domates', 'a0000000-0000-0000-0000-000000000001'::uuid, 1, true),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'Salatalık', 'a0000000-0000-0000-0000-000000000001'::uuid, 2, true),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Diğer Sebze', 'a0000000-0000-0000-0000-000000000001'::uuid, 3, true)
ON CONFLICT (id) DO NOTHING;
