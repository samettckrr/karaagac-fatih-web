-- Kurban tabloları için DELETE politikaları (yönetim paneli silme işlemleri için)

DROP POLICY IF EXISTS "kurban_2026_bagis_delete" ON public.kurban_2026_bagis_hisse;
CREATE POLICY "kurban_2026_bagis_delete" ON public.kurban_2026_bagis_hisse
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "kurban_2026_etli_delete" ON public.kurban_2026_etli_hisse;
CREATE POLICY "kurban_2026_etli_delete" ON public.kurban_2026_etli_hisse
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "kurban_2026_hedefler_delete" ON public.kurban_2026_hedefler;
CREATE POLICY "kurban_2026_hedefler_delete" ON public.kurban_2026_hedefler
  FOR DELETE USING (true);
