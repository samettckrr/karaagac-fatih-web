-- ============================================
-- personel_odeme_takvim: tip CHECK'e 'sigorta' ekleme + verildigi_tarih nullable
-- ============================================
-- Sigorta tipi için verildiği tarih kullanılmıyor; otomatik null atanır.
-- Bu script'i Supabase SQL Editor'da çalıştırın.

-- 1) tip CHECK'e 'sigorta' ekle
ALTER TABLE public.personel_odeme_takvim
  DROP CONSTRAINT IF EXISTS personel_odeme_takvim_tip_check;

ALTER TABLE public.personel_odeme_takvim
  ADD CONSTRAINT personel_odeme_takvim_tip_check
  CHECK (tip IN (
    'hediye', 'kira', 'cocuk', 'yakacak', 'ikramiye',
    'elbise', 'asker', 'yeni_dogan', 'yol_yardimi', 'dugun', 'sigorta'
  ));

-- 2) verildigi_tarih sütununu nullable yap (sigorta için null atanacak)
ALTER TABLE public.personel_odeme_takvim
  ALTER COLUMN verildigi_tarih DROP NOT NULL;

COMMENT ON COLUMN public.personel_odeme_takvim.verildigi_tarih IS 'Ödemenin verildiği tarih (date); sigorta tipinde null olabilir';
