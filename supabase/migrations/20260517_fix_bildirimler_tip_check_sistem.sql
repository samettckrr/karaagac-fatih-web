-- bildirimler ve kullanici_bildirimleri tablolarındaki tip constraint'ine 'sistem' değeri ekleniyor
-- Kurban bağış hedef trigger (kurban_bagis_hedef_kontrol) 'sistem' tipini kullanıyor

ALTER TABLE public.bildirimler
  DROP CONSTRAINT bildirimler_tip_check,
  ADD CONSTRAINT bildirimler_tip_check
    CHECK (tip = ANY (ARRAY['toplu'::text, 'kisisel'::text, 'sistem'::text]));

ALTER TABLE public.kullanici_bildirimleri
  DROP CONSTRAINT kullanici_bildirimleri_tip_check,
  ADD CONSTRAINT kullanici_bildirimleri_tip_check
    CHECK (tip = ANY (ARRAY['toplu'::text, 'kisisel'::text, 'sistem'::text]));
