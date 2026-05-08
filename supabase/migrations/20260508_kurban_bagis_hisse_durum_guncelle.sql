-- Bağış hisse durum değerleri güncelleme
-- Eski: kayit_alindi, kesildi  →  Yeni: kayit_alindi, tekduzene_kayit, vekalet_alindi, kesim_yapildi, kesildi

-- CHECK kısıtlamasını kaldır ve yeni değerlerle yeniden ekle
ALTER TABLE public.kurban_2026_bagis_hisse
  DROP CONSTRAINT IF EXISTS kurban_2026_bagis_hisse_durum_check;

ALTER TABLE public.kurban_2026_bagis_hisse
  ADD CONSTRAINT kurban_2026_bagis_hisse_durum_check
  CHECK (durum = ANY (ARRAY[
    'kayit_alindi'::text,
    'tekduzene_kayit'::text,
    'vekalet_alindi'::text,
    'kesim_yapildi'::text,
    'kesildi'::text
  ]));
