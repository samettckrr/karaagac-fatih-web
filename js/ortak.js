// =========================
// GİRİŞ - index.html (Supabase Versiyonu)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordBtn = document.getElementById("forgotPassword");

  // Supabase Client Kontrolü
  const getSupabase = () => window.supabase;

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const btn = loginForm.querySelector("button");
      
      if(btn) { btn.disabled = true; btn.textContent = "Giriş Yapılıyor..."; }

      try {
        const sb = getSupabase();
        if(!sb) throw new Error("Supabase bağlantısı kurulamadı.");

        const { data, error } = await sb.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // Başarılı giriş
        window.location.href = "panel.html";

      } catch (error) {
        alert("Giriş Hatası: " + (error.message || error));
        if(btn) { btn.disabled = false; btn.textContent = "Giriş Yap"; }
      }
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value.trim();
      if (!email) return alert("Lütfen önce e-posta adresinizi girin.");

      try {
        const sb = getSupabase();
        if(!sb) throw new Error("Supabase bağlantısı kurulamadı.");

        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/sifre-yenile.html',
        });

        if (error) throw error;
        alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");

      } catch (error) {
        alert("Hata: " + error.message);
      }
    });
  }
});


// =========================
// PANEL - panel.html (Supabase Versiyonu)
// =========================

async function baslatPanel() {
  const sb = window.supabase;
  if (!sb) { console.error("Supabase bulunamadı"); return; }

  // Oturum Kontrolü - Optimize retry mekanizması ile
  const { data: { session }, error: sessionError } = await getSessionWithRetry();
  
  if (sessionError || !session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;

  try {
    // Firestore yerine Supabase Tablosu
    const { data: veri, error } = await sb
      .from('kullanicilar')
      .select('yetkiler, adsoyad, rol')
      .eq('id', user.id)
      .single();

    if (error || !veri) {
      console.error("Veri çekme hatası:", error);
      alert("Kullanıcı yetkileri alınamadı.");
      logout();
      return;
    }

    const yetkiler = veri.yetkiler || [];

    // Panel ID Eşleşmesi
    const panelIdMap = {
      "Talebe": "yanTalebe",
      "Personel": "yanPersonel",
      "Nehari": "yanNehari",
      "Kermes": "yanKermes",
      "Diğer": "yanAyarlar",
      "Kontrol Paneli": "yanAdmin",
      "Muhasebe": "yanMuhasebe",
    };

    // Hepsini gizle
    Object.values(panelIdMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // Yetkisi olanları aç
    yetkiler.forEach(yetki => {
      const el = document.getElementById(panelIdMap[yetki]);
      if (el) el.style.display = "block";
    });

    // Paneli görünür yap
    const yanPanel = document.getElementById("yanPanel");
    if (yanPanel) yanPanel.style.visibility = "visible";

  } catch (err) {
    console.error("Panel başlatma hatası:", err);
    logout();
  }
}

async function logout() {
  const sb = window.supabase;
  if(sb) await sb.auth.signOut();
  window.location.href = "index.html";
}

function goTo(sayfa) {
  window.location.href = sayfa;
}

function menuToggle(event) {
  event.stopPropagation();
  const yanPanel = document.getElementById("yanPanel");
  yanPanel.classList.toggle("acik");

  if (yanPanel.classList.contains("acik")) {
    document.addEventListener("click", closeMenuOnOutsideClick);
  } else {
    document.removeEventListener("click", closeMenuOnOutsideClick);
  }
}

function closeMenuOnOutsideClick(e) {
  const yanPanel = document.getElementById("yanPanel");
  const menuIcon = document.querySelector(".menu-icon");

  if (!yanPanel.contains(e.target) && !menuIcon.contains(e.target)) {
    yanPanel.classList.remove("acik");
    document.removeEventListener("click", closeMenuOnOutsideClick);
  }
}

function paneliYukle(panelAdi) {
  const kartAlani = document.getElementById("kartAlani");
  if (!kartAlani) return;

  kartAlani.innerHTML = "";

  let kartlar = [];

  if (panelAdi === "talebe") {
    kartlar = [
      { baslik: "Kayıt Et", ikon: "", link: "parcalar/talebe-kayit.html"},
      { baslik: "Talebe Bilgi", ikon: "📋", link: "talebe/talebe-bilgi-formu.html" },
      { baslik: "Talebe Listesi", ikon: "", link: "calisma-karti.html"},
      { baslik: "Takrir Durumu", ikon: "📗", link: "talebe/ezber-takibi.html" },
      { baslik: "İzin Dönüş Takibi", ikon: "🛫", link: "talebe/izin-takibi.html" },
      { baslik: "Aidat ve Kitap Ücretleri", ikon: "📥", link: "talebe/aidat-kitap.html" },
    ];
  } else if (panelAdi === "personel") { 
    kartlar = [
      { baslik: "Nöbet Çizelgesi", ikon: "📅", link: "personel/nobet.html" },
      { baslik: "Personel Aylık Performans", ikon: "📊", link: "personel/aylik-performans.html" },
      { baslik: "Hedefler", ikon: "🎯", link: "personel/hedef-grafik.html" },
      { baslik: "Alacak Takibi", ikon: "💰", link: "personel/rapor-personel.html" },
      { baslik: "Temizlik Kontrolü", ikon: "🧹", link: "personel/temizlik/temizlik-kontrolu.html" },
    ];
  } else if (panelAdi === "nehari") {
    kartlar = [
      { baslik: "Talebe Listesi", ikon: "📋", link: "calisma-karti.html" },
      { baslik: "Diğer", ikon: "📗", link: "calisma-karti.html" },
      { baslik: "Diğer", ikon: "📗", link: "calisma-karti.html"},
    ];
  } else if (panelAdi === "kermes") {
    kartlar = [
      { baslik: "Kermes" , ikon: "🍽️ 🍢", link: "kermes/kermes.html"},
      { baslik: "Menü Yönetim Paneli" , ikon: "📋" , link: "kermes/menu.html"}, 
    ];  
  } else if (panelAdi === "ayarlar") {
    kartlar = [
      { baslik: "Kullanıcı Yönetimi", ikon: "🛠️", link: "diger/kullanici-yonetimi.html" },
      { baslik: "Sistem Ayarları", ikon: "⚙️", link: "diger/sistem-ayarlari.html" },
    ];
  } else if (panelAdi === "muhasebe") {
    kartlar = [
      { baslik: "Aylık Personel Ödemeleri" , ikon: "👥", link:"muhasebe/aylik-personel-odemeleri.html"},
      { baslik: "Alacak Tahsilatı" , ikon: "📝", link:"personel/alacak-takibi.html"},
      { baslik: "Hedef ve Veri Girişi" , ikon: "📝", link: "muhasebe/muhasebe-form.html"},
      { baslik: "Aidat-Kitap Veri Girişi" , ikon: "📝", link: "muhasebe/aidat-kitap-giris.html"},
      { baslik: "Kermes Raporu" , ikon: "🍽️", link: "calisma-karti.html"},
      { baslik: "Aylık Giderler" , ikon: "", link: "calisma-karti.html"},
      { baslik: "İçeriği Daha Sonra Paylaşılacaktır", ikon: "📑", link: "muhasebe/genel-muhasebe.html" },
    ];  
  } else if (panelAdi === "admin") {
    kartlar = [
      { baslik: "Kullanıcı Ekle" , ikon: "", link: "admin/kullanici-ekle.html"},
      { baslik: "Kullanıcılar" , ikon: "👥", link: "admin/kullanici-listesi.html"},
      { baslik: "Giriş Kayıtları" , ikon: "🧾", link: "admin/giris-kayitlari.html"},
      { baslik: "Erişim Talepleri", ikon: "🔐", link: "admin/erisimler.html"},
      { baslik: "Bildirim/Görev Sistemi", ikon: "🔔", link: "admin/bildirim-gorev.html"},
    ];
  }

  kartlar.forEach(kart => {
    const kartDiv = document.createElement("div");
    kartDiv.className = "panel-kart";
    kartDiv.onclick = () => goTo(kart.link);
    kartDiv.innerHTML = `
      <div class="ikon">${kart.ikon}</div>
      <div class="baslik">${kart.baslik}</div>
    `;
    kartAlani.appendChild(kartDiv);
  });
}


// =========================
// talebe-liste.html - sabit işlemler
// =========================

function icerikYukle(icerik) {
  const yanPanel = document.querySelector('.yan-panel');
  yanPanel.classList.remove('acik');

  const icerikPaneli = document.getElementById('icerik-paneli');

  if (icerik === 'liste') {
    // Talebe listesi
    fetch("parcalar/talebe-liste-tablosu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-liste.js";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'kayit') {
    // Talebe kayıt formu (1. adım)
    fetch("parcalar/talebe-kayit.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-kayit-adim1.js";
        script.type = "module";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'bilgi') {
    // Bilgi formu
    fetch("talebe/talebe-bilgi-formu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-bilgi.js";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'okul') {
    // Okul bilgileri
    fetch("parcalar/talebe-okul.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-okul.js";
        document.body.appendChild(script);
      });
  }

  else {
    icerikPaneli.innerHTML = `<p>İçerik yüklenemedi.</p>`;
  }
}


function sayfayiYenile() {
  location.reload();
}

// =========================
// ORTAK APP SHELL - Tüm sayfalarda kullanılacak
// =========================

/* === GLOBAL DEĞİŞKENLER === */
// Global scope'ta erişilebilir olmalı (sayfalar için)
if (!window.CURRENT_ALLOW) {
  window.CURRENT_ALLOW = new Set();
}
if (!window.CURRENT_DENY) {
  window.CURRENT_DENY = new Set();
}
// Mevcut değişkenleri kullan, yoksa window'dan al
let CURRENT_ALLOW = window.CURRENT_ALLOW;
let CURRENT_DENY = window.CURRENT_DENY;
// db ve auth artık Supabase kullanıyor
// window.supabase Supabase client'ı içerir
// window.getSupabaseAuth() auth wrapper'ı döndürür
// Eski Firebase kodları kaldırıldı - artık Supabase kullanılıyor

/* === YARDIMCI FONKSİYONLAR === */
// norm fonksiyonu window'da tanımlı olmalı (diğer sayfalar için)
if(typeof window.norm === 'undefined'){
  window.norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
// Referans al (local scope'ta)
const norm = window.norm;

// XSS koruması - HTML escape
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// URL validation ve normalization
function normalizeUrl(u) {
  if (!u || u === '#') return '#';
  // Güvenlik: Sadece güvenli protokoller
  if (/^https?:\/\//i.test(u)) {
    // External URL kontrolü - sadece güvenli domain'lere izin ver
    try {
      const url = new URL(u);
      // Localhost ve güvenli domain'ler için kontrol
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith(window.location.hostname)) {
        return u;
      }
      // External URL'ler için güvenlik uyarısı
      console.warn('External URL detected:', u);
      return '#';
    } catch (e) {
      return '#';
    }
  }
  if (u.startsWith('//')) return '#';
  // Zaten relative path ise olduğu gibi döndür (../ veya ./ ile başlıyorsa)
  if (u.startsWith('../') || u.startsWith('./')) {
    return u;
  }
  // Absolute path ise (/) başında / varsa
  if (u.startsWith('/')) {
    return u;
  }
  // Relative path için current directory'den hesapla
  const currentPath = location.pathname;
  const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
  const currentDepth = currentDir.split('/').filter(x => x).length;
  const upLevels = currentDepth > 0 ? '../'.repeat(currentDepth) : '';
  return upLevels + u;
}
// Global olarak erişilebilir yap
window.normalizeUrl = normalizeUrl;

/* === SESSION YÖNETİMİ - ÇOKLU SAYFA ÇAKIŞMASI ÖNLEME === */
/**
 * Akıllı Session Alma - Optimize edilmiş retry mekanizması
 * - Tek sayfa açıkken: İlk deneme hemen (0ms) → Hızlı ✅
 * - Çoklu sayfa açıkken: AbortError alırsa retry → Güvenli ✅
 * 
 * @param {number} retries - Maksimum retry sayısı (varsayılan: 3)
 * @param {number} delay - İlk retry için gecikme ms (varsayılan: 100ms)
 * @returns {Promise<{data: {session: any}, error: any}>}
 */
async function getSessionWithRetry(retries = 3, delay = 100) {
  const sb = window.supabase;
  if (!sb || !sb.auth) {
    throw new Error('Supabase client bulunamadı');
  }

  for (let i = 0; i < retries; i++) {
    try {
      // İlk deneme hemen (0ms), sonrakiler delay ile
      if (i > 0) {
        // Exponential backoff: 100ms, 200ms, 400ms...
        const waitTime = delay * Math.pow(2, i - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const { data, error } = await sb.auth.getSession();
      
      // AbortError değilse direkt döndür (başarılı veya başka bir hata)
      if (!error || (error.name !== 'AbortError' && !error.message?.includes('aborted'))) {
        return { data, error };
      }
      
      // AbortError ise ve son deneme değilse retry yap
      if (i < retries - 1) {
        console.warn(`Session çakışması algılandı, tekrar deneniyor... (${i + 1}/${retries})`);
      }
      
    } catch (err) {
      // AbortError değilse direkt hata döndür (gereksiz retry yapma)
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        return { data: null, error: err };
      }
      
      // AbortError ise retry yap (son deneme değilse)
      if (i < retries - 1) {
        console.warn(`Session çakışması algılandı, tekrar deneniyor... (${i + 1}/${retries})`);
        // Delay zaten loop başında yapılıyor
      } else {
        // Son deneme de başarısız
        return { data: null, error: err };
      }
    }
  }
  
  return { data: null, error: new Error('Session alma işlemi başarısız oldu (çoklu sayfa çakışması)') };
}
// Global olarak erişilebilir yap (diğer sayfalar için)
window.getSessionWithRetry = getSessionWithRetry;

/* === TOAST BİLDİRİM SİSTEMİ === */
function showToast(type, title, message) {
  const cont = document.getElementById('toastContainer');
  if (!cont) {
    console.warn('toastContainer bulunamadı');
    return;
  }
  // Güvenlik: Input validation
  const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
  const safeTitle = escapeHtml(String(title || ''));
  const safeMessage = escapeHtml(String(message || ''));
  
  const div = document.createElement('div');
  div.className = `toast ${safeType}`;
  
  // Güvenli DOM oluşturma (innerHTML yerine)
  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = safeType === 'success' ? '✅' : safeType === 'error' ? '⚠️' : safeType === 'warning' ? '⚠️' : 'ℹ️';
  
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = safeTitle;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = safeMessage;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Kapat');
  
  content.appendChild(titleEl);
  content.appendChild(messageEl);
  div.appendChild(icon);
  div.appendChild(content);
  div.appendChild(closeBtn);
  
  cont.appendChild(div);
  requestAnimationFrame(() => div.classList.add('show'));
  const close = () => { 
    div.classList.remove('show'); 
    setTimeout(() => div.remove(), 200); 
  };
  closeBtn.addEventListener('click', close);
  setTimeout(close, 4000);
}
// Global olarak erişilebilir yap
window.showToast = showToast;

/* === BİLDİRİM YÜKLEME (SUPABASE) === */
async function loadNotifications() {
  const badge = document.getElementById('notifBadge');
  const list = document.getElementById('notifList');
  if (!badge || !list) return;

  const sb = window.supabase;
  if (!sb) {
    console.warn('Supabase client yüklenmedi, bildirimler yüklenemiyor');
    if (badge) badge.style.display = 'none';
    if (list) list.innerHTML = '';
    return;
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    if (badge) badge.style.display = 'none';
    if (list) list.innerHTML = '';
    return;
  }

  try {
    // Supabase'den bildirimleri çek
    // Not: kullanici_bildirimleri tablosunda kullanici_uid sütunu text tipinde
    const { data: bildirimler, error } = await sb
      .from('kullanici_bildirimleri') 
      .select('*')
      .eq('kullanici_uid', user.id) // Kullanıcıya özel
      .order('zaman', { ascending: false }) // Zaman sıralaması
      .limit(50);

    if (error) throw error;

    // Okunmamış Sayısı (okundu_mu sütunu boolean)
    const okunmamisSayisi = (bildirimler || []).filter(b => !b.okundu_mu).length;

    if (okunmamisSayisi > 0) {
      badge.style.display = 'block';
      badge.textContent = okunmamisSayisi > 99 ? '99+' : String(okunmamisSayisi);
    } else {
      badge.style.display = 'none';
    }

    // Listeyi Temizle
    list.innerHTML = '';

    if (!bildirimler || bildirimler.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.style.padding = '6px 8px';
      empty.textContent = 'Yeni bildirim yok.';
      list.appendChild(empty);
    } else {
      // Sadece ilk 5'i göster
      bildirimler.slice(0, 5).forEach(d => {
        const baslik = d.baslik || 'Bildirim';
        const icerik = d.icerik || '';
        const okunduMu = d.okundu_mu || false;
        const tip = d.tip || 'toplu';
        // Supabase tarih formatını işle
        const zaman = d.zaman ? new Date(d.zaman) : new Date(); 
        const zamanStr = zaman.toLocaleString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const row = document.createElement('div');
        row.style.cssText = 'display: block; padding: 10px 12px; text-decoration: none; border-bottom: 1px solid var(--stroke); transition: background 0.15s; cursor: pointer;';
        if (!okunduMu) {
          row.style.background = 'rgba(59,130,246,.05)';
          row.style.fontWeight = '600';
        }

        const strong = document.createElement('strong');
        strong.textContent = escapeHtml(baslik);
        strong.style.cssText = 'display: block; color: var(--text); margin-bottom: 4px;';

        const muted = document.createElement('div');
        muted.className = 'muted';
        muted.style.cssText = 'font-size: 12px; color: var(--muted); line-height: 1.4;';
        muted.textContent = escapeHtml(icerik.length > 60 ? icerik.substring(0, 60) + '...' : icerik);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'muted';
        timeDiv.style.cssText = 'font-size: 11px; margin-top: 4px; color: var(--muted);';
        timeDiv.textContent = zamanStr;

        row.appendChild(strong);
        row.appendChild(muted);
        row.appendChild(timeDiv);

        // Okunmamışsa işaret ekle
        if (!okunduMu) {
          const dot = document.createElement('span');
          dot.style.cssText = 'display: inline-block; width: 8px; height: 8px; background: var(--brand); border-radius: 50%; margin-right: 6px;';
          strong.insertBefore(dot, strong.firstChild);
        }

        row.onmouseenter = () => row.style.background = 'var(--surface)';
        row.onmouseleave = () => row.style.background = okunduMu ? 'transparent' : 'rgba(59,130,246,.05)';

        // Tıklanınca modal aç
        row.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showBildirimModal(d.id, baslik, icerik, okunduMu, tip, zamanStr);
        };

        list.appendChild(row);
      });
    }

    // "Tüm bildirimleri gör →" linkini kaldır (dropdown içinde)
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) {
      const tumLinkler = notifDropdown.querySelectorAll('a');
      tumLinkler.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent || '';
        if (href.includes('bildirim.html') || text.includes('Tüm bildirimleri gör')) {
          link.remove();
        }
      });
    }

    // NOT: Real-time listener şimdilik kaldırıldı
    // Supabase Realtime için channel yapısı kurulması gerekir
    // Önce sistemin temelini çalıştıralım, sonra real-time eklenebilir

  } catch (e) {
    console.error('Bildirimler yüklenemedi:', e);
    if (badge) badge.style.display = 'none';
    if (list) {
      const err = document.createElement('div');
      err.className = 'muted';
      err.style.padding = '6px 8px';
      err.textContent = 'Bildirimler yüklenemedi.';
      list.appendChild(err);
    }
  }
}

/* === BİLDİRİM MODAL === */
async function showBildirimModal(bildirimId, baslik, icerik, okunduMu, tip, zamanStr) {
    // Supabase kullanıcı bilgisi
    const supabase = window.supabase;
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

  // Modal container'ı kontrol et, yoksa oluştur
  let modalContainer = document.getElementById('bildirimModalContainer');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'bildirimModalContainer';
    modalContainer.className = 'modal';
    modalContainer.style.cssText = 'display: none; position: fixed; inset: 0; z-index: 10000; background: rgba(15,23,42,.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); justify-content: center; align-items: center; padding: 14px; pointer-events: auto;';
    document.body.appendChild(modalContainer);
  }

  // Modal içeriği
  const tipRenk = tip === 'toplu' ? 'rgba(59,130,246,.1)' : 'rgba(16,185,129,.1)';
  const tipTextRenk = tip === 'toplu' ? '#0ea5e9' : '#33c27f';
  
  modalContainer.innerHTML = `
    <div class="sheet" style="max-width: 500px; width: 100%; background: var(--card); border-radius: 16px; border: 1px solid var(--stroke); box-shadow: 0 18px 40px rgba(15,23,42,.15); transform: scale(0.95); opacity: 0; transition: all 0.2s ease; pointer-events: auto;">
      <header style="padding: 16px 20px; border-bottom: 1px solid var(--stroke); display: flex; align-items: center; justify-content: space-between; background: var(--card);">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text);">${escapeHtml(baslik)}</h3>
        <button type="button" id="bildirimModalKapat" style="background: transparent; border: none; color: var(--muted); font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s; line-height: 1;">×</button>
      </header>
      <div class="body" style="padding: 20px;">
        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background: ${tipRenk}; color: ${tipTextRenk}; font-size: 11px; font-weight: 600;">
            ${tip === 'toplu' ? '📤 Toplu Bildirim' : '✉️ Kişisel Bildirim'}
          </span>
        </div>
        <div style="font-size: 14px; color: var(--ink); line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px; word-wrap: break-word;">${escapeHtml(icerik)}</div>
        <div style="font-size: 12px; color: var(--muted); padding-top: 12px; border-top: 1px solid var(--stroke);">
          <div style="margin-bottom: 4px;"><strong>Zaman:</strong> ${escapeHtml(zamanStr)}</div>
          <div><strong>Durum:</strong> ${okunduMu ? '✅ Okundu' : '🔴 Okunmadı'}</div>
        </div>
      </div>
      <footer style="padding: 16px 20px; border-top: 1px solid var(--stroke); display: flex; gap: 8px; justify-content: flex-end; background: var(--card);">
        <button type="button" class="btn btn-ghost" id="bildirimModalKapatBtn" style="padding: 8px 16px;">Kapat</button>
        ${!okunduMu ? '<button type="button" class="btn btn-primary" id="bildirimOkunduBtn" style="padding: 8px 16px;">Okundu İşaretle</button>' : ''}
      </footer>
    </div>
  `;

  // Sheet içine tıklanınca event propagation'ı durdur
  const sheet = modalContainer.querySelector('.sheet');
  if (sheet) {
    sheet.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Kapat fonksiyonu
  const kapatModal = () => {
    const sheetEl = modalContainer.querySelector('.sheet');
    if (sheetEl) {
      sheetEl.style.transform = 'scale(0.95)';
      sheetEl.style.opacity = '0';
    }
    setTimeout(() => {
      modalContainer.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  };

  // Backdrop'a tıklanınca kapat
  modalContainer.onclick = (e) => {
    if (e.target === modalContainer) {
      kapatModal();
    }
  };

  // ESC tuşu ile kapat
  const escHandler = (e) => {
    if (e.key === 'Escape' && modalContainer.style.display === 'flex') {
      kapatModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Kapat butonları
  const kapatBtn = document.getElementById('bildirimModalKapat');
  const kapatBtn2 = document.getElementById('bildirimModalKapatBtn');
  const okunduBtn = document.getElementById('bildirimOkunduBtn');

  if (kapatBtn) {
    kapatBtn.onclick = (e) => {
      e.stopPropagation();
      kapatModal();
    };
    kapatBtn.onmouseenter = () => kapatBtn.style.background = 'var(--surface)';
    kapatBtn.onmouseleave = () => kapatBtn.style.background = 'transparent';
  }

  if (kapatBtn2) {
    kapatBtn2.onclick = (e) => {
      e.stopPropagation();
      kapatModal();
    };
  }

  // Okundu işaretle
  if (okunduBtn && !okunduMu) {
    okunduBtn.onclick = async (e) => {
      e.stopPropagation();
      try {
        const sb = window.supabase;
        if (!sb) throw new Error('Supabase client yüklenmedi');

        // Supabase'de bildirimi okundu olarak işaretle
        const { error: updateError } = await sb
          .from('kullanici_bildirimleri')
          .update({ 
            okundu_mu: true,
            okunma_zamani: new Date().toISOString()
          })
          .eq('id', bildirimId);

        if (updateError) throw updateError;

        // Bildirimleri yeniden yükle
        await loadNotifications();

        // Toast göster
        if (typeof showToast === 'function') {
          showToast('success', 'Başarılı', 'Bildirim okundu olarak işaretlendi.');
        }

        kapatModal();
      } catch (error) {
        console.error('Bildirim okundu işaretleme hatası:', error);
        if (typeof showToast === 'function') {
          showToast('error', 'Hata', 'Bildirim işaretlenemedi.');
        }
      }
    };
  }

  // Body scroll'u engelle
  document.body.style.overflow = 'hidden';

  // Modal'ı göster
  modalContainer.style.display = 'flex';
  requestAnimationFrame(() => {
    const sheetEl = modalContainer.querySelector('.sheet');
    if (sheetEl) {
      sheetEl.style.transform = 'scale(1)';
      sheetEl.style.opacity = '1';
    }
  });
}
// Global olarak erişilebilir yap
window.showBildirimModal = showBildirimModal;

/* === SAYFA MANİFESTİ YÜKLEME (SUPABASE) === */
async function fetchPanels(allowSet, denySet) {
  const res = [];
  try {
    if (!window.supabase) throw new Error("Supabase client yok");

    // Supabase'den sayfa manifestini çek
    const { data: snap, error } = await window.supabase
      .from('sayfa_manifesti')
      .select('*')
      .order('order', { ascending: true, nullsFirst: false }); // Sıralama eklendi

    if (error) throw error;

    (snap || []).forEach(d => {
      const id = d.id; // Supabase'de id sütunu vardır
      const panelTitle = d.title || id;
      
      // Sistem Ayarları filtresi (Aynen korundu)
      const panelTitleNorm = window.norm(panelTitle);
      const idNorm = window.norm(id);
      const excludedPanels = ['sistem ayarları', 'ayarlar', 'diğer', 'sistemayarları', 'sistem-ayarlari'];
      if (excludedPanels.includes(panelTitleNorm) || excludedPanels.includes(idNorm) ||
          (panelTitleNorm.includes('sistem') && panelTitleNorm.includes('ayar'))) {
        return; 
      }
      
      const panelGrant = allowSet.has(window.norm(id)) || allowSet.has(window.norm(panelTitle));
      let pages = Array.isArray(d.pages) ? d.pages : []; // JSONB sütunu array döner
      
      pages = pages.filter(pg => {
        const keyNorm = window.norm(pg.key || pg.title || '');
        const pageGrant = allowSet.has(keyNorm), denied = denySet.has(keyNorm);
        return !denied && (panelGrant || pageGrant);
      }).map(pg => ({
        baslik: pg.title || pg.key || 'Sayfa',
        url: normalizeUrl(pg.path || '#'),
        key: pg.key || pg.title || '',
        sira: typeof pg.order === 'number' ? pg.order : 9999
      })).sort((a, b) => a.sira - b.sira);

      if (pages.length) res.push({ id, baslik: panelTitle, sira: typeof d.order === 'number' ? d.order : 9999, pages });
    });
    
    res.sort((a, b) => a.sira - b.sira);
  } catch (e) { 
    console.error('Manifest yüklenemedi:', e); 
  }
  return res;
}
// Global olarak erişilebilir yap
window.fetchPanels = fetchPanels;

/* === NAVİGASYON RENDER === */
function renderNav(panels) {
  const ul = document.getElementById('navMain'), drawer = document.getElementById('drawer');
  if (!ul || !drawer) return;
  ul.innerHTML = ''; 
  drawer.innerHTML = '';
  if (!panels.length) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const btn = document.createElement('div');
    btn.className = 'nav-btn';
    btn.textContent = 'Menü yok';
    li.appendChild(btn);
    ul.appendChild(li);
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'muted';
    emptyMsg.style.padding = '8px';
    emptyMsg.textContent = 'Menü bulunamadı';
    drawer.appendChild(emptyMsg);
    return;
  }
  panels.forEach(p => {
    const li = document.createElement('li'); 
    li.className = 'nav-item';
    // Güvenli DOM oluşturma - innerHTML yerine
    const btn = document.createElement('div');
    btn.className = 'nav-btn';
    btn.textContent = escapeHtml(p.baslik || 'Panel');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▾';
    btn.appendChild(caret);
    li.appendChild(btn);
    
    const dd = document.createElement('div'); 
    dd.className = 'dropdown';
    
    // Sayfa yoksa dropdown oluşturma
    if (!p.pages || p.pages.length === 0) {
      // Sayfa yoksa sadece buton göster, dropdown yok
      btn.style.cursor = 'default';
    } else {
      (p.pages || []).forEach(pg => {
        const a = document.createElement('a');
        a.href = normalizeUrl(pg.url || pg.path || '#'); 
        a.textContent = escapeHtml(pg.baslik || 'Sayfa');
        a.dataset.key = escapeHtml(pg.key || pg.baslik || ''); 
        a.dataset.panel = escapeHtml(p.id || ''); 
        a.dataset.panelTitle = escapeHtml(p.baslik || '');
        dd.appendChild(a);
      });
      li.appendChild(dd);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Diğer tüm dropdown'ları kapat
        ul.querySelectorAll('.nav-item').forEach(x => { 
          if (x !== li) x.classList.remove('open'); 
        });
        // Bu dropdown'u aç/kapat
        li.classList.toggle('open');
      });
    }
    ul.appendChild(li);

    const h = document.createElement('div'); 
    h.className = 'panel-title'; 
    h.textContent = escapeHtml(p.baslik || 'Panel'); 
    drawer.appendChild(h);
    (p.pages || []).forEach(pg => {
      const a = document.createElement('a');
      a.href = normalizeUrl(pg.url || pg.path || '#'); 
      a.textContent = escapeHtml(pg.baslik || 'Sayfa');
      a.dataset.key = escapeHtml(pg.key || pg.baslik || ''); 
      a.dataset.panel = escapeHtml(p.id || ''); 
      a.dataset.panelTitle = escapeHtml(p.baslik || '');
      drawer.appendChild(a);
    });
  });
  
  // Dropdown dışına tıklanınca kapat (ama link tıklamalarına izin ver)
  document.addEventListener('click', (e) => {
    // Eğer tıklanan element bir dropdown linki ise, dropdown'u kapatma
    if (e.target.closest('.dropdown a')) {
      // Link tıklaması - dropdown'u kapat ama linkin çalışmasına izin ver
      setTimeout(() => {
        ul.querySelectorAll('.nav-item').forEach(x => x.classList.remove('open'));
      }, 100);
      return;
    }
    // Dropdown dışına tıklanırsa kapat
    if (!ul.contains(e.target) && !e.target.closest('.dropdown')) {
      ul.querySelectorAll('.nav-item').forEach(x => x.classList.remove('open'));
    }
  });
}
// Global olarak erişilebilir yap
window.renderNav = renderNav;

/* === DROPDOWN & DRAWER DAVRANIŞLARI === */
function initAppShell() {
  // Hamburger & Drawer
  const hamb = document.getElementById('hamburger'), drawer = document.getElementById('drawer');
  if (hamb && drawer) {
    hamb.addEventListener('click', () => drawer.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !hamb.contains(e.target)) drawer.classList.remove('open');
    });
  }

  // Bildirim & Profil Dropdown
  const notifBtn = document.getElementById('btnNotif');
  const notifDD = document.getElementById('notifDropdown');
  const profBtn = document.getElementById('btnProfile');
  const profDD = document.getElementById('profDropdown');
  
  // "Tüm bildirimleri gör →" linkini kaldır
  if (notifDD) {
    const tumLinkler = notifDD.querySelectorAll('a');
    tumLinkler.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      if (href.includes('bildirim.html') || text.includes('Tüm bildirimleri gör')) {
        link.remove();
      }
    });
  }
  
  function closeAll(e) {
    if (notifDD && !notifDD.contains(e.target) && e.target !== notifBtn) {
      notifDD.parentElement.classList.remove('open');
    }
    if (profDD && !profDD.contains(e.target) && e.target !== profBtn) {
      profDD.parentElement.classList.remove('open');
    }
  }
  document.addEventListener('click', closeAll);
  
  if (notifBtn && notifDD) {
    notifBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      notifDD.parentElement.classList.toggle('open'); 
      if (profDD) profDD.parentElement.classList.remove('open'); 
    });
  }
  
  if (profBtn && profDD) {
    profBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      profDD.parentElement.classList.toggle('open'); 
      if (notifDD) notifDD.parentElement.classList.remove('open'); 
    });
  }
  
  // Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // window.auth wrapper'ını kullan veya direkt Supabase
        const auth = window.auth || (window.getSupabaseAuth && window.getSupabaseAuth());
        if (auth && typeof auth.signOut === 'function') {
          await auth.signOut();
        } else {
          // Direkt Supabase kullan
          const sb = window.supabase;
          if (sb) await sb.auth.signOut();
        }
        // Path'i normalize et
        const indexPath = normalizeUrl('index.html');
        location.assign(indexPath); 
      } catch (err) { 
        console.error('Çıkış hatası:', err); 
        showToast('error', 'Hata', 'Çıkış yapılamadı.');
      }
    });
  }

  // Link guard - yetki kontrolü
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-key]');
    if (!a) return;
    const key = window.norm(a.dataset.key || '');
    const pnl = window.norm(a.dataset.panel || '');
    const pnlTitle = window.norm(a.dataset.panelTitle || '');
    
    // Eğer key boşsa veya sadece panel yetkisi varsa izin ver
    if (!key && (pnl || pnlTitle)) {
      // Panel yetkisi varsa izin ver
      if (CURRENT_ALLOW.has(pnl) || CURRENT_ALLOW.has(pnlTitle)) {
        return; // İzin ver, normal link davranışı
      }
    }
    
    // Deny kontrolü
    if (key && CURRENT_DENY.has(key)) { 
      e.preventDefault(); 
      showToast('warning', 'Yetki Yok', 'Bu sayfa için yetkiniz yok.');
      return; 
    }
    
    // Allow kontrolü
    const allowed = !key || CURRENT_ALLOW.has(key) || CURRENT_ALLOW.has(pnl) || CURRENT_ALLOW.has(pnlTitle);
    if (!allowed) { 
      e.preventDefault(); 
      showToast('warning', 'Yetki Yok', 'Bu sayfa için yetkiniz yok.');
    }
  });
}

/* === AUTH + INIT === */
function initAppShellAuth() {
  // index.html sayfasında initAppShellAuth çalışmasın (login sayfası, app shell değil)
  const currentPath = window.location.pathname;
  const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
  if (isIndexPage) {
    // index.html'de kendi session kontrolü var, burada bir şey yapma
    return;
  }
  
  // window.auth wrapper'ını kullan (Firebase uyumluluğu için)
  // Eğer window.auth yoksa, direkt Supabase kullan
  const auth = window.auth || (window.getSupabaseAuth && window.getSupabaseAuth());
  
  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    // Direkt Supabase kullan
    const supabase = window.supabase;
    if (!supabase) {
      console.warn('Supabase client veya auth wrapper yüklenmedi');
      return;
    }
    
    // Supabase auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Eğer zaten index.html sayfasındaysak, yönlendirme yapma (sonsuz döngüyü önle)
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
        if (!isIndexPage) {
          const indexPath = normalizeUrl('index.html');
          window.location.href = indexPath;
        }
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        await loadUserDataAndInit(session.user);
      }
    });
    
    // Mevcut session'ı kontrol et - Optimize retry mekanizması ile
    getSessionWithRetry().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Session alma hatası:', sessionError);
      }
      if (session?.user) {
        await loadUserDataAndInit(session.user);
      } else {
        // Eğer zaten index.html sayfasındaysak, yönlendirme yapma (sonsuz döngüyü önle)
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
        if (!isIndexPage) {
          const indexPath = normalizeUrl('index.html');
          window.location.href = indexPath;
        }
        // index.html'deyse, sayfa zaten login formunu gösterecek
      }
    });
    
    return;
  }
  
  // Firebase wrapper kullan
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Eğer zaten index.html sayfasındaysak, yönlendirme yapma (sonsuz döngüyü önle)
      const currentPath = window.location.pathname;
      const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
      if (!isIndexPage) {
        const indexPath = normalizeUrl('index.html');
        window.location.href = indexPath;
      }
      return;
    }
    await loadUserDataAndInit(user);
  });
}

// Kullanıcı verilerini yükle ve init et (ortak fonksiyon)
async function loadUserDataAndInit(user) {
  try {
    // Supabase client'ı kullan (direkt)
    const supabase = window.supabase;
    if (!supabase) {
      console.error('Supabase client yüklenmedi');
      // Supabase yüklenmediğinde de body'yi göster (kullanıcı hatayı görebilsin)
      document.body.style.visibility = 'visible';
      document.documentElement.style.visibility = 'visible';
      return;
    }

    // Kullanıcı bilgisini direkt Supabase'den al
    const userId = user.uid || user.id;
    const { data: userData, error: userError } = await supabase
      .from('kullanicilar')
      .select('id, adsoyad, email, yetkiler, rol, aktif')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Kullanıcı bilgisi alınamadı:', userError);
      showToast('error', 'Hata', 'Kullanıcı bilgisi yüklenemedi.');
      // Hata durumunda da body'yi göster (kullanıcı hatayı görebilsin)
      document.body.style.visibility = 'visible';
      document.documentElement.style.visibility = 'visible';
      return;
    }

    if (userData) {
      const data = userData;
      const profNameEl = document.getElementById('profName');
      if (profNameEl) {
        // Ad Soyad'ın tamamını göster (tüm sayfalarda aynı) + emoji
        const name = data.adsoyad || data.adSoyad || user.email?.split('@')[0] || 'Profil';
        profNameEl.textContent = `👤 ${name}`;
      }

      // Yetkileri yükle (hem local hem window'a)
      const rawPerms = Array.isArray(data.yetkiler) ? data.yetkiler : [];
      CURRENT_ALLOW = new Set(rawPerms.filter(s => !String(s).trim().startsWith('-') && !String(s).trim().startsWith('!')).map(norm));
      CURRENT_DENY = new Set(rawPerms.filter(s => String(s).trim().startsWith('-') || String(s).trim().startsWith('!')).map(s => window.norm(String(s).replace(/^[-!]\s*/, ''))));
      // Window'a da kopyala (sayfalar için)
      window.CURRENT_ALLOW = CURRENT_ALLOW;
      window.CURRENT_DENY = CURRENT_DENY;

      // Navigasyonu render et
      const panels = await fetchPanels(CURRENT_ALLOW, CURRENT_DENY);
      renderNav(panels);

      // Bildirimleri yükle
      await loadNotifications();
    }
    
    // Body ve HTML'i görünür yap (auth başarılı oldu)
    document.body.style.visibility = 'visible';
    document.documentElement.style.visibility = 'visible';
  } catch (e) {
    console.error('Kullanıcı bilgisi alınamadı:', e);
    showToast('error', 'Hata', 'Kullanıcı bilgisi yüklenemedi.');
    // Hata durumunda da body'yi göster (kullanıcı hatayı görebilsin)
    document.body.style.visibility = 'visible';
    document.documentElement.style.visibility = 'visible';
  }

  // Sayfa özel init fonksiyonunu çağır (eğer varsa)
  if (typeof window.initPage === 'function') {
    await window.initPage();
  }
}

/* === DOMContentLoaded'da başlat === */
// Supabase yüklendikten sonra çalışacak şekilde ayarla
function initWhenReady() {
  initAppShell();
  // Supabase client kontrolü
  if (window.supabase && typeof window.initAppShellAuth === 'function') {
    initAppShellAuth();
  } else {
    // Supabase henüz yüklenmediyse biraz bekle
    let retryCount = 0;
    const maxRetries = 20; // 10 saniye (20 * 500ms)
    const retryInterval = setInterval(() => {
      retryCount++;
      if (window.supabase && typeof window.initAppShellAuth === 'function') {
        clearInterval(retryInterval);
        initAppShellAuth();
      } else if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        console.warn('Supabase client veya initAppShellAuth yüklenmedi');
        // Timeout durumunda da body'yi göster (kullanıcı hatayı görebilsin)
        document.body.style.visibility = 'visible';
        document.documentElement.style.visibility = 'visible';
      }
    }, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhenReady);
} else {
  initWhenReady();
}
