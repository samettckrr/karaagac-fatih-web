-- Samet Çakır'ın diğer personellerin izinlerini kaldırabilmesi için RLS düzeltmesi
-- INSERT/UPDATE ile aynı mantık: kullanicilar tablosunda adsoyad kontrolü (inline, fonksiyon yok)

DROP POLICY IF EXISTS "personel_ramazan_izin_delete" ON public.personel_ramazan_izin;
CREATE POLICY "personel_ramazan_izin_delete" ON public.personel_ramazan_izin
  FOR DELETE USING (
    auth.uid()::text = personel_uid
    OR EXISTS (
      SELECT 1 FROM public.kullanicilar
      WHERE id = auth.uid()::text
      AND trim(coalesce(adsoyad, '')) = 'Samet Çakır'
    )
  );
