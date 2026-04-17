-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.aidat_kitap (
  id text NOT NULL,
  isim text,
  islemturu text,
  miktar numeric,
  odemeyontemi text,
  tarih timestamp with time zone,
  CONSTRAINT aidat_kitap_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alacak_ayar (
  id text NOT NULL,
  faaliyetler ARRAY,
  yillar ARRAY,
  CONSTRAINT alacak_ayar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.arsiv_hedefler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel text NOT NULL,
  uid text NOT NULL,
  yil integer NOT NULL,
  sira integer NOT NULL,
  kategori text,
  tip text,
  hedef numeric,
  tutar numeric,
  kurban_adedi integer DEFAULT 0 CHECK (kurban_adedi >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT arsiv_hedefler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.aylik_giderler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  kalem_id uuid NOT NULL,
  tutar numeric NOT NULL CHECK (tutar >= 0::numeric),
  tarih date NOT NULL,
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT aylik_giderler_pkey PRIMARY KEY (id),
  CONSTRAINT aylik_giderler_kalem_id_fkey FOREIGN KEY (kalem_id) REFERENCES public.gider_kalemleri(id)
);
CREATE TABLE public.bildirimler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baslik text NOT NULL,
  icerik text NOT NULL,
  tip text NOT NULL CHECK (tip = ANY (ARRAY['toplu'::text, 'kisisel'::text])),
  gonderici_uid text NOT NULL,
  hedef_rol text,
  hedef_uid text,
  hedef_kullanici_sayisi integer DEFAULT 0,
  yeniden_gonderildi boolean DEFAULT false,
  orijinal_bildirim_id uuid,
  guncellendi boolean DEFAULT false,
  guncelleme_zamani timestamp with time zone,
  zaman timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bildirimler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.butceihvan (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  tip text NOT NULL CHECK (lower(tip) = ANY (ARRAY['gider'::text, 'gelir'::text, 'yatırım'::text, 'yatirim'::text])),
  kategori text NOT NULL,
  tutar numeric NOT NULL,
  CONSTRAINT butceihvan_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ders_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  devre text NOT NULL,
  kitap text NOT NULL,
  ders_adi text NOT NULL,
  ders_gunu date NOT NULL,
  kaydeden_personel text,
  kaydeden_personel_uid text,
  talebe_uid text NOT NULL,
  talebe_adi text,
  ders_verme_durumu text CHECK ((ders_verme_durumu = ANY (ARRAY['henuz_verilmedi'::text, 'verdi'::text, 'veremedi'::text, 'yarim'::text])) OR ders_verme_durumu IS NULL),
  ders_verme_tarihi timestamp with time zone,
  ders_veren_personel text,
  ders_veren_personel_uid text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ders_kayitlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.duzenleme_talepleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil text,
  kayitid text,
  kayittipi text,
  taleptipi text,
  aciklama text,
  durum text DEFAULT 'beklemede'::text,
  personeladi text,
  yenitarih text,
  mahalid text,
  onaylayanuid text,
  onaylanmatarihi timestamp with time zone,
  rededenuid text,
  redtarihi timestamp with time zone,
  redaciklama text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  CONSTRAINT duzenleme_talepleri_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gecmis_teberru_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vade_tarihi date NOT NULL,
  tip text,
  sahip text,
  referans text,
  diger text,
  odeme text,
  tutar numeric NOT NULL CHECK (tutar >= 0::numeric),
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gecmis_teberru_kayitlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gider_kalemleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  parent_id uuid,
  sira integer NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gider_kalemleri_pkey PRIMARY KEY (id),
  CONSTRAINT gider_kalemleri_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.gider_kalemleri(id)
);
CREATE TABLE public.hedefler (
  id text NOT NULL,
  hedef numeric,
  kategori text,
  personel text,
  uid text,
  updatedat timestamp with time zone,
  updatedby text,
  CONSTRAINT hedefler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ihvan_ahavat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  kayit_tipi text NOT NULL CHECK (kayit_tipi = ANY (ARRAY['ihvan'::text, 'ahavat'::text])),
  kurum_adi text NOT NULL,
  ad_soyad text NOT NULL,
  telefon text,
  adet integer NOT NULL DEFAULT 1 CHECK (adet >= 1),
  aciklama text,
  yil integer NOT NULL DEFAULT 2026,
  CONSTRAINT ihvan_ahavat_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kurban_kayit_takip (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  tur text NOT NULL CHECK (tur = ANY (ARRAY['talebe'::text, 'ihvan'::text, 'ahavat'::text])),
  ref_id text NOT NULL,
  birim_indeks integer NOT NULL DEFAULT -1 CHECK (birim_indeks = -1 OR birim_indeks >= 1),
  durum text CHECK (durum IS NULL OR durum = ANY (ARRAY['var'::text, 'yok'::text])),
  birim_isim text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by_uid text,
  CONSTRAINT kurban_kayit_takip_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_kayit_takip_yil_tur_ref_birim_uq UNIQUE (yil, tur, ref_id, birim_indeks),
  CONSTRAINT kurban_kayit_takip_durum_kural_chk CHECK (
    (tur IN ('talebe', 'ihvan') AND birim_indeks = -1 AND durum IS NOT NULL AND durum = ANY (ARRAY['var'::text, 'yok'::text]))
    OR (tur = 'ahavat' AND birim_indeks = -1 AND durum IS NOT NULL AND durum = ANY (ARRAY['var'::text, 'yok'::text]))
    OR (tur = 'ahavat' AND birim_indeks >= 1 AND (durum IS NULL OR durum = ANY (ARRAY['var'::text, 'yok'::text])))
  )
);
CREATE TABLE public.kurban_ahavat_hedef (
  yil integer NOT NULL,
  hedef_adet integer NOT NULL CHECK (hedef_adet >= 0),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by_uid text,
  CONSTRAINT kurban_ahavat_hedef_pkey PRIMARY KEY (yil)
);
CREATE TABLE public.kurban_ahavat_bagis_izle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  ad_soyad text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  CONSTRAINT kurban_ahavat_bagis_izle_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_ahavat_bagis_izle_yil_ad_unique UNIQUE (yil, ad_soyad)
);
CREATE TABLE public.islem_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  islem text NOT NULL,
  uid text,
  zaman timestamp with time zone DEFAULT now(),
  sayfa text,
  path text,
  user_agent text,
  CONSTRAINT islem_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.izin_oturumlari (
  id text NOT NULL,
  _clientat text,
  aciklama text,
  createdat timestamp with time zone,
  createdby text,
  devre text,
  donusiso text,
  tarihiso10 text,
  updatedat timestamp with time zone,
  updatedby text,
  CONSTRAINT izin_oturumlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.izinler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe text,
  talebeuid text,
  devre text,
  baslatan text,
  baslangic timestamp with time zone NOT NULL,
  planlanandonus timestamp with time zone,
  aciklama text,
  durum text NOT NULL DEFAULT 'aktif'::text CHECK (durum = ANY (ARRAY['aktif'::text, 'dondu'::text, 'iptal'::text])),
  uid text,
  createdby text,
  cihaz text,
  useragent text,
  createdat timestamp with time zone DEFAULT now(),
  iptalat timestamp with time zone,
  iptalby text,
  donusat timestamp with time zone,
  donusnot text,
  updatedat timestamp with time zone,
  updatedby text,
  CONSTRAINT izinler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kantin_alinimlar (
  id text NOT NULL,
  urunler jsonb,
  CONSTRAINT kantin_alinimlar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kantin_urunler (
  id text NOT NULL,
  aciklama text,
  ad text,
  aktif boolean,
  createdat timestamp with time zone,
  createdby text,
  fiyat numeric,
  gelisfiyat numeric,
  kategori text,
  stok integer,
  uid text,
  updatedat timestamp with time zone,
  updatedby text,
  CONSTRAINT kantin_urunler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.karaagac_kurban (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  yil integer NOT NULL,
  kesim_sirasi integer NOT NULL CHECK (kesim_sirasi >= 1),
  kupe_no text,
  canli_kg numeric,
  hisse_grubu text NOT NULL,
  hissedar_adedi integer NOT NULL DEFAULT 7 CHECK (hissedar_adedi >= 1 AND hissedar_adedi <= 7),
  hisse_fiyati numeric,
  kapora numeric,
  tahsilat numeric,
  atamalar jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT karaagac_kurban_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kategoriler (
  id text NOT NULL,
  ad text,
  aktif boolean,
  cihaz text,
  createdat timestamp with time zone,
  createdby text,
  kayittarihi timestamp with time zone,
  slug text,
  uid text,
  updatedat timestamp with time zone,
  updatedby text,
  useragent text,
  tip text,
  CONSTRAINT kategoriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kullanici_bildirim_sayac (
  kullanici_uid text NOT NULL,
  toplam_bildirim integer DEFAULT 0,
  okunmamis_bildirim integer DEFAULT 0,
  son_guncelleme timestamp with time zone DEFAULT now(),
  CONSTRAINT kullanici_bildirim_sayac_pkey PRIMARY KEY (kullanici_uid)
);
CREATE TABLE public.kullanici_bildirimleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kullanici_uid text NOT NULL,
  bildirim_id uuid NOT NULL,
  baslik text NOT NULL,
  icerik text NOT NULL,
  tip text NOT NULL CHECK (tip = ANY (ARRAY['toplu'::text, 'kisisel'::text])),
  gonderici_uid text NOT NULL,
  okundu_mu boolean DEFAULT false,
  okunma_zamani timestamp with time zone,
  guncelleme_zamani timestamp with time zone,
  zaman timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kullanici_bildirimleri_pkey PRIMARY KEY (id),
  CONSTRAINT kullanici_bildirimleri_bildirim_id_fkey FOREIGN KEY (bildirim_id) REFERENCES public.bildirimler(id)
);
CREATE TABLE public.kullanici_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid text,
  email text,
  durum text NOT NULL,
  mesaj text NOT NULL,
  zaman timestamp with time zone DEFAULT now(),
  user_agent text,
  CONSTRAINT kullanici_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kullanici_sifreleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid uuid NOT NULL UNIQUE,
  email text NOT NULL,
  sifre text NOT NULL,
  olusturan_admin_uid uuid,
  olusturma_tarihi timestamp with time zone NOT NULL DEFAULT now(),
  guncelleme_tarihi timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kullanici_sifreleri_pkey PRIMARY KEY (id),
  CONSTRAINT kullanici_sifreleri_uid_fkey FOREIGN KEY (uid) REFERENCES auth.users(id),
  CONSTRAINT kullanici_sifreleri_olusturan_admin_uid_fkey FOREIGN KEY (olusturan_admin_uid) REFERENCES auth.users(id)
);
CREATE TABLE public.kullanicilar (
  id text NOT NULL,
  adsoyad text NOT NULL,
  email text,
  rol text,
  gorev text,
  aktif boolean,
  eklenmetarihi timestamp with time zone,
  yetkiler ARRAY,
  telefon text CHECK (telefon IS NULL OR telefon ~ '^90[0-9]{10}$'::text),
  CONSTRAINT kullanicilar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kumbaralar (
  id text NOT NULL,
  cihaz text,
  createdat timestamp with time zone,
  createdby text,
  dagitildi boolean,
  dagitimtarihi timestamp with time zone,
  kayittarihi timestamp with time zone,
  numara integer,
  tur text,
  uid text,
  updatedat timestamp with time zone,
  updatedby text,
  useragent text,
  verilenkisiadsoyad text,
  verilenkisiadres text,
  zimmettarihi timestamp with time zone,
  zimmetli boolean,
  zimmetlipersonel text,
  toplandi boolean DEFAULT false,
  toplamatarihi timestamp with time zone,
  toplayanpersonel text,
  sayimasamasinda boolean DEFAULT false,
  sayimtarihi timestamp with time zone,
  icindencikanmiktar numeric DEFAULT 0,
  tamamlandi boolean DEFAULT false,
  tamamlanmatarihi timestamp with time zone,
  CONSTRAINT kumbaralar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kurban_2026_bagis_hisse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  fiyat numeric NOT NULL DEFAULT 0,
  aciklama text,
  durum text DEFAULT 'kayit_alindi'::text,
  yil integer DEFAULT 2026,
  CONSTRAINT kurban_2026_bagis_hisse_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kurban_2026_etli_hisse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  created_by_uid text,
  hisedar_ad_soyad text NOT NULL,
  telefon text NOT NULL,
  hisse_grubu text NOT NULL,
  hisse_adedi integer NOT NULL DEFAULT 1 CHECK (hisse_adedi >= 1),
  aciklama text,
  yil integer DEFAULT 2026,
  kurban_id uuid,
  kapora numeric,
  tahsilat numeric,
  ana_hisse_id uuid,
  CONSTRAINT kurban_2026_etli_hisse_pkey PRIMARY KEY (id),
  CONSTRAINT kurban_2026_etli_hisse_kurban_id_fkey FOREIGN KEY (kurban_id) REFERENCES public.karaagac_kurban(id),
  CONSTRAINT kurban_2026_etli_hisse_ana_hisse_id_fkey FOREIGN KEY (ana_hisse_id) REFERENCES public.kurban_2026_etli_hisse(id)
);
CREATE TABLE public.kurban_2026_hedefler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel text,
  bagis_hedef integer NOT NULL DEFAULT 0 CHECK (bagis_hedef >= 0),
  etli_hedef integer NOT NULL DEFAULT 0 CHECK (etli_hedef >= 0),
  yil integer NOT NULL DEFAULT 2026,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kurban_2026_hedefler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kurban_kategoriler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL UNIQUE,
  label text NOT NULL DEFAULT ''::text,
  aktif boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kurban_kategoriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kurban_onkayit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  ref text,
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  email text,
  tur text NOT NULL CHECK (tur = ANY (ARRAY['kucukbas'::text, 'buyukbas'::text])),
  aciklama text,
  kaynak text,
  hisse_grup integer,
  yil integer DEFAULT 2026,
  CONSTRAINT kurban_onkayit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.muhasebe_alt_kategoriler (
  id text NOT NULL,
  aciklama text,
  createdat timestamp with time zone,
  isim text,
  kategori text,
  sirano integer,
  tip text,
  tutar numeric,
  CONSTRAINT muhasebe_alt_kategoriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.muhasebe_gerceklesen (
  id text NOT NULL,
  ay integer,
  createdat timestamp with time zone,
  gerceklesen numeric,
  kategori text,
  tip text,
  yil integer,
  CONSTRAINT muhasebe_gerceklesen_pkey PRIMARY KEY (id)
);
CREATE TABLE public.muhasebe_kategoriler (
  id text NOT NULL,
  aciklama text,
  ad text,
  createdat timestamp with time zone,
  tip text,
  CONSTRAINT muhasebe_kategoriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.muhasebe_planlama (
  id text NOT NULL,
  createdat timestamp with time zone,
  kategori text,
  planlanan numeric,
  tip text,
  yil integer,
  CONSTRAINT muhasebe_planlama_pkey PRIMARY KEY (id)
);
CREATE TABLE public.muhasebe_planlama_2026 (
  id text NOT NULL,
  artisyuzde numeric,
  baseamount numeric,
  kategori text,
  olusturmatarihi timestamp with time zone,
  planlamaadi text,
  targetamount numeric,
  tip text,
  yil integer,
  CONSTRAINT muhasebe_planlama_2026_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nehari_aidat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL,
  aylik_tutar numeric NOT NULL CHECK (aylik_tutar >= 0::numeric),
  baslangic_yil integer NOT NULL,
  baslangic_ay integer NOT NULL CHECK (baslangic_ay >= 1 AND baslangic_ay <= 12),
  bitis_yil integer NOT NULL,
  bitis_ay integer NOT NULL CHECK (bitis_ay >= 1 AND bitis_ay <= 12),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_aidat_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_aidat_talebe_id_fkey FOREIGN KEY (talebe_id) REFERENCES public.nehari_talebeler(id)
);
CREATE TABLE public.nehari_aidat_odemeler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL,
  aidat_id uuid NOT NULL,
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  tutar numeric NOT NULL CHECK (tutar > 0::numeric),
  odeme_tarihi date,
  taksit_sira integer NOT NULL DEFAULT 1,
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_aidat_odemeler_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_aidat_odemeler_talebe_id_fkey FOREIGN KEY (talebe_id) REFERENCES public.nehari_talebeler(id),
  CONSTRAINT nehari_aidat_odemeler_aidat_id_fkey FOREIGN KEY (aidat_id) REFERENCES public.nehari_aidat(id)
);
CREATE TABLE public.nehari_talebeler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  soyad text NOT NULL,
  sinif integer NOT NULL CHECK (sinif >= 1 AND sinif <= 12),
  dogum_tarihi date,
  anne_adi text NOT NULL,
  baba_adi text NOT NULL,
  anne_meslek text NOT NULL,
  baba_meslek text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  durum text DEFAULT 'aktif'::text CHECK (durum = ANY (ARRAY['aktif'::text, 'pasif'::text])),
  CONSTRAINT nehari_talebeler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nehari_yoklama_gunleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarih date NOT NULL UNIQUE,
  siniflar ARRAY NOT NULL DEFAULT '{}'::integer[],
  yoklama_acik boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_yoklama_gunleri_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nehari_yoklama_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarih date NOT NULL,
  talebe_id uuid NOT NULL,
  durum text NOT NULL DEFAULT 'gelmedi'::text CHECK (durum = ANY (ARRAY['geldi'::text, 'gelmedi'::text, 'izinli'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nehari_yoklama_kayitlari_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_yoklama_kayitlari_talebe_id_fkey FOREIGN KEY (talebe_id) REFERENCES public.nehari_talebeler(id)
);
CREATE TABLE public.nehari_talebe_kayit_formu (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  talebe_id uuid NOT NULL,
  ad text NOT NULL,
  soyad text NOT NULL,
  sinif integer NOT NULL,
  dogum_tarihi date,
  memleket text,
  tc_kimlik_no text,
  adres_il text,
  adres_ilce text,
  adres_mahalle text,
  adres_cadde text,
  adres_sokak text,
  adres_site_apartman text,
  adres_bina_no text,
  adres_kat text,
  adres_daire text,
  anne_adi text NOT NULL,
  anne_meslek text NOT NULL,
  anne_telefon text,
  anne_durum text NOT NULL,
  baba_adi text NOT NULL,
  baba_meslek text NOT NULL,
  baba_telefon text,
  baba_durum text NOT NULL,
  anne_baba_beraber boolean NOT NULL,
  aile_maddi_durum text NOT NULL,
  kardes_sayisi integer NOT NULL DEFAULT 0,
  kardesler jsonb NOT NULL DEFAULT '[]'::jsonb,
  profil_foto_url text,
  olusturan uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nehari_talebe_kayit_formu_pkey PRIMARY KEY (id),
  CONSTRAINT nehari_talebe_kayit_formu_talebe_id_fkey FOREIGN KEY (talebe_id) REFERENCES public.nehari_talebeler(id),
  CONSTRAINT nehari_talebe_kayit_formu_sinif_check CHECK (sinif >= 1 AND sinif <= 12),
  CONSTRAINT nehari_talebe_kayit_formu_anne_durum_check CHECK (anne_durum = ANY (ARRAY['ahavat'::text, 'muhibban'::text, 'diger'::text, 'hocahanim'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_baba_durum_check CHECK (baba_durum = ANY (ARRAY['ihvan'::text, 'muhibban'::text, 'diger'::text, 'hocaefendi'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_maddi_check CHECK (aile_maddi_durum = ANY (ARRAY['zayif'::text, 'orta'::text, 'iyi'::text])),
  CONSTRAINT nehari_talebe_kayit_formu_kardes_sayisi_check CHECK (kardes_sayisi >= 0 AND kardes_sayisi <= 20)
);
CREATE TABLE public.nobet_ayar (
  id text NOT NULL,
  bekarlar ARRAY,
  evliler ARRAY,
  ihvan text,
  otopazar text,
  CONSTRAINT nobet_ayar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nobet_index (
  id text NOT NULL,
  createdat timestamp with time zone,
  date text,
  day text,
  monthkey text,
  person text,
  role text,
  saat text,
  type text,
  weekkey text,
  year text,
  CONSTRAINT nobet_index_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nobet_planlari (
  id text NOT NULL,
  createdat timestamp with time zone,
  createdby text,
  ispazartehir boolean,
  isspecialpazar boolean,
  isoyear integer,
  pazarevli text,
  rows jsonb,
  weekkey text,
  weekno integer,
  isozelnobet boolean DEFAULT false,
  CONSTRAINT nobet_planlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.personel_odeme (
  id text NOT NULL,
  ad text,
  ay integer,
  yil integer,
  maas text,
  tarih timestamp with time zone,
  toplam numeric,
  cocuk numeric,
  elbise numeric,
  haberlesme numeric,
  hediye numeric,
  ikramiye numeric,
  kira numeric,
  ssk numeric,
  yakacak numeric,
  yol numeric,
  odemeler jsonb,
  CONSTRAINT personel_odeme_pkey PRIMARY KEY (id)
);
CREATE TABLE public.personel_odeme_takvim (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel_adi_soyadi text NOT NULL,
  yil integer NOT NULL,
  ay integer NOT NULL CHECK (ay >= 1 AND ay <= 12),
  tip text NOT NULL CHECK (tip = ANY (ARRAY['hediye'::text, 'kira'::text, 'cocuk'::text, 'yakacak'::text, 'ikramiye'::text, 'elbise'::text, 'asker'::text, 'yeni_dogan'::text, 'yol_yardimi'::text, 'dugun'::text, 'sigorta'::text])),
  tutar numeric NOT NULL CHECK (tutar >= 0::numeric),
  verildigi_tarih date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personel_odeme_takvim_pkey PRIMARY KEY (id)
);
CREATE TABLE public.personel_ramazan_izin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel_adi text NOT NULL,
  ramazan_yil integer NOT NULL,
  izin_tarihi date NOT NULL,
  sira integer NOT NULL CHECK (sira = ANY (ARRAY[1, 2])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personel_ramazan_izin_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_arsiv (
  id text NOT NULL,
  yil integer,
  tip text,
  sahip text,
  tutar numeric,
  istirak boolean,
  musafiradedi integer,
  ay integer,
  mahalid text,
  mahal text,
  personel text,
  personeladi text,
  personeluid text,
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  notlar text,
  createdat timestamp with time zone,
  updatedat timestamp with time zone,
  tarih timestamp with time zone,
  arsiv_tarihi timestamp with time zone DEFAULT now(),
  silme_sebebi text,
  silen_kisi text,
  silenpersoneluid text,
  silenpersoneladi text,
  orijinalid uuid,
  CONSTRAINT ramazan_arsiv_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_ayarlar (
  id text NOT NULL,
  iftarmax integer,
  sahurmax integer,
  CONSTRAINT ramazan_ayarlar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_gun_menuleri (
  id text NOT NULL,
  tarih date NOT NULL,
  tip text NOT NULL,
  menu_id text,
  menu_ismi text,
  menu_detay text,
  yil integer NOT NULL,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  CONSTRAINT ramazan_gun_menuleri_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_hedefler (
  id text NOT NULL,
  personeladi text,
  hedef numeric,
  yil integer,
  personeluid text,
  updatedat timestamp with time zone DEFAULT now(),
  createdat timestamp with time zone DEFAULT now(),
  CONSTRAINT ramazan_hedefler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_kapasite (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  tarih timestamp with time zone NOT NULL,
  iftarmax integer,
  sahurmax integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ramazan_kapasite_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_kayitlari (
  id text NOT NULL,
  yil integer,
  tip text,
  sahip text,
  tutar numeric,
  istirak boolean,
  musafiradedi integer,
  ay integer,
  mahalid text,
  mahal text,
  personel text,
  personeladi text,
  personeluid text,
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  notlar text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  tarih timestamp with time zone,
  muhasebe_kaydedildi boolean DEFAULT false,
  muhasebe_kayit_tarihi timestamp with time zone,
  CONSTRAINT ramazan_kayitlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_mahaller (
  id text NOT NULL,
  adi text,
  maxmusafir integer,
  minmusafir integer,
  CONSTRAINT ramazan_mahaller_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_menuler (
  id text NOT NULL,
  corba text,
  yemek text,
  diger text,
  icecek text,
  soguk text,
  tip text,
  tarih timestamp with time zone,
  yil integer,
  updatedat timestamp with time zone DEFAULT now(),
  createdat timestamp with time zone DEFAULT now(),
  menu_ismi text,
  pilav text,
  orta_menu text,
  meze text,
  tatli text,
  sicak1 text,
  sicak2 text,
  sicak3 text,
  CONSTRAINT ramazan_menuler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_secenekler (
  id text NOT NULL,
  label text,
  tutar numeric,
  sira integer,
  aktif boolean,
  tip text,
  CONSTRAINT ramazan_secenekler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_tahsilat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kayit_id text NOT NULL,
  tutar numeric NOT NULL CHECK (tutar >= 0::numeric),
  tahsilat_tarihi date NOT NULL,
  odeme_tipi text NOT NULL CHECK (odeme_tipi = ANY (ARRAY['pesin'::text, 'taksit'::text])),
  taksit_no integer,
  aciklama text,
  createdat timestamp with time zone DEFAULT now(),
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  kayit_tipi text DEFAULT 'iftar-sahur'::text,
  CONSTRAINT ramazan_tahsilat_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_veriler (
  id text NOT NULL,
  createdat timestamp with time zone,
  diger text,
  personel text,
  sahip text,
  tip text,
  tutar numeric,
  yil integer,
  yukleyen text,
  updatedat timestamp with time zone,
  referans text,
  CONSTRAINT ramazan_veriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ramazan_yillar (
  id text NOT NULL,
  aktif boolean,
  baslangic text,
  bitis text,
  createdat timestamp with time zone,
  hicriyil integer,
  updatedat timestamp with time zone,
  yil integer,
  CONSTRAINT ramazan_yillar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sayfa_manifesti (
  id text NOT NULL,
  order integer,
  title text,
  pages jsonb,
  CONSTRAINT sayfa_manifesti_pkey PRIMARY KEY (id)
);
CREATE TABLE public.taahhut_arsiv (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eskiid uuid,
  bagisci text,
  miktar numeric,
  aciklama text,
  kayittipi text,
  personeluid text,
  yil integer,
  silenpersoneluid text,
  silenpersoneladi text,
  silinmetarihi timestamp with time zone DEFAULT now(),
  silmeaciklama text,
  createdat timestamp with time zone DEFAULT now(),
  CONSTRAINT taahhut_arsiv_pkey PRIMARY KEY (id)
);
CREATE TABLE public.taahhut_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yil integer NOT NULL,
  ay integer,
  personel text,
  personeluid text,
  bagisci text,
  miktar numeric DEFAULT 0,
  aciklama text,
  not text,
  durum text DEFAULT 'bekliyor'::text,
  tarih timestamp with time zone DEFAULT now(),
  silindi boolean DEFAULT false,
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  muhasebe_kaydedildi boolean DEFAULT false,
  muhasebe_kayit_tarihi timestamp with time zone,
  CONSTRAINT taahhut_kayitlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tahakkuklar (
  id text NOT NULL,
  aciklama text,
  borclu text,
  createdat timestamp with time zone,
  faaliyet text,
  personel text,
  tahakkuk numeric,
  yil integer,
  CONSTRAINT tahakkuklar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tahsilatlar (
  id text NOT NULL,
  borclu text,
  createdat timestamp with time zone,
  faaliyet text,
  odeyen text,
  personel text,
  tahakkukid text,
  tarih timestamp with time zone,
  tutar numeric,
  yil integer,
  yontem text,
  CONSTRAINT tahsilatlar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.takrir_index (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  devre text NOT NULL,
  kitap text,
  ders_adi text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  created_by_uid text,
  CONSTRAINT takrir_index_pkey PRIMARY KEY (id)
);
CREATE TABLE public.talebe_borclar (
  id text NOT NULL,
  isim text,
  tarih timestamp with time zone,
  toplamaidat numeric,
  toplamkitap numeric,
  CONSTRAINT talebe_borclar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.talebeler (
  id text NOT NULL,
  devre text NOT NULL,
  talebe_adi text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  kimlik_adi text,
  kull_adi text,
  dogum_tarihi date,
  mezhep text,
  kan_grubu text,
  durum text DEFAULT 'ensar'::text,
  okul_seviye text,
  okul_durum text,
  universite text,
  bolum text,
  baba_adi text,
  baba_tel text,
  baba_durum text,
  anne_adi text,
  anne_tel text,
  maddi_durum text,
  kardes_sayisi integer DEFAULT 0,
  aktif boolean DEFAULT true,
  CONSTRAINT talebeler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teberru_arsiv (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eskiid text,
  bagisci text,
  miktar numeric,
  odemeyontemi text,
  aciklama text,
  kayittipi text,
  personeluid text,
  personeladi text,
  yil integer,
  silenpersoneluid text,
  silenpersoneladi text,
  silinmetarihi timestamp with time zone DEFAULT now(),
  silmeaciklama text,
  createdat timestamp with time zone DEFAULT now(),
  CONSTRAINT teberru_arsiv_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teberru_kayitlari (
  id text NOT NULL,
  aciklama text,
  ay integer,
  bagisci text,
  createdat timestamp with time zone,
  kaydedenpersonel text,
  kaydedenpersoneluid text,
  miktar numeric,
  not text,
  odeme text,
  odemeyontemi text,
  personel text,
  personeluid text,
  tarih timestamp with time zone,
  updatedat timestamp with time zone,
  yil integer,
  muhasebe_kaydedildi boolean DEFAULT false,
  muhasebe_kayit_tarihi timestamp with time zone,
  CONSTRAINT teberru_kayitlari_pkey PRIMARY KEY (id)
);
CREATE TABLE public.umre_onkayit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  ref text,
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  email text,
  kisiler integer NOT NULL DEFAULT 1 CHECK (kisiler >= 1 AND kisiler <= 20),
  aciklama text,
  CONSTRAINT umre_onkayit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.veriler (
  id text NOT NULL,
  aciklama text,
  adsoyad text,
  ay integer,
  ayyilkey text,
  cihaz text,
  createdat timestamp with time zone,
  createdby text,
  kategori text,
  makbuzno text,
  miktar numeric,
  nereyegeldi text,
  personel text,
  tarih text,
  telefon text,
  tur text,
  uid text,
  useragent text,
  veren text,
  yil integer,
  CONSTRAINT veriler_pkey PRIMARY KEY (id)
);
CREATE TABLE public.yoklama (
  devre text NOT NULL,
  gun date NOT NULL,
  talebeuid text NOT NULL,
  durum text DEFAULT 'none'::text CHECK (durum = ANY (ARRAY['geldi'::text, 'gelmedi'::text, 'izinli'::text, 'none'::text])),
  personel text,
  personeluid text,
  donussaatiso text,
  islemiso timestamp with time zone,
  islemisostr text,
  izinbitisiso timestamp with time zone,
  izinveren text,
  izinaciklama text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  CONSTRAINT yoklama_pkey PRIMARY KEY (devre, gun, talebeuid)
);
CREATE TABLE public.yoklama_namazlar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  devre text NOT NULL,
  gun date NOT NULL,
  talebeuid text NOT NULL,
  talebe_adi text,
  sabah boolean DEFAULT false,
  ogle boolean DEFAULT false,
  ikindi boolean DEFAULT false,
  aksam boolean DEFAULT false,
  yatsi boolean DEFAULT false,
  personeluid text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT yoklama_namazlar_pkey PRIMARY KEY (id)
);