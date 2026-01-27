-- ============================================
-- personel_odeme_takvim: tip CHECK'e 'dugun' ekleme
-- ============================================
-- Canlı veritabanında tip CHECK dugun içermiyorsa bu script ile güncelleyin.
-- personel-analiz-import sayfasından dugun aktarımı 400 hatası alıyorsanız çalıştırın.

ALTER TABLE public.personel_odeme_takvim
  DROP CONSTRAINT IF EXISTS personel_odeme_takvim_tip_check;

ALTER TABLE public.personel_odeme_takvim
  ADD CONSTRAINT personel_odeme_takvim_tip_check
  CHECK (tip IN (
    'hediye', 'kira', 'cocuk', 'yakacak', 'ikramiye',
    'elbise', 'asker', 'yeni_dogan', 'yol_yardimi', 'dugun'
  ));
