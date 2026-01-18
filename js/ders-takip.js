// ============================================
// DERS TAKİP SİSTEMİ - Supabase API Modülü
// ============================================

/**
 * Supabase client'ı al
 */
function getSupabase() {
  if (!window.supabase) {
    throw new Error('Supabase client bulunamadı. Sayfa yüklenirken bekleyin.');
  }
  return window.supabase;
}

/**
 * Mevcut kullanıcı bilgilerini al
 * Optimize retry mekanizması ile (çoklu sayfa çakışması önleme)
 */
async function getCurrentUser() {
  const sb = getSupabase();
  
  // window.getSessionWithRetry varsa kullan (ortak.js'den gelir), yoksa direkt getSession kullan
  const getSessionFn = (typeof window.getSessionWithRetry === 'function') 
    ? window.getSessionWithRetry 
    : async () => await sb.auth.getSession();
  
  const { data: { session }, error } = await getSessionFn();
  if (error || !session) {
    throw new Error('Oturum bulunamadı. Lütfen giriş yapın.');
  }
  return session.user;
}

/**
 * Kullanıcı profil bilgilerini al
 */
async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  const sb = getSupabase();
  const { data, error } = await sb
    .from('kullanicilar')
    .select('adsoyad, rol, yetkiler')
    .eq('id', user.id)
    .single();
  
  if (error || !data) {
    return { uid: user.id, adsoyad: user.email?.split('@')[0] || 'Bilinmeyen', rol: null };
  }
  
  return { uid: user.id, adsoyad: data.adsoyad || user.email?.split('@')[0] || 'Bilinmeyen', rol: data.rol };
}

// ============================================
// CRUD İŞLEMLERİ
// ============================================

/**
 * Yeni ders kaydı oluştur
 * @param {Object} params - { devre, kitap, ders_adi, talebe_uid, talebe_adi, ders_gunu }
 * @returns {Promise<Object>}
 */
async function dersKaydiOlustur(params) {
  const { devre, kitap, ders_adi, talebe_uid, talebe_adi, ders_gunu } = params;
  
  if (!devre || !kitap || !ders_adi || !talebe_uid) {
    throw new Error('Devre, kitap, ders adı ve talebe UID zorunludur.');
  }
  
  const userProfile = await getCurrentUserProfile();
  const sb = getSupabase();
  
  const kayit = {
    devre: String(devre).trim(),
    kitap: String(kitap).trim(),
    ders_adi: String(ders_adi).trim(),
    talebe_uid: String(talebe_uid).trim(),
    talebe_adi: talebe_adi ? String(talebe_adi).trim() : null,
    ders_gunu: ders_gunu || new Date().toISOString().slice(0, 10),
    kaydeden_personel: userProfile.adsoyad,
    kaydeden_personel_uid: userProfile.uid,
    ders_verme_durumu: null // Başlangıçta null (henüz işlem yapılmadı)
  };
  
  const { data, error } = await sb
    .from('ders_kayitlari')
    .insert(kayit)
    .select()
    .single();
  
  if (error) {
    // UNIQUE constraint hatası ise, mevcut kaydı döndür
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('ders_kayitlari')
        .select()
        .eq('devre', devre)
        .eq('kitap', kitap)
        .eq('ders_adi', ders_adi)
        .eq('talebe_uid', talebe_uid)
        .single();
      
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
  
  return data;
}

/**
 * Ders kaydı güncelle (durum, veren personel, tarih)
 * @param {string} id - Kayıt ID
 * @param {Object} updates - { ders_verme_durumu, ders_veren_personel, ders_veren_personel_uid, ders_verme_tarihi }
 * @returns {Promise<Object>}
 */
async function dersKaydiGuncelle(id, updates) {
  if (!id) {
    throw new Error('Kayıt ID zorunludur.');
  }
  
  const userProfile = await getCurrentUserProfile();
  const sb = getSupabase();
  
  const updateData = {
    updated_at: new Date().toISOString()
  };
  
  // Durum güncellemesi
  if (updates.ders_verme_durumu !== undefined) {
    const allowedStatuses = ['henuz_verilmedi', 'verdi', 'veremedi', 'yarim'];
    if (updates.ders_verme_durumu && !allowedStatuses.includes(updates.ders_verme_durumu)) {
      throw new Error(`Geçersiz durum: ${updates.ders_verme_durumu}`);
    }
    updateData.ders_verme_durumu = updates.ders_verme_durumu;
  }
  
  // Veren personel bilgileri
  if (updates.ders_veren_personel_uid) {
    updateData.ders_veren_personel_uid = updates.ders_veren_personel_uid;
    updateData.ders_veren_personel = updates.ders_veren_personel || userProfile.adsoyad;
  } else if (updates.ders_verme_durumu && updates.ders_verme_durumu !== 'henuz_verilmedi') {
    // Durum güncelleniyorsa ve veren personel belirtilmemişse, mevcut kullanıcıyı ata
    updateData.ders_veren_personel_uid = userProfile.uid;
    updateData.ders_veren_personel = userProfile.adsoyad;
  }
  
  // Verilme tarihi
  if (updates.ders_verme_tarihi !== undefined) {
    updateData.ders_verme_tarihi = updates.ders_verme_tarihi;
  } else if (updates.ders_verme_durumu && updates.ders_verme_durumu !== 'henuz_verilmedi' && !updateData.ders_verme_tarihi) {
    // Durum güncelleniyorsa ve tarih belirtilmemişse, şimdiki zamanı ata
    updateData.ders_verme_tarihi = new Date().toISOString();
  }
  
  const { data, error } = await sb
    .from('ders_kayitlari')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Ders kaydı sil (soft delete için kullanılabilir)
 * @param {string} id - Kayıt ID
 * @returns {Promise<void>}
 */
async function dersKaydiSil(id) {
  if (!id) {
    throw new Error('Kayıt ID zorunludur.');
  }
  
  const sb = getSupabase();
  const { error } = await sb
    .from('ders_kayitlari')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// FİLTRELEME FONKSİYONLARI
// ============================================

/**
 * Ders kayıtlarını filtreleme ile getir
 * @param {Object} filtreler - { devre, kitap, ders_adi, talebe_uid, ders_gunu, kaydeden_personel_uid, ders_veren_personel_uid, ders_verme_durumu, ders_verme_tarihi }
 * @param {Object} options - { limit, offset, orderBy, ascending }
 * @returns {Promise<Array>}
 */
async function dersKayitlariGetir(filtreler = {}, options = {}) {
  const sb = getSupabase();
  let query = sb.from('ders_kayitlari').select('*');
  
  // Filtreleme
  if (filtreler.devre) {
    query = query.eq('devre', filtreler.devre);
  }
  if (filtreler.kitap) {
    query = query.eq('kitap', filtreler.kitap);
  }
  if (filtreler.ders_adi) {
    query = query.eq('ders_adi', filtreler.ders_adi);
  }
  if (filtreler.talebe_uid) {
    query = query.eq('talebe_uid', filtreler.talebe_uid);
  }
  if (filtreler.ders_gunu) {
    query = query.eq('ders_gunu', filtreler.ders_gunu);
  }
  if (filtreler.kaydeden_personel_uid) {
    query = query.eq('kaydeden_personel_uid', filtreler.kaydeden_personel_uid);
  }
  if (filtreler.ders_veren_personel_uid) {
    query = query.eq('ders_veren_personel_uid', filtreler.ders_veren_personel_uid);
  }
  if (filtreler.ders_verme_durumu !== undefined) {
    if (filtreler.ders_verme_durumu === null) {
      query = query.is('ders_verme_durumu', null);
    } else {
      query = query.eq('ders_verme_durumu', filtreler.ders_verme_durumu);
    }
  }
  if (filtreler.ders_verme_tarihi) {
    // Tarih aralığı için (gün bazlı)
    const tarihStr = String(filtreler.ders_verme_tarihi).slice(0, 10);
    query = query.gte('ders_verme_tarihi', tarihStr + 'T00:00:00Z')
                 .lt('ders_verme_tarihi', tarihStr + 'T23:59:59Z');
  }
  
  // Sıralama
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending !== false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  // Sayfalama
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

// ============================================
// RAPORLAMA FONKSİYONLARI
// ============================================

/**
 * Talebe bazlı ders raporu
 * @param {string} talebe_uid - Talebe UID
 * @param {string} devre - Devre (opsiyonel)
 * @returns {Promise<Object>}
 */
async function talebeDersRaporu(talebe_uid, devre = null) {
  const filtreler = { talebe_uid };
  if (devre) {
    filtreler.devre = devre;
  }
  
  const kayitlar = await dersKayitlariGetir(filtreler, { orderBy: 'ders_gunu', ascending: false });
  
  // Kitap bazlı gruplama
  const kitapGruplari = {};
  const istatistikler = {
    toplam: kayitlar.length,
    verdi: 0,
    veremedi: 0,
    yarim: 0,
    henuz_verilmedi: 0,
    islem_yapilmadi: 0
  };
  
  kayitlar.forEach(kayit => {
    const kitap = kayit.kitap;
    if (!kitapGruplari[kitap]) {
      kitapGruplari[kitap] = [];
    }
    kitapGruplari[kitap].push(kayit);
    
    // İstatistikler
    if (!kayit.ders_verme_durumu) {
      istatistikler.islem_yapilmadi++;
    } else if (kayit.ders_verme_durumu === 'verdi') {
      istatistikler.verdi++;
    } else if (kayit.ders_verme_durumu === 'veremedi') {
      istatistikler.veremedi++;
    } else if (kayit.ders_verme_durumu === 'yarim') {
      istatistikler.yarim++;
    } else if (kayit.ders_verme_durumu === 'henuz_verilmedi') {
      istatistikler.henuz_verilmedi++;
    }
  });
  
  return {
    talebe_uid,
    talebe_adi: kayitlar[0]?.talebe_adi || null,
    devre: devre || kayitlar[0]?.devre || null,
    kayitlar,
    kitapGruplari,
    istatistikler
  };
}

/**
 * Kitap bazlı analiz
 * @param {string} devre - Devre
 * @param {string} kitap - Kitap adı
 * @returns {Promise<Object>}
 */
async function kitapAnalizi(devre, kitap) {
  const kayitlar = await dersKayitlariGetir({ devre, kitap }, { orderBy: 'ders_adi', ascending: true });
  
  // Ders bazlı gruplama
  const dersGruplari = {};
  const istatistikler = {
    toplam_talebe: new Set(),
    toplam_ders: new Set(),
    verdi: 0,
    veremedi: 0,
    yarim: 0,
    henuz_verilmedi: 0,
    islem_yapilmadi: 0
  };
  
  kayitlar.forEach(kayit => {
    const ders = kayit.ders_adi;
    if (!dersGruplari[ders]) {
      dersGruplari[ders] = [];
    }
    dersGruplari[ders].push(kayit);
    
    // İstatistikler
    istatistikler.toplam_talebe.add(kayit.talebe_uid);
    istatistikler.toplam_ders.add(ders);
    
    if (!kayit.ders_verme_durumu) {
      istatistikler.islem_yapilmadi++;
    } else if (kayit.ders_verme_durumu === 'verdi') {
      istatistikler.verdi++;
    } else if (kayit.ders_verme_durumu === 'veremedi') {
      istatistikler.veremedi++;
    } else if (kayit.ders_verme_durumu === 'yarim') {
      istatistikler.yarim++;
    } else if (kayit.ders_verme_durumu === 'henuz_verilmedi') {
      istatistikler.henuz_verilmedi++;
    }
  });
  
  return {
    devre,
    kitap,
    kayitlar,
    dersGruplari,
    istatistikler: {
      ...istatistikler,
      toplam_talebe: istatistikler.toplam_talebe.size,
      toplam_ders: istatistikler.toplam_ders.size
    }
  };
}

/**
 * Tarih bazlı rapor (bugün kimler ders vermiş)
 * @param {string} tarih - Tarih (YYYY-MM-DD formatında veya Date objesi)
 * @returns {Promise<Array>}
 */
async function tarihBazliRapor(tarih) {
  let tarihStr;
  if (tarih instanceof Date) {
    tarihStr = tarih.toISOString().slice(0, 10);
  } else {
    tarihStr = String(tarih).slice(0, 10);
  }
  
  const kayitlar = await dersKayitlariGetir(
    { ders_verme_tarihi: tarihStr },
    { orderBy: 'ders_verme_tarihi', ascending: false }
  );
  
  return kayitlar;
}

/**
 * Personel bazlı rapor
 * @param {string} personel_uid - Personel UID
 * @param {string} tip - 'kaydeden' veya 'veren'
 * @returns {Promise<Object>}
 */
async function personelBazliRapor(personel_uid, tip = 'kaydeden') {
  const filtreler = {};
  if (tip === 'kaydeden') {
    filtreler.kaydeden_personel_uid = personel_uid;
  } else if (tip === 'veren') {
    filtreler.ders_veren_personel_uid = personel_uid;
  } else {
    throw new Error("Tip 'kaydeden' veya 'veren' olmalıdır.");
  }
  
  const kayitlar = await dersKayitlariGetir(filtreler, { orderBy: 'created_at', ascending: false });
  
  const istatistikler = {
    toplam: kayitlar.length,
    verdi: 0,
    veremedi: 0,
    yarim: 0,
    henuz_verilmedi: 0,
    islem_yapilmadi: 0
  };
  
  kayitlar.forEach(kayit => {
    if (!kayit.ders_verme_durumu) {
      istatistikler.islem_yapilmadi++;
    } else if (kayit.ders_verme_durumu === 'verdi') {
      istatistikler.verdi++;
    } else if (kayit.ders_verme_durumu === 'veremedi') {
      istatistikler.veremedi++;
    } else if (kayit.ders_verme_durumu === 'yarim') {
      istatistikler.yarim++;
    } else if (kayit.ders_verme_durumu === 'henuz_verilmedi') {
      istatistikler.henuz_verilmedi++;
    }
  });
  
  return {
    personel_uid,
    tip,
    kayitlar,
    istatistikler
  };
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Durum değerini normalize et
 * @param {string} durum - Ham durum değeri
 * @returns {string}
 */
function normalizeDurum(durum) {
  if (!durum) return null;
  const d = String(durum).trim().toLowerCase();
  const mapping = {
    'verdi': 'verdi',
    'veremedi': 'veremedi',
    'verilmedi': 'veremedi',
    'yarim': 'yarim',
    'yarım': 'yarim',
    'yarim kaldi': 'yarim',
    'yarım kaldı': 'yarim',
    'henuz_verilmedi': 'henuz_verilmedi',
    'henüz verilmedi': 'henuz_verilmedi',
    'none': null,
    'null': null
  };
  return mapping[d] || null;
}

// ============================================
// EXPORT (Global scope'a ekle)
// ============================================

// ============================================
// TALEBE YÖNETİMİ
// ============================================

/**
 * Belirli bir devre için talebeleri getir
 * @param {string} devre - Devre adı (örn: "6.Devre")
 * @param {Object} options - { orderBy, ascending }
 * @returns {Promise<Array>}
 */
async function talebelerGetir(devre, options = {}) {
  if (!devre) {
    throw new Error('Devre zorunludur.');
  }
  
  const sb = getSupabase();
  let query = sb
    .from('talebeler')
    .select('id, devre, talebe_adi')
    .eq('devre', devre);
  
  // Sıralama
  const orderBy = options.orderBy || 'talebe_adi';
  const ascending = options.ascending !== false; // Varsayılan: true
  
  query = query.order(orderBy, { ascending });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

// ============================================
// TAKRİR INDEX API FONKSİYONLARI
// ============================================

/**
 * Kitap ekle (takrir_index tablosuna)
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @returns {Promise<Object>}
 */
async function kitapEkle(devre, kitap) {
  if (!devre || !kitap) {
    throw new Error('Devre ve kitap adı zorunludur.');
  }
  
  const userProfile = await getCurrentUserProfile();
  const sb = getSupabase();
  
  const kayit = {
    devre: String(devre).trim(),
    kitap: String(kitap).trim(),
    ders_adi: null, // Kitap kaydı için NULL
    created_by: userProfile.adsoyad,
    created_by_uid: userProfile.uid
  };
  
  const { data, error } = await sb
    .from('takrir_index')
    .insert(kayit)
    .select()
    .single();
  
  if (error) {
    // UNIQUE constraint hatası ise, mevcut kaydı döndür
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('takrir_index')
        .select()
        .eq('devre', devre)
        .eq('kitap', kitap)
        .is('ders_adi', null)
        .single();
      
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
  
  return data;
}

/**
 * Ders ekle (takrir_index tablosuna)
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @param {string} ders_adi - Ders adı
 * @returns {Promise<Object>}
 */
async function dersEkle(devre, kitap, ders_adi) {
  if (!devre || !kitap || !ders_adi) {
    throw new Error('Devre, kitap ve ders adı zorunludur.');
  }
  
  const userProfile = await getCurrentUserProfile();
  const sb = getSupabase();
  
  const kayit = {
    devre: String(devre).trim(),
    kitap: String(kitap).trim(),
    ders_adi: String(ders_adi).trim(),
    created_by: userProfile.adsoyad,
    created_by_uid: userProfile.uid
  };
  
  const { data, error } = await sb
    .from('takrir_index')
    .insert(kayit)
    .select()
    .single();
  
  if (error) {
    // UNIQUE constraint hatası ise, mevcut kaydı döndür
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('takrir_index')
        .select()
        .eq('devre', devre)
        .eq('kitap', kitap)
        .eq('ders_adi', ders_adi)
        .single();
      
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
  
  return data;
}

/**
 * takrir_index'ten kitapları getir
 * @param {string} devre - Devre adı
 * @returns {Promise<Array>}
 */
async function takrirKitaplarGetir(devre) {
  if (!devre) {
    throw new Error('Devre zorunludur.');
  }
  
  const sb = getSupabase();
  const { data, error } = await sb
    .from('takrir_index')
    .select('kitap')
    .eq('devre', String(devre).trim())
    .is('ders_adi', null)
    .order('kitap', { ascending: true });
  
  if (error) throw error;
  
  // Kitap değerlerini normalize et (trim ve boş değerleri filtrele)
  const kitaplar = [...new Set((data || [])
    .map(k => k.kitap ? String(k.kitap).trim() : null)
    .filter(Boolean))];
  return kitaplar.sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * takrir_index'ten dersleri getir
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @returns {Promise<Array>}
 */
async function takrirDerslerGetir(devre, kitap) {
  if (!devre || !kitap) {
    throw new Error('Devre ve kitap zorunludur.');
  }
  
  const sb = getSupabase();
  const { data, error } = await sb
    .from('takrir_index')
    .select('ders_adi')
    .eq('devre', String(devre).trim())
    .eq('kitap', String(kitap).trim())
    .not('ders_adi', 'is', null)
    .order('ders_adi', { ascending: true });
  
  if (error) throw error;
  
  // Ders değerlerini normalize et (trim ve boş değerleri filtrele)
  const dersler = [...new Set((data || [])
    .map(d => d.ders_adi ? String(d.ders_adi).trim() : null)
    .filter(Boolean))];
  return dersler.sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * takrir_index'ten dersleri created_at ile birlikte getir
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @returns {Promise<Array<{ders_adi: string, created_at: string}>>}
 */
async function takrirDerslerGetirWithDate(devre, kitap) {
  if (!devre || !kitap) {
    throw new Error('Devre ve kitap zorunludur.');
  }
  
  const sb = getSupabase();
  const { data, error } = await sb
    .from('takrir_index')
    .select('ders_adi, created_at')
    .eq('devre', String(devre).trim())
    .eq('kitap', String(kitap).trim())
    .not('ders_adi', 'is', null)
    .order('ders_adi', { ascending: true });
  
  if (error) throw error;
  
  // Her ders için created_at'i ders_gunu olarak döndür
  const dersMap = new Map();
  (data || []).forEach(d => {
    const dersAdi = d.ders_adi ? String(d.ders_adi).trim() : null;
    if (dersAdi) {
      // Aynı ders adı için en eski created_at'i kullan (ilk kayıt)
      if (!dersMap.has(dersAdi) || (d.created_at && (!dersMap.get(dersAdi).created_at || d.created_at < dersMap.get(dersAdi).created_at))) {
        dersMap.set(dersAdi, {
          ders_adi: dersAdi,
          created_at: d.created_at
        });
      }
    }
  });
  
  const result = Array.from(dersMap.values());
  return result.sort((a, b) => a.ders_adi.localeCompare(b.ders_adi, 'tr'));
}

/**
 * Kitap adını güncelle (takrir_index ve ders_kayitlari tablolarında)
 * @param {string} devre - Devre adı
 * @param {string} eskiKitap - Eski kitap adı
 * @param {string} yeniKitap - Yeni kitap adı
 * @returns {Promise<Object>}
 */
async function kitapGuncelle(devre, eskiKitap, yeniKitap) {
  if (!devre || !eskiKitap || !yeniKitap) {
    throw new Error('Devre, eski kitap ve yeni kitap adı zorunludur.');
  }
  
  const sb = getSupabase();
  const normalizedDevre = String(devre).trim();
  const normalizedEskiKitap = String(eskiKitap).trim();
  const normalizedYeniKitap = String(yeniKitap).trim();
  
  if (normalizedEskiKitap === normalizedYeniKitap) {
    throw new Error('Yeni kitap adı eski adıyla aynı olamaz.');
  }
  
  // 1. takrir_index tablosunda güncelle (kitap kayıtları ve ders kayıtları)
  const { error: indexError } = await sb
    .from('takrir_index')
    .update({ kitap: normalizedYeniKitap })
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedEskiKitap);
  
  if (indexError) throw indexError;
  
  // 2. ders_kayitlari tablosunda güncelle
  const { error: kayitError } = await sb
    .from('ders_kayitlari')
    .update({ kitap: normalizedYeniKitap })
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedEskiKitap);
  
  if (kayitError) throw kayitError;
  
  return { success: true };
}

/**
 * Kitabı sil (takrir_index ve ders_kayitlari tablolarından)
 * @param {string} devre - Devre adı
 * @param {string} kitap - Silinecek kitap adı
 * @returns {Promise<Object>}
 */
async function kitapSil(devre, kitap) {
  if (!devre || !kitap) {
    throw new Error('Devre ve kitap adı zorunludur.');
  }
  
  const sb = getSupabase();
  const normalizedDevre = String(devre).trim();
  const normalizedKitap = String(kitap).trim();
  
  // 1. takrir_index tablosundan sil (kitap kaydı ve tüm ders kayıtları)
  const { error: indexError } = await sb
    .from('takrir_index')
    .delete()
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap);
  
  if (indexError) throw indexError;
  
  // 2. ders_kayitlari tablosundan sil (tüm kitap/ders kayıtları)
  const { error: kayitError } = await sb
    .from('ders_kayitlari')
    .delete()
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap);
  
  if (kayitError) throw kayitError;
  
  return { success: true };
}

/**
 * Ders adını güncelle (takrir_index ve ders_kayitlari tablolarında)
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @param {string} eskiDers - Eski ders adı
 * @param {string} yeniDers - Yeni ders adı
 * @returns {Promise<Object>}
 */
async function dersGuncelle(devre, kitap, eskiDers, yeniDers) {
  if (!devre || !kitap || !eskiDers || !yeniDers) {
    throw new Error('Devre, kitap, eski ders ve yeni ders adı zorunludur.');
  }
  
  const sb = getSupabase();
  const normalizedDevre = String(devre).trim();
  const normalizedKitap = String(kitap).trim();
  const normalizedEskiDers = String(eskiDers).trim();
  const normalizedYeniDers = String(yeniDers).trim();
  
  if (normalizedEskiDers === normalizedYeniDers) {
    throw new Error('Yeni ders adı eski adıyla aynı olamaz.');
  }
  
  // 1. takrir_index tablosunda güncelle
  const { error: indexError } = await sb
    .from('takrir_index')
    .update({ ders_adi: normalizedYeniDers })
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap)
    .eq('ders_adi', normalizedEskiDers);
  
  if (indexError) throw indexError;
  
  // 2. ders_kayitlari tablosunda güncelle
  const { error: kayitError } = await sb
    .from('ders_kayitlari')
    .update({ ders_adi: normalizedYeniDers })
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap)
    .eq('ders_adi', normalizedEskiDers);
  
  if (kayitError) throw kayitError;
  
  return { success: true };
}

/**
 * Dersi sil (takrir_index ve ders_kayitlari tablolarından)
 * @param {string} devre - Devre adı
 * @param {string} kitap - Kitap adı
 * @param {string} ders_adi - Silinecek ders adı
 * @returns {Promise<Object>}
 */
async function dersSil(devre, kitap, ders_adi) {
  if (!devre || !kitap || !ders_adi) {
    throw new Error('Devre, kitap ve ders adı zorunludur.');
  }
  
  const sb = getSupabase();
  const normalizedDevre = String(devre).trim();
  const normalizedKitap = String(kitap).trim();
  const normalizedDers = String(ders_adi).trim();
  
  // 1. takrir_index tablosundan sil
  const { error: indexError } = await sb
    .from('takrir_index')
    .delete()
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap)
    .eq('ders_adi', normalizedDers);
  
  if (indexError) throw indexError;
  
  // 2. ders_kayitlari tablosundan sil
  const { error: kayitError } = await sb
    .from('ders_kayitlari')
    .delete()
    .eq('devre', normalizedDevre)
    .eq('kitap', normalizedKitap)
    .eq('ders_adi', normalizedDers);
  
  if (kayitError) throw kayitError;
  
  return { success: true };
}

if (typeof window !== 'undefined') {
  window.dersTakipAPI = {
    dersKaydiOlustur,
    dersKaydiGuncelle,
    dersKaydiSil,
    dersKayitlariGetir,
    talebeDersRaporu,
    kitapAnalizi,
    tarihBazliRapor,
    personelBazliRapor,
    normalizeDurum,
    getCurrentUserProfile,
    talebelerGetir,
    // Takrir Index API
    kitapEkle,
    dersEkle,
    takrirKitaplarGetir,
    takrirDerslerGetir,
    takrirDerslerGetirWithDate,
    // Takrir Index Düzenleme API
    kitapGuncelle,
    kitapSil,
    dersGuncelle,
    dersSil
  };
}
