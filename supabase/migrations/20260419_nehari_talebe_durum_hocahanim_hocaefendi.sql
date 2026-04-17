-- Nehari talebe kayıt: anne durum + hocahanim, baba durum + hocaefendi

ALTER TABLE public.nehari_talebe_kayit_formu
  DROP CONSTRAINT IF EXISTS nehari_talebe_kayit_formu_anne_durum_check;

ALTER TABLE public.nehari_talebe_kayit_formu
  ADD CONSTRAINT nehari_talebe_kayit_formu_anne_durum_check
  CHECK (
    anne_durum = ANY (
      ARRAY['ahavat'::text, 'muhibban'::text, 'diger'::text, 'hocahanim'::text]
    )
  );

ALTER TABLE public.nehari_talebe_kayit_formu
  DROP CONSTRAINT IF EXISTS nehari_talebe_kayit_formu_baba_durum_check;

ALTER TABLE public.nehari_talebe_kayit_formu
  ADD CONSTRAINT nehari_talebe_kayit_formu_baba_durum_check
  CHECK (
    baba_durum = ANY (
      ARRAY['ihvan'::text, 'muhibban'::text, 'diger'::text, 'hocaefendi'::text]
    )
  );
