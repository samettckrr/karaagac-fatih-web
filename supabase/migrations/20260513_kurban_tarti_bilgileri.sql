-- Kurban tartı bilgileri: kesilen kurbandan her hisseye düşen et/kemik kg
CREATE TABLE IF NOT EXISTS kurban_tarti_bilgileri (
  id            bigint generated always as identity primary key,
  kurban_id     uuid not null,
  yil           integer not null,
  et_kg         decimal(8,2) not null default 0,
  kemik_kg      decimal(8,2) not null default 0,
  guncelleme_tarihi timestamptz default now(),
  girildi_by    text,
  created_at    timestamptz default now(),
  UNIQUE(kurban_id)
);

-- Anonim (tek kullanımlık) giriş tokenleri
CREATE TABLE IF NOT EXISTS kurban_tarti_tokenler (
  id             bigint generated always as identity primary key,
  token          text unique not null,
  yil            integer not null,
  kurban_listesi jsonb,            -- [{id, kesim_sirasi, ilk_hissedar}]
  olusturulma    timestamptz default now(),
  kullanildi     boolean default false,
  kullanilma_tarihi timestamptz,
  olusturan_uid  text
);

-- RLS
ALTER TABLE kurban_tarti_bilgileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurban_tarti_tokenler  ENABLE ROW LEVEL SECURITY;

-- Authenticated: tam erişim
CREATE POLICY "tarti_auth_all"
  ON kurban_tarti_bilgileri FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "token_auth_all"
  ON kurban_tarti_tokenler FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Anon: token okuma (güvenlik token'ın 48-char hex random string olmasına dayanır)
CREATE POLICY "token_anon_select"
  ON kurban_tarti_tokenler FOR SELECT TO anon
  USING (true);

-- Anon: yeni token oluşturma (frontend Firebase auth kullanır, Supabase'de anon rolü)
CREATE POLICY "token_anon_insert"
  ON kurban_tarti_tokenler FOR INSERT TO anon
  WITH CHECK (true);

-- Anon: token'ı kullanıldı olarak işaretleme (USING=true; SELECT policy kullanildi=false ile çakışmaması için)
CREATE POLICY "token_anon_update"
  ON kurban_tarti_tokenler FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Anon: tartı bilgisi okuma (mevcut kaydı çekmek için)
CREATE POLICY "tarti_anon_select"
  ON kurban_tarti_bilgileri FOR SELECT TO anon
  USING (true);

-- Anon: tartı bilgisi ekleme
CREATE POLICY "tarti_anon_insert"
  ON kurban_tarti_bilgileri FOR INSERT TO anon
  WITH CHECK (true);

-- Anon: tartı bilgisi güncelleme
CREATE POLICY "tarti_anon_update"
  ON kurban_tarti_bilgileri FOR UPDATE TO anon
  USING (true) WITH CHECK (true);
