# 📊 Supabase Query Optimizasyonu Rehberi

Bu rehber, Supabase trafik kullanımını azaltmak için query optimizasyonlarını içerir.

## 🎯 Hedef

- Trafik kullanımını %50-70 azaltmak
- Query performansını artırmak
- Kullanıcı deneyimini iyileştirmek

## 📋 Optimizasyon Teknikleri

### 1. Select Sorgularını Optimize Et

#### ❌ YANLIŞ
```javascript
// Tüm kolonları çekiyor - gereksiz veri transferi
const { data } = await supabase.from('kullanicilar').select('*');
```

#### ✅ DOĞRU
```javascript
// Sadece ihtiyaç duyulan kolonları çek
const { data } = await supabase
  .from('kullanicilar')
  .select('id, ad_soyad, email, rol')
  .eq('aktif', true);
```

**Kazanç:** %60-80 daha az veri transferi

---

### 2. Limit Kullan

#### ❌ YANLIŞ
```javascript
// Tüm kayıtları çekiyor
const { data } = await supabase.from('tahakkuklar').select('*');
```

#### ✅ DOĞRU
```javascript
// Sadece ihtiyaç duyulan kadar
const { data } = await supabase
  .from('tahakkuklar')
  .select('*')
  .eq('yil', 2025)
  .order('created_at', { ascending: false })
  .limit(100);
```

**Kazanç:** %90+ daha az veri transferi (büyük tablolarda)

---

### 3. Index Oluştur

Supabase Dashboard > SQL Editor'de:

```sql
-- Sık kullanılan sorgular için index oluştur
CREATE INDEX IF NOT EXISTS idx_tahakkuklar_yil ON public.tahakkuklar(yil);
CREATE INDEX IF NOT EXISTS idx_tahakkuklar_personel ON public.tahakkuklar(personel);
CREATE INDEX IF NOT EXISTS idx_tahakkuklar_yil_personel ON public.tahakkuklar(yil, personel);

CREATE INDEX IF NOT EXISTS idx_tahsilatlar_tarih ON public.tahsilatlar(tarih);
CREATE INDEX IF NOT EXISTS idx_tahsilatlar_yil ON public.tahsilatlar(yil);

CREATE INDEX IF NOT EXISTS idx_kullanicilar_aktif ON public.kullanicilar(aktif);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_rol ON public.kullanicilar(rol);

CREATE INDEX IF NOT EXISTS idx_nobet_index_date ON public.nobet_index(date);
CREATE INDEX IF NOT EXISTS idx_nobet_index_person ON public.nobet_index(person);

CREATE INDEX IF NOT EXISTS idx_ramazan_kayitlari_tarih ON public.ramazan_kayitlari(tarih);
CREATE INDEX IF NOT EXISTS idx_ramazan_kayitlari_tip ON public.ramazan_kayitlari(tip);
CREATE INDEX IF NOT EXISTS idx_ramazan_kayitlari_personel_uid ON public.ramazan_kayitlari(personel_uid);
```

**Kazanç:** Query hızı 10-100x artar, daha az veri transferi

---

### 4. Batch İşlemlerini Optimize Et

#### ❌ YANLIŞ
```javascript
// Her kayıt için ayrı sorgu - çok yavaş ve trafik kullanımı yüksek
for (const item of items) {
  await supabase.from('tablo').insert(item);
}
```

#### ✅ DOĞRU
```javascript
// Toplu insert - tek sorgu
await supabase.from('tablo').insert(items);
```

**Kazanç:** %95+ daha az sorgu sayısı

---

### 5. Cache Kullan

#### Örnek: Sayfa Manifesti Cache

```javascript
// js/ortak.js içinde
let cachedPanels = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

async function fetchPanels() {
  const now = Date.now();
  
  // Cache kontrolü
  if (cachedPanels && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    console.log('📦 Using cached panels');
    return cachedPanels;
  }
  
  // Cache yoksa veya süresi dolmuşsa yükle
  console.log('🔄 Fetching panels from Supabase');
  const { data, error } = await supabase.from('sayfa_manifesti').select('*');
  
  if (error) {
    console.error('Panels fetch error:', error);
    return cachedPanels || []; // Hata durumunda cache'i döndür
  }
  
  cachedPanels = data;
  cacheTime = now;
  return data;
}
```

#### Örnek: Kullanıcı Bilgileri Cache

```javascript
// Kullanıcı bilgilerini cache'le
let cachedUserData = null;
let cachedUserId = null;

async function getUserData(userId) {
  // Aynı kullanıcı için cache kontrolü
  if (cachedUserData && cachedUserId === userId) {
    return cachedUserData;
  }
  
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('id, ad_soyad, rol, yetkiler')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('User data fetch error:', error);
    return null;
  }
  
  cachedUserData = data;
  cachedUserId = userId;
  return data;
}

// Kullanıcı değiştiğinde cache'i temizle
function clearUserCache() {
  cachedUserData = null;
  cachedUserId = null;
}
```

**Kazanç:** %80-90 daha az sorgu (sık kullanılan veriler için)

---

### 6. Gereksiz Sorguları Kaldır

#### ❌ YANLIŞ
```javascript
// Console.log için test sorgusu - production'da kaldırılmalı
console.log('Test:', await supabase.from('tablo').select('*'));

// Kullanılmayan veri çekme
const unused = await supabase.from('tablo').select('*');
```

#### ✅ DOĞRU
```javascript
// Sadece gereken sorguları yap
// Test sorgularını kaldır
// Kullanılmayan veri çekmeyi kaldır
```

---

### 7. Real-time Subscription'ları Optimize Et

#### ❌ YANLIŞ
```javascript
// Tüm değişiklikleri dinle - gereksiz trafik
const subscription = supabase
  .channel('all_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, (payload) => {
    console.log(payload);
  })
  .subscribe();
```

#### ✅ DOĞRU
```javascript
// Sadece gerekli tabloları ve event'leri dinle
const subscription = supabase
  .channel('specific_changes')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'tahakkuklar',
      filter: 'yil=eq.2025'
    }, 
    (payload) => {
      // Sadece 2025 yılı tahakkuklarını dinle
      handleNewTahakkuk(payload.new);
    }
  )
  .subscribe();
```

**Kazanç:** %70-90 daha az real-time trafik

---

### 8. Pagination Kullan

#### ❌ YANLIŞ
```javascript
// Tüm kayıtları tek seferde çek
const { data } = await supabase
  .from('tahakkuklar')
  .select('*')
  .eq('yil', 2025);
```

#### ✅ DOĞRU
```javascript
// Sayfalama ile çek
const PAGE_SIZE = 50;

async function getTahakkuklar(page = 0) {
  const { data, error } = await supabase
    .from('tahakkuklar')
    .select('*')
    .eq('yil', 2025)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  
  return { data, error };
}
```

**Kazanç:** %90+ daha az veri transferi (büyük listeler için)

---

### 9. Sorgu Birleştirme

#### ❌ YANLIŞ
```javascript
// Ayrı ayrı sorgular
const { data: tahakkuklar } = await supabase.from('tahakkuklar').select('*');
const { data: tahsilatlar } = await supabase.from('tahsilatlar').select('*');
```

#### ✅ DOĞRU
```javascript
// Paralel sorgular (Promise.all ile)
const [tahakkukResult, tahsilatResult] = await Promise.all([
  supabase.from('tahakkuklar').select('*'),
  supabase.from('tahsilatlar').select('*')
]);
```

**Kazanç:** Daha hızlı yükleme (paralel işlem)

---

### 10. Conditional Query

#### ❌ YANLIŞ
```javascript
// Her zaman tüm verileri çek
const { data } = await supabase.from('tahakkuklar').select('*');
```

#### ✅ DOĞRU
```javascript
// Sadece gerektiğinde çek
async function loadTahakkuklar(showAll = false) {
  let query = supabase.from('tahakkuklar').select('*');
  
  if (!showAll) {
    // Sadece bu yıl
    query = query.eq('yil', new Date().getFullYear());
  }
  
  const { data, error } = await query;
  return { data, error };
}
```

---

## 📊 Örnek Optimizasyon Senaryoları

### Senaryo 1: Panel Sayfası

#### Önce:
```javascript
// Tüm tahakkuklar ve tahsilatlar
const { data: tahakkuklar } = await supabase.from('tahakkuklar').select('*');
const { data: tahsilatlar } = await supabase.from('tahsilatlar').select('*');
```

#### Sonra:
```javascript
// Sadece bu yıl, sadece gerekli kolonlar, limit
const yil = new Date().getFullYear();
const [tahakkukResult, tahsilatResult] = await Promise.all([
  supabase
    .from('tahakkuklar')
    .select('id, yil, faaliyet, personel, borclu, tahakkuk, created_at')
    .eq('yil', yil)
    .limit(1000),
  supabase
    .from('tahsilatlar')
    .select('id, tahakkuk_id, yil, tutar, tarih, yontem')
    .eq('yil', yil)
    .limit(1000)
]);
```

**Kazanç:** %70-80 daha az veri transferi

---

### Senaryo 2: Kullanıcı Listesi

#### Önce:
```javascript
const { data } = await supabase.from('kullanicilar').select('*');
```

#### Sonra:
```javascript
const { data } = await supabase
  .from('kullanicilar')
  .select('id, ad_soyad, email, rol, aktif')
  .eq('aktif', true)
  .order('ad_soyad');
```

**Kazanç:** %60-70 daha az veri transferi

---

## 🔍 Monitoring

### Supabase Dashboard'da İzle

1. **Usage** bölümünde:
   - Bandwidth kullanımı
   - API istek sayısı
   - Database size

2. **Logs** bölümünde:
   - Yavaş sorgular
   - Hata sayıları

3. **Database** bölümünde:
   - Index kullanımı
   - Query performansı

---

## ✅ Kontrol Listesi

- [ ] Tüm `select('*')` sorgularını spesifik kolonlara çevir
- [ ] Büyük listeler için limit ekle
- [ ] Sık kullanılan sorgular için index oluştur
- [ ] Cache mekanizması ekle (gerekli yerlerde)
- [ ] Batch işlemlerini optimize et
- [ ] Gereksiz sorguları kaldır
- [ ] Real-time subscription'ları optimize et
- [ ] Pagination ekle (büyük listeler için)
- [ ] Trafik kullanımını izle

---

**Son Güncelleme:** 2025-01-27

