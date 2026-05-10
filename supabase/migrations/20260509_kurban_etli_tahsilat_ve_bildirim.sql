-- Kurban etli hisse tahsilat hareketleri tablosu
-- Her satır bir tahsilat; DB trigger bildirim_gonder RPC'sini çağırır → FCM push

CREATE TABLE IF NOT EXISTS public.kurban_2026_etli_tahsilat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hisse_id uuid NOT NULL REFERENCES public.kurban_2026_etli_hisse(id) ON DELETE CASCADE,
  yil int NOT NULL DEFAULT 2026,
  tutar numeric(12,2) NOT NULL CHECK (tutar > 0),
  tarih date NOT NULL DEFAULT current_date,
  odeyen text,
  aciklama text,
  created_by_uid text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etli_tahsilat_hisse ON public.kurban_2026_etli_tahsilat(hisse_id);
CREATE INDEX IF NOT EXISTS idx_etli_tahsilat_created ON public.kurban_2026_etli_tahsilat(created_by_uid, yil);
CREATE INDEX IF NOT EXISTS idx_etli_tahsilat_tarih ON public.kurban_2026_etli_tahsilat(tarih DESC);

COMMENT ON TABLE public.kurban_2026_etli_tahsilat IS
  '2026 Kurban etli hisse tahsilat hareketleri — her satır bir tahsilat girişi';

ALTER TABLE public.kurban_2026_etli_tahsilat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kurban_2026_etli_tahsilat_select ON public.kurban_2026_etli_tahsilat;
CREATE POLICY kurban_2026_etli_tahsilat_select ON public.kurban_2026_etli_tahsilat FOR SELECT USING (true);

DROP POLICY IF EXISTS kurban_2026_etli_tahsilat_insert ON public.kurban_2026_etli_tahsilat;
CREATE POLICY kurban_2026_etli_tahsilat_insert ON public.kurban_2026_etli_tahsilat FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS kurban_2026_etli_tahsilat_update ON public.kurban_2026_etli_tahsilat;
CREATE POLICY kurban_2026_etli_tahsilat_update ON public.kurban_2026_etli_tahsilat FOR UPDATE USING (true);

DROP POLICY IF EXISTS kurban_2026_etli_tahsilat_delete ON public.kurban_2026_etli_tahsilat;
CREATE POLICY kurban_2026_etli_tahsilat_delete ON public.kurban_2026_etli_tahsilat FOR DELETE USING (true);

-- ─── Tahsilat trigger: kurban_2026_etli_tahsilat INSERT → bildirim_gonder ───

CREATE OR REPLACE FUNCTION public.kurban_etli_tahsilat_bildirim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ad text;
  v_adet int;
  v_kapora numeric;
  v_kurban_id uuid;
  v_hisse_fiyati numeric;
  v_hedef_uid text;
  v_hedef numeric;
  v_toplam_tahsilat numeric;
  v_toplam_odenen numeric;
  v_kalan numeric;
  v_baslik text;
  v_govde text;
BEGIN
  SELECT hisedar_ad_soyad, hisse_adedi, COALESCE(kapora, 0), kurban_id, created_by_uid
    INTO v_ad, v_adet, v_kapora, v_kurban_id, v_hedef_uid
  FROM public.kurban_2026_etli_hisse WHERE id = NEW.hisse_id;

  IF v_hedef_uid IS NULL OR v_hedef_uid = '' THEN RETURN NEW; END IF;

  IF v_kurban_id IS NOT NULL THEN
    SELECT hisse_fiyati INTO v_hisse_fiyati FROM public.karaagac_kurban WHERE id = v_kurban_id;
  END IF;

  v_hedef := COALESCE(v_hisse_fiyati, 0) * COALESCE(v_adet, 1);

  SELECT COALESCE(SUM(tutar), 0) INTO v_toplam_tahsilat
  FROM public.kurban_2026_etli_tahsilat WHERE hisse_id = NEW.hisse_id;

  v_toplam_odenen := v_kapora + v_toplam_tahsilat;

  IF v_hedef > 0 THEN
    v_kalan := GREATEST(v_hedef - v_toplam_odenen, 0);
    IF v_kalan <= 0 THEN
      v_baslik := 'Etli Kurbanı Tamamlandı';
      v_govde := format('%s hissedarından %s ₺ tahsilat yapıldı. Tamamı ödendi, teşekkürler!',
        COALESCE(v_ad, 'Bilinmeyen'), public.fmt_try(NEW.tutar));
    ELSE
      v_baslik := 'Etli Hisse Tahsilat';
      v_govde := format('%s hissedarından %s ₺ tahsilat yapıldı. Kalan: %s ₺.',
        COALESCE(v_ad, 'Bilinmeyen'), public.fmt_try(NEW.tutar), public.fmt_try(v_kalan));
    END IF;
  ELSE
    v_baslik := 'Etli Hisse Tahsilat';
    v_govde := format('%s hissedarından %s ₺ tahsilat yapıldı. Toplam tahsilat: %s ₺.',
      COALESCE(v_ad, 'Bilinmeyen'), public.fmt_try(NEW.tutar), public.fmt_try(v_toplam_odenen));
  END IF;

  PERFORM public.bildirim_gonder(
    target_uid := v_hedef_uid,
    baslik := v_baslik,
    icerik := v_govde,
    rota := '/kurban',
    gonderici := 'kurban_tahsilat'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_etli_tahsilat_bildirim ON public.kurban_2026_etli_tahsilat;
CREATE TRIGGER trg_etli_tahsilat_bildirim
  AFTER INSERT ON public.kurban_2026_etli_tahsilat
  FOR EACH ROW EXECUTE FUNCTION public.kurban_etli_tahsilat_bildirim();

-- ─── Kapora trigger: kurban_2026_etli_hisse.kapora UPDATE → bildirim_gonder ───

CREATE OR REPLACE FUNCTION public.kurban_etli_kapora_bildirim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hisse_fiyati numeric;
  v_hedef numeric;
  v_toplam_odenen numeric;
  v_kalan numeric;
  v_baslik text;
  v_govde text;
BEGIN
  IF NEW.created_by_uid IS NULL OR NEW.created_by_uid = '' THEN RETURN NEW; END IF;
  IF NEW.kapora IS NULL OR NEW.kapora <= 0 THEN RETURN NEW; END IF;

  IF NEW.kurban_id IS NOT NULL THEN
    SELECT hisse_fiyati INTO v_hisse_fiyati FROM public.karaagac_kurban WHERE id = NEW.kurban_id;
  END IF;

  v_baslik := 'Etli Hisse Kapora';

  IF v_hisse_fiyati IS NOT NULL AND v_hisse_fiyati > 0 THEN
    v_hedef := v_hisse_fiyati * COALESCE(NEW.hisse_adedi, 1);
    v_toplam_odenen := COALESCE(NEW.kapora, 0) + COALESCE(NEW.tahsilat, 0);
    v_kalan := GREATEST(v_hedef - v_toplam_odenen, 0);
    v_govde := format('%s hissedarından %s ₺ kapora alındı. Kalan: %s ₺.',
      COALESCE(NEW.hisedar_ad_soyad, 'Bilinmeyen'),
      public.fmt_try(NEW.kapora),
      public.fmt_try(v_kalan));
  ELSE
    v_govde := format('%s hissedarından %s ₺ kapora alındı.',
      COALESCE(NEW.hisedar_ad_soyad, 'Bilinmeyen'),
      public.fmt_try(NEW.kapora));
  END IF;

  PERFORM public.bildirim_gonder(
    target_uid := NEW.created_by_uid,
    baslik := v_baslik,
    icerik := v_govde,
    rota := '/kurban',
    gonderici := 'kurban_kapora'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_etli_kapora_bildirim ON public.kurban_2026_etli_hisse;
CREATE TRIGGER trg_etli_kapora_bildirim
  AFTER UPDATE OF kapora ON public.kurban_2026_etli_hisse
  FOR EACH ROW
  WHEN (NEW.kapora IS DISTINCT FROM OLD.kapora AND NEW.kapora > 0)
  EXECUTE FUNCTION public.kurban_etli_kapora_bildirim();
