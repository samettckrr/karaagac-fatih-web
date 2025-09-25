// ../js/talebe-bilgi.js

function talebeBilgiFormuYukle() {
  console.log("🔥 talebeBilgiFormuYukle() çağrıldı");

// EN ÜSTE EKLEYİN (veya mevcut firebase.* tanımlarını bununla değiştirin)
const db = window.db;
const auth = window.auth;
const storage = window.storage;
  const kartAlani = document.getElementById("talebeKartAlani");

  if (!kartAlani) {
    console.warn("⚠️ talebeKartAlani bulunamadı.");
    return;
  }

  kartAlani.innerHTML = ""; // Önceki kartları temizle

  let toplam = 0;
  let ensar = 0;
  let muhacir = 0;

  db.collection("talebeler").get()
    .then((snapshot) => {
      console.log("📦 Talebe sayısı:", snapshot.size);

      const kartlar = [];

      snapshot.forEach((doc) => {
        const d = doc.data();
        const uid = doc.id;

        toplam++;
        if (d.durum === "Ensar") ensar++;
        else if (d.durum === "Muhacir") muhacir++;

        const adSoyad = d.kullAd || "İsimsiz";
        const fotoURL = d.fotograf || `https://ui-avatars.com/api/?name=${encodeURIComponent(adSoyad)}&background=random`;
        const alt = `${d.kurs || "-"} • ${d.durum || "-"}`;

        const card = document.createElement('div');
        card.className = 'talebe-kart';
        card.dataset.id = uid;
        card.dataset.name = adSoyad;
        card.innerHTML = `
          <img class="talebe-foto" src="${fotoURL}" alt="" loading="lazy" width="52" height="52">
          <div class="talebe-info">
            <div class="talebe-ad">${adSoyad}</div>
            <div class="talebe-alt">${alt}</div>
          </div>
        `;

        // Eski akışı bozmadan modal aç: localStorage + modal görünür + içerik yükle
        card.addEventListener('click', () => {
          localStorage.setItem("aktifTalebeUID", uid);
          const modal = document.getElementById("talebeModal");
          if (modal) {
            modal.classList.add('open'); // yeni tasarımla uyumlu
            // eski stil için de destek (display:flex):
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
          }
          if (typeof yukleModalIcerik === "function") yukleModalIcerik();
        });

        kartlar.push(card);
      });

      // A→Z sırala (Türkçe)
      kartlar.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || '', 'tr'));
      kartlar.forEach(c => kartAlani.appendChild(c));

      // İstatistikleri yaz
      const $top = document.getElementById("toplamSayisi");
      const $en  = document.getElementById("ensarSayisi");
      const $mu  = document.getElementById("muhacirSayisi");
      if ($top) $top.textContent = toplam;
      if ($en)  $en.textContent  = ensar;
      if ($mu)  $mu.textContent  = muhacir;
    })
    .catch((error) => {
      console.error("❌ Talebeler çekilirken hata oluştu:", error);
    });
}
