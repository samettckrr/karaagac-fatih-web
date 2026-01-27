-- ============================================
-- PERSONEL_ODEME_TAKVIM Tablosu Oluşturma
-- ============================================
-- Bu script, personel ödeme takvimi için yeni bir tablo oluşturur.
-- CSV import ile doldurulacak veriler için kullanılacak.

CREATE TABLE IF NOT EXISTS public.personel_odeme_takvim (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel_adi_soyadi text NOT NULL,
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  tip text NOT NULL CHECK (tip IN ('hediye', 'kira', 'cocuk', 'yakacak', 'ikramiye', 'elbise', 'asker', 'yeni_dogan', 'yol_yardimi', 'dugun')),
  tutar numeric NOT NULL CHECK (tutar >= 0),
  verildigi_tarih date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personel_odeme_takvim_pkey PRIMARY KEY (id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_personel_odeme_takvim_uid ON public.personel_odeme_takvim(personel_uid);
CREATE INDEX IF NOT EXISTS idx_personel_odeme_takvim_yil_ay ON public.personel_odeme_takvim(yil, ay);
CREATE INDEX IF NOT EXISTS idx_personel_odeme_takvim_tip ON public.personel_odeme_takvim(tip);
CREATE INDEX IF NOT EXISTS idx_personel_odeme_takvim_tarih ON public.personel_odeme_takvim(verildigi_tarih);

-- Yorumlar
COMMENT ON TABLE public.personel_odeme_takvim IS 'Personel ödeme takvimi - CSV import ile doldurulacak';
COMMENT ON COLUMN public.personel_odeme_takvim.personel_uid IS 'Personel UID (kullanicilar tablosundaki id ile eşleşmeli)';
COMMENT ON COLUMN public.personel_odeme_takvim.personel_adi_soyadi IS 'Personel adı soyadı (kullanicilar tablosundaki adsoyad ile eşleşmeli)';
COMMENT ON COLUMN public.personel_odeme_takvim.yil IS 'Ödeme yılı (2023, 2024, 2025)';
COMMENT ON COLUMN public.personel_odeme_takvim.ay IS 'Ödeme ayı (1-12)';
COMMENT ON COLUMN public.personel_odeme_takvim.tip IS 'Ödeme tipi: hediye, kira, cocuk, yakacak, ikramiye, elbise, asker, yeni_dogan, yol_yardimi, dugun';
COMMENT ON COLUMN public.personel_odeme_takvim.tutar IS 'Ödeme tutarı (numeric)';
COMMENT ON COLUMN public.personel_odeme_takvim.verildigi_tarih IS 'Ödemenin verildiği tarih (date)';
