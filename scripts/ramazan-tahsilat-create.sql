-- ============================================
-- RAMAZAN_TAHSILAT Tablosu Oluşturma
-- ============================================
-- İftar/sahur kayıtlarındaki tutarın peşin veya taksitli tahsilatını takip eder.
-- Her tahsilat hareketi bir satır (peşin = 1 satır, taksit = N satır).
-- ramazan_kayitlari.id veya taahhut_kayitlari.id ile ilişkilidir (kayit_id).
-- kayit_tipi: 'iftar-sahur' (ramazan_kayitlari) veya 'taahhut' (taahhut_kayitlari).

CREATE TABLE IF NOT EXISTS public.ramazan_tahsilat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kayit_id text NOT NULL,
  kayit_tipi text NOT NULL DEFAULT 'iftar-sahur' CHECK (kayit_tipi IN ('iftar-sahur', 'taahhut')),
  tutar numeric NOT NULL CHECK (tutar >= 0),
  tahsilat_tarihi date NOT NULL,
  odeme_tipi text NOT NULL CHECK (odeme_tipi IN ('pesin', 'taksit')),
  taksit_no integer,
  aciklama text,
  createdat timestamp with time zone DEFAULT now(),
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  CONSTRAINT ramazan_tahsilat_pkey PRIMARY KEY (id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ramazan_tahsilat_kayit_id ON public.ramazan_tahsilat(kayit_id);
CREATE INDEX IF NOT EXISTS idx_ramazan_tahsilat_tarih ON public.ramazan_tahsilat(tahsilat_tarihi);
CREATE INDEX IF NOT EXISTS idx_ramazan_tahsilat_odeme_tipi ON public.ramazan_tahsilat(odeme_tipi);

-- Mevcut tabloya kayit_tipi ekle (tablo eskiyse sütun yoktur; önce ekleyelim ki COMMENT hata vermesin)
ALTER TABLE public.ramazan_tahsilat ADD COLUMN IF NOT EXISTS kayit_tipi text DEFAULT 'iftar-sahur';

-- Yorumlar
COMMENT ON TABLE public.ramazan_tahsilat IS 'İftar/sahur kayıtlarına ait tahsilat hareketleri (peşin veya taksit)';
COMMENT ON COLUMN public.ramazan_tahsilat.kayit_id IS 'ramazan_kayitlari.id veya taahhut_kayitlari.id';
COMMENT ON COLUMN public.ramazan_tahsilat.kayit_tipi IS 'iftar-sahur veya taahhut';
COMMENT ON COLUMN public.ramazan_tahsilat.tutar IS 'Bu hareketin tahsilat tutarı';
COMMENT ON COLUMN public.ramazan_tahsilat.tahsilat_tarihi IS 'Tahsilatın yapıldığı tarih';
COMMENT ON COLUMN public.ramazan_tahsilat.odeme_tipi IS 'pesin veya taksit';
COMMENT ON COLUMN public.ramazan_tahsilat.taksit_no IS 'Taksit numarası (1, 2, 3...); peşin ise NULL';

-- ============================================
-- RLS (Row Level Security) Politikaları
-- ============================================
ALTER TABLE public.ramazan_tahsilat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ramazan_tahsilat_select" ON public.ramazan_tahsilat;
CREATE POLICY "ramazan_tahsilat_select" ON public.ramazan_tahsilat
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ramazan_tahsilat_insert" ON public.ramazan_tahsilat;
CREATE POLICY "ramazan_tahsilat_insert" ON public.ramazan_tahsilat
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ramazan_tahsilat_update" ON public.ramazan_tahsilat;
CREATE POLICY "ramazan_tahsilat_update" ON public.ramazan_tahsilat
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ramazan_tahsilat_delete" ON public.ramazan_tahsilat;
CREATE POLICY "ramazan_tahsilat_delete" ON public.ramazan_tahsilat
  FOR DELETE
  USING (auth.role() = 'authenticated');
