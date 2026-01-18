-- nobet_planlari tablosuna isozelnobet sütunu ekle
-- Bu sütun özel nöbet modunu belirtir (manuel doldurulacak günler için)

ALTER TABLE public.nobet_planlari 
ADD COLUMN IF NOT EXISTS isozelnobet boolean DEFAULT false;

-- Mevcut kayıtlar için varsayılan değer false olacak
COMMENT ON COLUMN public.nobet_planlari.isozelnobet IS 'Özel nöbet modu: Tüm günler manuel olarak doldurulacak';
