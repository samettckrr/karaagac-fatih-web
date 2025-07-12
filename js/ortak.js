// =========================
// GİRİŞ - index.html
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordBtn = document.getElementById("forgotPassword");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          window.location.href = "panel.html"; // Giriş başarılı
        })
        .catch((error) => {
          alert("Hata: " + error.message);
        });
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value.trim();
      if (!email) return alert("Lütfen önce e-posta adresinizi girin.");

      auth.sendPasswordResetEmail(email)
        .then(() => {
          alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        })
        .catch((error) => {
          alert("Hata: " + error.message);
        });
    });
  }
});


// =========================
// PANEL - panel.html
// =========================

function baslatPanel() {
  console.log("Panel yüklendi"); // Giriş kontrolü burada yapılabilir
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
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
      { baslik: "Talebe Listesi", ikon: "📋", link: "talebe-liste.html" },
      { baslik: "Takrir Durumu", ikon: "📗", link: "talebe/ezber-takibi.html" },
      { baslik: "İzin Giriş/Çıkış", ikon: "🛫", link: "talebe/izin-giriscikis.html" },
      { baslik: "Ezber Takibi", ikon: "📈", link: "talebe/ezber-takibi.html" }
    ];
  } else if (panelAdi === "personel") {
    kartlar = [
      { baslik: "Nöbet Çizelgesi", ikon: "📅", link: "personel/nobet.html" },
      { baslik: "Personel Aylık Performans", ikon: "📊", link: "personel/aylik-performans.html" },
      { baslik: "Hedefler", ikon: "🎯", link: "diger/grafik/muhasebe-grafik.html" },
      { baslik: "Alacak Takibi", ikon: "💰", link: "personel/alacak-takibi.html" },
      { baslik: "Temizlik Kontrolü", ikon: "🧹", link: "personel/temizlik-kontrolu.html" }
    ];
  } else if (panelAdi === "nehari") {
    kartlar = [
      { baslik: "Yemek Listesi", ikon: "🍽️", link: "yemek.html" },
      { baslik: "İkram Raporu", ikon: "☕", link: "ikram.html" }
    ];
  } else if (panelAdi === "diger") {
    kartlar = [
      { baslik: "İçeriği Daha Sonra Paylaşılacaktır", ikon: "📑", link: "diger/genel-muhasebe.html" },
      { baslik: "Kullanıcı Yönetimi", ikon: "🛠️", link: "diger/kullanici-yonetimi.html" },
      { baslik: "Sistem Ayarları", ikon: "⚙️", link: "diger/sistem-ayarlari.html" },
      { baslik: "Form Girişi" , ikon: "📝" , link: "diger/muhasebe-form.html"},
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
    fetch("talebe-bilgi-formu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "/js/talebe-bilgi.js";
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
