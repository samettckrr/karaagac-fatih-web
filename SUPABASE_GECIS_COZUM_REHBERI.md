# 🚀 Supabase Geçiş Çözüm Rehberi

Bu rehber, Firebase'den Supabase'e geçişte karşılaştığınız tüm sorunları çözmek için hazırlanmıştır.

## 📋 İçindekiler

1. [Mevcut Durum Analizi](#mevcut-durum-analizi)
2. [Tablo İsimleri ve Büyük/Küçük Harf Sorunları](#tablo-isimleri-ve-büyükküçük-harf-sorunları)
3. [RLS (Row Level Security) Ayarları](#rls-row-level-security-ayarları)
4. [Trafik Optimizasyonu](#trafik-optimizasyonu)
5. [Kalan Sayfaların Supabase'e Geçişi](#kalan-sayfaların-supabasee-geçişi)
6. [Adım Adım Uygulama](#adım-adım-uygulama)

---

## 🔍 Mevcut Durum Analizi

### ✅ Supabase'e Geçmiş Sayfalar
- `index.html` (Giriş sayfası)
- `panel.html` (Ana panel)
- `admin/nobetayarlari.html`
- `admin/bildirim-gorev.html`
- `admin/kullanici-ekle.html`
- `personel/iftar-sahur-yonetim.html`
- `personel/iftar-sahur-form.html`
- `personel/hedef-grafik.html`

### ⚠️ Hala Firebase Kullanan Sayfalar
- Tüm `talebe/` klasöründeki sayfalar
- Tüm `muhasebe/` klasöründeki sayfalar
- `kermes/` klasöründeki sayfalar
- `parcalar/talebe-kayit*.html` sayfaları

### 📊 Kullanılan Supabase Tabloları

**Mevcut tablolar:**
- `kullanici_log`
- `sayfa_manifesti`
- `kullanicilar`
- `tahakkuklar`
- `tahsilatlar`
- `nobet_ayar`
- `nobet_planlari`
- `nobet_index`
- `islem_log`
- `ramazan_kayitlari`
- `ramazan_yillar`
- `ramazan_mahaller`
- `ramazan_hedefler`
- `ramazan_veriler`
- `ramazan_menuler`
- `ramazan_ayarlar`
- `ramazan_secenekler`
- `teberru_kayitlari`
- `taahhut_kayitlari` (veya `veriler` tablosu ile `tur='taahhut'`)
- `duzenleme_talepleri`
- `ramazan_silinen_kayitlar`
- `hedefler`
- `veriler`

---

## 🔤 Tablo İsimleri ve Büyük/Küçük Harf Sorunları

### Sorun
PostgreSQL (Supabase'in kullandığı veritabanı) büyük/küçük harfe duyarlıdır. Tablo isimleri tırnak içinde yazılmazsa otomatik olarak küçük harfe çevrilir.

### Çözüm: Standartlaştırma

**Kural:** Tüm tablo isimleri **küçük harf** ve **snake_case** formatında olmalı.

#### 1. Tablo İsimlerini Kontrol Et

Supabase Dashboard > SQL Editor'de çalıştırın:

```sql
-- Tüm tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### 2. Tablo İsimlerini Düzelt

Eğer büyük harf içeren tablolar varsa, bunları yeniden adlandırın:

```sql
-- Örnek: Eğer "Kullanicilar" tablosu varsa
ALTER TABLE "Kullanicilar" RENAME TO kullanicilar;

-- Tüm büyük harfli tabloları kontrol et ve düzelt
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != LOWER(tablename)
    LOOP
        EXECUTE format('ALTER TABLE %I RENAME TO %I', r.tablename, LOWER(r.tablename));
    END LOOP;
END $$;
```

#### 3. Kodda Tablo İsimlerini Standartlaştır

Tüm kodda tablo isimlerini küçük harf ve snake_case formatına çevirin:

```javascript
// ❌ YANLIŞ
supabase.from('Kullanicilar')
supabase.from('Tahakkuklar')
supabase.from('RamazanKayitlari')

// ✅ DOĞRU
supabase.from('kullanicilar')
supabase.from('tahakkuklar')
supabase.from('ramazan_kayitlari')
```

---

## 🔒 RLS (Row Level Security) Ayarları

### Sorun
RLS ayarları yapılmadığı için veritabanı erişim hataları oluşuyor.

### Çözüm: Tüm Tablolar İçin RLS Politikaları

Aşağıdaki SQL scriptini Supabase Dashboard > SQL Editor'de çalıştırın:

```sql
-- ============================================
-- TÜM TABLOLAR İÇİN RLS POLİTİKALARI
-- ============================================

-- 1. RLS'yi etkinleştir
ALTER TABLE public.kullanici_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sayfa_manifesti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahakkuklar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahsilatlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nobet_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nobet_planlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nobet_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islem_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hedefler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veriler ENABLE ROW LEVEL SECURITY;

-- ============================================
-- kullanici_log
-- ============================================
DROP POLICY IF EXISTS "kullanici_log_select" ON public.kullanici_log;
CREATE POLICY "kullanici_log_select" ON public.kullanici_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kullanici_log_insert" ON public.kullanici_log;
CREATE POLICY "kullanici_log_insert" ON public.kullanici_log
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- sayfa_manifesti
-- ============================================
DROP POLICY IF EXISTS "sayfa_manifesti_select" ON public.sayfa_manifesti;
CREATE POLICY "sayfa_manifesti_select" ON public.sayfa_manifesti
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sayfa_manifesti_insert" ON public.sayfa_manifesti;
CREATE POLICY "sayfa_manifesti_insert" ON public.sayfa_manifesti
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sayfa_manifesti_update" ON public.sayfa_manifesti;
CREATE POLICY "sayfa_manifesti_update" ON public.sayfa_manifesti
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sayfa_manifesti_delete" ON public.sayfa_manifesti;
CREATE POLICY "sayfa_manifesti_delete" ON public.sayfa_manifesti
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- kullanicilar
-- ============================================
DROP POLICY IF EXISTS "kullanicilar_select" ON public.kullanicilar;
CREATE POLICY "kullanicilar_select" ON public.kullanicilar
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kullanicilar_insert" ON public.kullanicilar;
CREATE POLICY "kullanicilar_insert" ON public.kullanicilar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kullanicilar_update" ON public.kullanicilar;
CREATE POLICY "kullanicilar_update" ON public.kullanicilar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kullanicilar_delete" ON public.kullanicilar;
CREATE POLICY "kullanicilar_delete" ON public.kullanicilar
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- tahakkuklar
-- ============================================
DROP POLICY IF EXISTS "tahakkuklar_select" ON public.tahakkuklar;
CREATE POLICY "tahakkuklar_select" ON public.tahakkuklar
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahakkuklar_insert" ON public.tahakkuklar;
CREATE POLICY "tahakkuklar_insert" ON public.tahakkuklar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahakkuklar_update" ON public.tahakkuklar;
CREATE POLICY "tahakkuklar_update" ON public.tahakkuklar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahakkuklar_delete" ON public.tahakkuklar;
CREATE POLICY "tahakkuklar_delete" ON public.tahakkuklar
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- tahsilatlar
-- ============================================
DROP POLICY IF EXISTS "tahsilatlar_select" ON public.tahsilatlar;
CREATE POLICY "tahsilatlar_select" ON public.tahsilatlar
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahsilatlar_insert" ON public.tahsilatlar;
CREATE POLICY "tahsilatlar_insert" ON public.tahsilatlar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahsilatlar_update" ON public.tahsilatlar;
CREATE POLICY "tahsilatlar_update" ON public.tahsilatlar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tahsilatlar_delete" ON public.tahsilatlar;
CREATE POLICY "tahsilatlar_delete" ON public.tahsilatlar
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- nobet_ayar
-- ============================================
DROP POLICY IF EXISTS "nobet_ayar_select" ON public.nobet_ayar;
CREATE POLICY "nobet_ayar_select" ON public.nobet_ayar
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_ayar_insert" ON public.nobet_ayar;
CREATE POLICY "nobet_ayar_insert" ON public.nobet_ayar
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_ayar_update" ON public.nobet_ayar;
CREATE POLICY "nobet_ayar_update" ON public.nobet_ayar
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- nobet_planlari
-- ============================================
DROP POLICY IF EXISTS "nobet_planlari_select" ON public.nobet_planlari;
CREATE POLICY "nobet_planlari_select" ON public.nobet_planlari
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_planlari_insert" ON public.nobet_planlari;
CREATE POLICY "nobet_planlari_insert" ON public.nobet_planlari
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_planlari_update" ON public.nobet_planlari;
CREATE POLICY "nobet_planlari_update" ON public.nobet_planlari
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_planlari_delete" ON public.nobet_planlari;
CREATE POLICY "nobet_planlari_delete" ON public.nobet_planlari
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- nobet_index
-- ============================================
DROP POLICY IF EXISTS "nobet_index_select" ON public.nobet_index;
CREATE POLICY "nobet_index_select" ON public.nobet_index
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_index_insert" ON public.nobet_index;
CREATE POLICY "nobet_index_insert" ON public.nobet_index
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_index_update" ON public.nobet_index;
CREATE POLICY "nobet_index_update" ON public.nobet_index
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nobet_index_delete" ON public.nobet_index;
CREATE POLICY "nobet_index_delete" ON public.nobet_index
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- islem_log
-- ============================================
DROP POLICY IF EXISTS "islem_log_select" ON public.islem_log;
CREATE POLICY "islem_log_select" ON public.islem_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "islem_log_insert" ON public.islem_log;
CREATE POLICY "islem_log_insert" ON public.islem_log
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- hedefler
-- ============================================
DROP POLICY IF EXISTS "hedefler_select" ON public.hedefler;
CREATE POLICY "hedefler_select" ON public.hedefler
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hedefler_insert" ON public.hedefler;
CREATE POLICY "hedefler_insert" ON public.hedefler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hedefler_update" ON public.hedefler;
CREATE POLICY "hedefler_update" ON public.hedefler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hedefler_delete" ON public.hedefler;
CREATE POLICY "hedefler_delete" ON public.hedefler
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- veriler
-- ============================================
DROP POLICY IF EXISTS "veriler_select" ON public.veriler;
CREATE POLICY "veriler_select" ON public.veriler
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "veriler_insert" ON public.veriler;
CREATE POLICY "veriler_insert" ON public.veriler
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "veriler_update" ON public.veriler;
CREATE POLICY "veriler_update" ON public.veriler
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "veriler_delete" ON public.veriler;
CREATE POLICY "veriler_delete" ON public.veriler
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

**Not:** Ramazan tabloları için `ramazan-tablolar-ve-rls.sql` dosyasını kullanın.

---

## 📊 Trafik Optimizasyonu

### Sorun
Ücretsiz planın 5GB trafik kotası aşılmış.

### Çözüm: Query Optimizasyonları

#### 1. Select Sorgularını Optimize Et

```javascript
// ❌ YANLIŞ - Tüm kolonları çekiyor
const { data } = await supabase.from('kullanicilar').select('*');

// ✅ DOĞRU - Sadece ihtiyaç duyulan kolonları çek
const { data } = await supabase
  .from('kullanicilar')
  .select('id, adSoyad, email, rol')
  .eq('aktif', true);
```

#### 2. Limit Kullan

```javascript
// ❌ YANLIŞ - Tüm kayıtları çekiyor
const { data } = await supabase.from('tahakkuklar').select('*');

// ✅ DOĞRU - Sadece ihtiyaç duyulan kadar
const { data } = await supabase
  .from('tahakkuklar')
  .select('*')
  .eq('yil', 2025)
  .limit(100);
```

#### 3. Index Kullan

Supabase Dashboard > SQL Editor'de:

```sql
-- Sık kullanılan sorgular için index oluştur
CREATE INDEX IF NOT EXISTS idx_tahakkuklar_yil ON public.tahakkuklar(yil);
CREATE INDEX IF NOT EXISTS idx_tahakkuklar_personel ON public.tahakkuklar(personel);
CREATE INDEX IF NOT EXISTS idx_tahsilatlar_tarih ON public.tahsilatlar(tarih);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_aktif ON public.kullanicilar(aktif);
CREATE INDEX IF NOT EXISTS idx_nobet_index_date ON public.nobet_index(date);
```

#### 4. Batch İşlemlerini Optimize Et

```javascript
// ❌ YANLIŞ - Her kayıt için ayrı sorgu
for (const item of items) {
  await supabase.from('tablo').insert(item);
}

// ✅ DOĞRU - Toplu insert
await supabase.from('tablo').insert(items);
```

#### 5. Cache Kullan

```javascript
// Örnek: Sayfa manifesti cache'le
let cachedPanels = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

async function getPanels() {
  const now = Date.now();
  if (cachedPanels && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    return cachedPanels;
  }
  
  const { data } = await supabase.from('sayfa_manifesti').select('*');
  cachedPanels = data;
  cacheTime = now;
  return data;
}
```

#### 6. Gereksiz Sorguları Kaldır

- Console.log içindeki test sorgularını kaldırın
- Kullanılmayan veri çekme işlemlerini kaldırın
- Real-time subscription'ları sadece gerektiğinde kullanın

---

## 🔄 Kalan Sayfaların Supabase'e Geçişi

### Öncelik Sırası

1. **Yüksek Öncelik** (Sık kullanılan sayfalar)
   - `talebe/talebe-liste.html`
   - `talebe/talebe-bilgi-formu.html`
   - `muhasebe/muhasebe-form.html`

2. **Orta Öncelik**
   - `talebe/takrir-durumu.html`
   - `muhasebe/genel-muhasebe.html`
   - `kermes/kermes.html`

3. **Düşük Öncelik**
   - Rapor sayfaları
   - Yazdırma sayfaları

### Geçiş Adımları

Her sayfa için:

1. **Firebase kodlarını tespit et:**
   ```javascript
   // Arama yapılacak pattern'ler:
   - firebase.firestore()
   - window.db
   - db.collection()
   - db.doc()
   ```

2. **Supabase'e çevir:**
   ```javascript
   // Firebase
   const doc = await db.collection('tablo').doc(id).get();
   const data = doc.data();
   
   // Supabase
   const { data, error } = await supabase
     .from('tablo')
     .select('*')
     .eq('id', id)
     .single();
   ```

3. **Test et:**
   - Sayfayı aç
   - Veri yükleme işlemlerini test et
   - Hata kontrolü yap

---

## 📝 Adım Adım Uygulama

### Adım 1: Tablo İsimlerini Düzelt (15 dakika)

1. Supabase Dashboard > SQL Editor'e git
2. Tablo listesini kontrol et:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
3. Büyük harf içeren tabloları düzelt (yukarıdaki script'i kullan)
4. Kodda tablo isimlerini kontrol et ve düzelt

### Adım 2: RLS Politikalarını Uygula (30 dakika)

1. `supabase-tum-rls-politikalari.sql` dosyasını oluştur (aşağıda)
2. Supabase Dashboard > SQL Editor'de çalıştır
3. Her tablo için politikaları kontrol et:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tablo_adi';
   ```

### Adım 3: Query Optimizasyonu (1 saat)

1. Tüm `supabase.from()` kullanımlarını bul
2. Her sorguyu optimize et:
   - Gereksiz `select('*')` yerine spesifik kolonlar
   - Limit ekle
   - Index oluştur
3. Cache mekanizması ekle (gerekli yerlerde)

### Adım 4: Test (2 saat)

1. Her sayfayı test et
2. Console'da hata kontrolü yap
3. Trafik kullanımını izle (Supabase Dashboard > Usage)

### Adım 5: Kalan Sayfaları Geçir (Haftalık plan)

Her hafta 2-3 sayfa geçir:
- Pazartesi: Planlama
- Salı-Çarşamba: Geçiş
- Perşembe: Test
- Cuma: Düzeltmeler

---

## 🛠️ Yardımcı Scriptler

### Tablo İsimlerini Kontrol Et

```sql
-- Büyük harf içeren tabloları bul
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename != LOWER(tablename);
```

### RLS Durumunu Kontrol Et

```sql
-- RLS etkin olmayan tabloları bul
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename 
  FROM pg_policies 
  GROUP BY tablename
);
```

### Trafik Kullanımını İzle

Supabase Dashboard > Usage bölümünden:
- Bandwidth kullanımını kontrol et
- API istek sayısını kontrol et
- Database size'ı kontrol et

---

## ⚠️ Önemli Notlar

1. **Yedek Al:** Her değişiklikten önce veritabanı yedeği alın
2. **Test Ortamı:** Mümkünse test ortamında deneyin
3. **Kademeli Geçiş:** Tüm sayfaları aynı anda geçirmeyin
4. **Monitoring:** Trafik kullanımını sürekli izleyin
5. **Documentation:** Yaptığınız değişiklikleri dokümante edin

---

## 📞 Destek

Sorun yaşarsanız:
1. Console hatalarını kontrol edin (F12)
2. Supabase Dashboard > Logs bölümüne bakın
3. SQL sorgularını test edin (SQL Editor'de)

---

## ✅ Kontrol Listesi

- [ ] Tablo isimleri küçük harf ve snake_case
- [ ] Tüm tablolar için RLS etkin
- [ ] RLS politikaları uygulandı
- [ ] Query'ler optimize edildi
- [ ] Index'ler oluşturuldu
- [ ] Cache mekanizması eklendi
- [ ] Tüm sayfalar test edildi
- [ ] Trafik kullanımı optimize edildi
- [ ] Kalan sayfalar için geçiş planı hazır

---

**Son Güncelleme:** 2025-01-27

