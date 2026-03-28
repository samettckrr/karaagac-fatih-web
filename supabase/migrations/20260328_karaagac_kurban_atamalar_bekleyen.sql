-- Kurban yönetim: hisse slotları (JSON) + kurban özeti kapora/tahsilat
-- Bekleyen hissedarlar: kurban_2026_etli_hisse.kurban_id IS NULL (ayrı tablo yok)

ALTER TABLE public.karaagac_kurban
  ADD COLUMN IF NOT EXISTS kapora numeric;
ALTER TABLE public.karaagac_kurban
  ADD COLUMN IF NOT EXISTS tahsilat numeric;
ALTER TABLE public.karaagac_kurban
  ADD COLUMN IF NOT EXISTS atamalar jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.karaagac_kurban.atamalar IS 'Hissedar slotları: [{ slot, ad_soyad, telefon, referans, kapora, tahsilat, aciklama, etli_kayit_id? }, ...]';
COMMENT ON COLUMN public.karaagac_kurban.kapora IS 'Kurban satırı özet kapora (opsiyonel)';
COMMENT ON COLUMN public.karaagac_kurban.tahsilat IS 'Kurban satırı özet tahsilat (opsiyonel)';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'karaagac_kurban_yil_kesim_key'
      AND conrelid = 'public.karaagac_kurban'::regclass
  ) THEN
    ALTER TABLE public.karaagac_kurban
      ADD CONSTRAINT karaagac_kurban_yil_kesim_key UNIQUE (yil, kesim_sirasi);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kurban_2026_etli_bekleyen
  ON public.kurban_2026_etli_hisse (yil)
  WHERE kurban_id IS NULL;
