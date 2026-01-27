-- ============================================
-- ARSIV_HEDEFLER Tablosu Oluşturma
-- ============================================
-- Bu script, arşiv hedefler için yeni bir tablo oluşturur.
-- CSV import ile doldurulacak veriler için kullanılacak.

CREATE TABLE IF NOT EXISTS public.arsiv_hedefler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel text NOT NULL,
  uid text NOT NULL,
  yil integer NOT NULL,
  sira integer NOT NULL,
  kategori text,
  tip text,
  hedef numeric,
  tutar numeric,
  kurban_adedi integer DEFAULT 0 CHECK (kurban_adedi >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT arsiv_hedefler_pkey PRIMARY KEY (id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_arsiv_hedefler_uid ON public.arsiv_hedefler(uid);
CREATE INDEX IF NOT EXISTS idx_arsiv_hedefler_yil ON public.arsiv_hedefler(yil);
CREATE INDEX IF NOT EXISTS idx_arsiv_hedefler_yil_sira ON public.arsiv_hedefler(yil, sira);
CREATE INDEX IF NOT EXISTS idx_arsiv_hedefler_tip ON public.arsiv_hedefler(tip);

-- Yorumlar
COMMENT ON TABLE public.arsiv_hedefler IS 'Arşiv hedefler - CSV import ile doldurulacak';
COMMENT ON COLUMN public.arsiv_hedefler.personel IS 'Personel adı soyadı';
COMMENT ON COLUMN public.arsiv_hedefler.uid IS 'Personel UID (kullanicilar tablosundaki id ile eşleşmeli)';
COMMENT ON COLUMN public.arsiv_hedefler.yil IS 'Hedef yılı (2023, 2024, 2025)';
COMMENT ON COLUMN public.arsiv_hedefler.sira IS 'Hedef sıralaması (yıllık sıralama için)';
COMMENT ON COLUMN public.arsiv_hedefler.kategori IS 'Hedef kategorisi (örn: Ramazan-ı Şerif, Kurban)';
COMMENT ON COLUMN public.arsiv_hedefler.tip IS 'Hedef tipi (örn: ramazan, kurban)';
COMMENT ON COLUMN public.arsiv_hedefler.hedef IS 'Hedef tutarı (numeric)';
COMMENT ON COLUMN public.arsiv_hedefler.tutar IS 'Gerçekleşen tutar (numeric)';
COMMENT ON COLUMN public.arsiv_hedefler.kurban_adedi IS 'Kurban adedi (integer)';
