-- Kurban finans alanları: alış/kg, satış/kg, kesim ücreti, satış iskontosu
ALTER TABLE karaagac_kurban
  ADD COLUMN IF NOT EXISTS alis_kg       numeric,
  ADD COLUMN IF NOT EXISTS satis_kg      numeric,
  ADD COLUMN IF NOT EXISTS kesim_ucret   numeric,
  ADD COLUMN IF NOT EXISTS satis_iskonto numeric;

COMMENT ON COLUMN karaagac_kurban.alis_kg       IS 'Canlı kg alış birim fiyatı (₺/kg)';
COMMENT ON COLUMN karaagac_kurban.satis_kg      IS 'Canlı kg satış birim fiyatı (₺/kg)';
COMMENT ON COLUMN karaagac_kurban.kesim_ucret   IS 'Kesim ücreti (₺); 2026 için varsayılan 21.000';
COMMENT ON COLUMN karaagac_kurban.satis_iskonto IS 'Satışa uygulanan iskonto (₺); pozitif = indirim, negatif = ek ücret';
