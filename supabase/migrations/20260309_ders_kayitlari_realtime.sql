-- ders_kayitlari tablosu için Supabase Realtime etkinleştirme
-- A kullanıcısı işlem yapınca B kullanıcısının ekranı otomatik güncellenecek
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ders_kayitlari'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ders_kayitlari;
  END IF;
END $$;
