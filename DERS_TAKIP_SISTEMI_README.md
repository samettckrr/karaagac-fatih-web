# Ders Takip Sistemi - Tek Tablo Mimarisi

## 📋 Genel Bakış

Bu sistem, ders kayıtlarını tek bir tabloda tutarak hızlı filtreleme ve güçlü analiz imkanı sunar. Supabase PostgreSQL veritabanı kullanılarak geliştirilmiştir.

## 🎯 Özellikler

- ✅ **Hızlı**: Optimize edilmiş index'ler ile hızlı sorgular
- ✅ **Güvenilir**: RLS (Row Level Security) politikaları ile güvenli erişim
- ✅ **Sağlam**: UNIQUE constraint'ler ile veri tutarlılığı
- ✅ **Doğru**: Validasyon ve kontrol mekanizmaları
- ✅ **Güçlü Analiz**: Çoklu filtreleme ve raporlama seçenekleri

## 📁 Dosya Yapısı

```
scripts/
  ├── ders-kayitlari-tablosu.sql          # Tablo oluşturma scripti
  └── firebase-to-supabase-ders-migration.js  # Migrasyon scripti

js/
  └── ders-takip.js                       # API fonksiyonları modülü

talebe/
  ├── ders-takip.html                     # Ana sayfa (filtreleme ve listeleme)
  └── ders-takip-rapor.html               # Raporlama sayfası
```

## 🚀 Kurulum

### 1. Veritabanı Tablosunu Oluşturma

Supabase Dashboard > SQL Editor'de `scripts/ders-kayitlari-tablosu.sql` dosyasını çalıştırın.

Bu script:
- `ders_kayitlari` tablosunu oluşturur
- Gerekli index'leri ekler
- RLS politikalarını uygular
- Trigger'ları oluşturur

### 2. Migrasyon (Opsiyonel)

Eğer Firebase'den veri taşıyacaksanız:

```bash
# Gerekli paketleri yükleyin
npm install firebase-admin @supabase/supabase-js

# Ortam değişkenlerini ayarlayın
export FIREBASE_PROJECT_ID=your-project-id
export SUPABASE_URL=your-supabase-url
export SUPABASE_SERVICE_KEY=your-service-key

# Migrasyonu çalıştırın
node scripts/firebase-to-supabase-ders-migration.js [devre]
```

Örnek:
```bash
node scripts/firebase-to-supabase-ders-migration.js 6.Devre
```

## 📖 Kullanım

### Ana Sayfa: `talebe/ders-takip.html`

Bu sayfa ile:
- Devre, kitap, ders, talebe, durum ve tarih bazlı filtreleme yapabilirsiniz
- Kayıtları tablo formatında görüntüleyebilirsiniz
- Durum güncellemeleri yapabilirsiniz
- İstatistikleri görüntüleyebilirsiniz

**Filtreleme Senaryoları:**
1. **Devre + Kitap + Ders**: Belirli bir ders için tüm talebeleri görüntüle
2. **Devre + Kitap + Talebe**: Bir talebenin o kitaptaki tüm derslerini görüntüle
3. **Tarih**: Belirli bir tarihte ders verenleri görüntüle
4. **Durum**: Belirli durumdaki kayıtları görüntüle

### Raporlama Sayfası: `talebe/ders-takip-rapor.html`

Bu sayfa ile detaylı raporlar oluşturabilirsiniz:

1. **Talebe Bazlı Rapor**
   - Talebe seçerek tüm derslerini görüntüle
   - Kitap bazlı gruplama
   - Durum bazlı istatistikler

2. **Kitap Bazlı Rapor**
   - Kitap seçerek tüm talebe ve dersleri görüntüle
   - Ders bazlı gruplama
   - Durum dağılımı

3. **Tarih Bazlı Rapor**
   - Tarih seçerek o gün ders verenleri görüntüle
   - Günlük istatistikler

4. **Personel Bazlı Rapor**
   - Personel seçerek kayıt/verme istatistiklerini görüntüle
   - Kaydeden veya veren personel seçeneği

## 🔧 API Fonksiyonları

`js/ders-takip.js` modülü aşağıdaki fonksiyonları sağlar:

### CRUD İşlemleri

```javascript
// Yeni ders kaydı oluştur
await window.dersTakipAPI.dersKaydiOlustur({
  devre: '6.Devre',
  kitap: 'Kitap Adı',
  ders_adi: 'Ders Adı',
  talebe_uid: 'talebe-uid',
  talebe_adi: 'Talebe Adı',
  ders_gunu: '2025-01-15'
});

// Ders kaydı güncelle
await window.dersTakipAPI.dersKaydiGuncelle(kayitId, {
  ders_verme_durumu: 'verdi',
  ders_veren_personel: 'Personel Adı',
  ders_veren_personel_uid: 'personel-uid',
  ders_verme_tarihi: new Date().toISOString()
});

// Ders kaydı sil
await window.dersTakipAPI.dersKaydiSil(kayitId);
```

### Filtreleme

```javascript
// Filtreleme ile kayıtları getir
const kayitlar = await window.dersTakipAPI.dersKayitlariGetir({
  devre: '6.Devre',
  kitap: 'Kitap Adı',
  ders_adi: 'Ders Adı',
  talebe_uid: 'talebe-uid',
  ders_verme_durumu: 'verdi',
  ders_gunu: '2025-01-15'
}, {
  limit: 100,
  offset: 0,
  orderBy: 'created_at',
  ascending: false
});
```

### Raporlama

```javascript
// Talebe bazlı rapor
const rapor = await window.dersTakipAPI.talebeDersRaporu('talebe-uid', '6.Devre');

// Kitap bazlı analiz
const analiz = await window.dersTakipAPI.kitapAnalizi('6.Devre', 'Kitap Adı');

// Tarih bazlı rapor
const tarihRaporu = await window.dersTakipAPI.tarihBazliRapor('2025-01-15');

// Personel bazlı rapor
const personelRaporu = await window.dersTakipAPI.personelBazliRapor('personel-uid', 'kaydeden');
```

## 📊 Veritabanı Şeması

### Tablo: `ders_kayitlari`

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid | Primary key |
| `devre` | text | Devre adı (örn: "6.Devre") |
| `kitap` | text | Kitap adı |
| `ders_adi` | text | Ders adı |
| `ders_gunu` | date | Dersin kayıt tarihi |
| `kaydeden_personel` | text | Kaydeden personel adı |
| `kaydeden_personel_uid` | text | Kaydeden personel UID |
| `talebe_uid` | text | Talebe UID |
| `talebe_adi` | text | Talebe adı (denormalize) |
| `ders_verme_durumu` | text | 'henuz_verilmedi' / 'verdi' / 'veremedi' / 'yarim' |
| `ders_verme_tarihi` | timestamp | Ders verildiği tarih-zaman |
| `ders_veren_personel` | text | Veren personel adı |
| `ders_veren_personel_uid` | text | Veren personel UID |
| `created_at` | timestamp | Oluşturulma tarihi |
| `updated_at` | timestamp | Güncellenme tarihi |

### Constraint'ler

- **UNIQUE**: `(devre, kitap, ders_adi, talebe_uid)` - Bir talebe aynı devre-kitap-ders için sadece bir kayıt
- **CHECK**: `ders_verme_durumu` sadece belirli değerleri alabilir

### Index'ler

Performans için 9 adet index oluşturulmuştur:
1. `idx_ders_kayitlari_devre_kitap_ders` - En sık kullanılan filtreleme
2. `idx_ders_kayitlari_devre_kitap_talebe` - Talebe bazlı filtreleme
3. `idx_ders_kayitlari_talebe_uid` - Talebe bazlı tüm dersler
4. `idx_ders_kayitlari_ders_gunu` - Tarih bazlı filtreleme
5. `idx_ders_kayitlari_kaydeden_uid` - Personel bazlı (kim kaydetti)
6. `idx_ders_kayitlari_veren_uid` - Personel bazlı (kim verdi)
7. `idx_ders_kayitlari_verme_tarihi` - Tarih bazlı (bugün kimler ders vermiş)
8. `idx_ders_kayitlari_devre_talebe` - Devre bazlı talebe dersleri
9. `idx_ders_kayitlari_durum` - Durum bazlı filtreleme

## 🔒 Güvenlik

- **RLS (Row Level Security)**: Tüm authenticated kullanıcılar kayıtları okuyabilir, ekleyebilir ve güncelleyebilir
- **Input Validation**: Tüm girişler doğrulanır
- **XSS Koruması**: HTML escape fonksiyonları kullanılır

## 📝 Notlar

1. **Denormalizasyon**: `talebe_adi`, `kaydeden_personel`, `ders_veren_personel` sütunları performans için denormalize tutulur
2. **Durum Değerleri**: NULL (henüz işlem yapılmadı), 'henuz_verilmedi', 'verdi', 'veremedi', 'yarim'
3. **Otomatik Güncelleme**: `updated_at` sütunu trigger ile otomatik güncellenir

## 🐛 Sorun Giderme

### Kayıt eklenemiyor
- UNIQUE constraint hatası alıyorsanız, kayıt zaten mevcut olabilir
- RLS politikalarını kontrol edin

### Filtreleme yavaş
- Index'lerin oluşturulduğundan emin olun
- Sorgu planını kontrol edin (Supabase Dashboard > Database > Query Performance)

### Veri görünmüyor
- RLS politikalarını kontrol edin
- Filtre kriterlerini kontrol edin
- Supabase client'ın doğru yapılandırıldığından emin olun

## 📞 Destek

Sorularınız için proje yöneticisi ile iletişime geçin.
