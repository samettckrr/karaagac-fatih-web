-- nehari_talebeler tablosuna durum (aktif/pasif) kolonu ekle
ALTER TABLE public.nehari_talebeler
  ADD COLUMN IF NOT EXISTS durum text DEFAULT 'aktif' CHECK (durum IN ('aktif', 'pasif'));
