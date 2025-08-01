document.addEventListener("DOMContentLoaded", function () {
  const db = firebase.firestore();

  const personeller = [
    "Muhsin Çelik", "Faruk Nafiz Özgan", "İbrahim Ay", "Samet Çakır",
    "Kerem Kocaoğlu", "Serhan Durak", "Mahmut Solmaz", "Mehmet Taha Keskin","Ahmetali Emre Şahin"
  ];

  const islemSelect = document.getElementById("islemTuru");
  const kategoriSelect = document.getElementById("kategori");
  const formIcerik = document.getElementById("form-icerik");
  const modal = document.getElementById("onayModali");
  const modalBaslik = document.getElementById("modal-baslik");
  const modalVeriler = document.getElementById("modal-veriler");
  const modalKaydetBtn = document.getElementById("modal-kaydet-btn");

  window.formuGuncelle = function () {
    const islem = islemSelect.value;
    const kat = kategoriSelect.value;
    formIcerik.innerHTML = "";

    if (!islem || !kat) return;

    if (islem === "hedef-tanimlama") {
      let html = `<table><tr><th>Personel</th><th>Hedef (₺)</th></tr>`;
      personeller.forEach(p => {
        html += `<tr><td>${p}</td><td><input type="number" id="hedef-${p}"></td></tr>`;
      });
      html += `</table>`;
      formIcerik.innerHTML = html;
    }

    if (islem === "veri-giris") {
      formIcerik.innerHTML = `
        <label>Personeli Seçiniz</label>
        <select id="giris-personel">
          ${personeller.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <label>Parayı Verenin Adı Soyadı</label>
        <input type="text" id="giris-veren" placeholder="Örn: Mehmet Yılmaz" />
        <label>Miktar (₺)</label>
        <input type="number" id="giris-miktar" />
        <label>Para Nereye Geldi?</label>
        <select id="giris-turu">
          <option value="Nakit">Nakit</option>
          <option value="Banka">Banka</option>
        </select>
      `;
    }
  };

  window.formuGonder = function () {
    const islem = islemSelect.value;
    const kat = kategoriSelect.value;

    if (!islem || !kat) return toastGoster("Lütfen işlem türü ve kategori seçiniz.", true);

    if (islem === "hedef-tanimlama") {
      let liste = [];
      personeller.forEach(p => {
        const val = document.getElementById("hedef-" + p).value;
        if (val) liste.push({ kategori: kat, personel: p, hedef: parseInt(val) });
      });

      if (liste.length === 0) return toastGoster("Hedef girişi yapılmadı", true);

      modalBaslik.innerText = `Hedef Tanımlaması > ${kat}`;
      modalVeriler.innerHTML = liste.map(l => `<p>➤ ${l.personel} → ${l.hedef} ₺</p>`).join("");
      modalKaydetBtn.onclick = () => hedefleriKaydet(liste);
      modal.style.display = "flex";
    }

    if (islem === "veri-giris") {
      const personel = document.getElementById("giris-personel").value;
      const veren = document.getElementById("giris-veren").value.trim();
      const miktar = document.getElementById("giris-miktar").value;
      const tur = document.getElementById("giris-turu").value;

      if (!personel || !veren || !miktar || !tur) return toastGoster("Tüm alanlar doldurulmalı", true);

      const veri = {
        tarih: new Date().toLocaleDateString("tr-TR"),
        kategori: kat,
        personel,
        veren,
        miktar: parseInt(miktar),
        tur
      };

      modalBaslik.innerText = `Veri Girişi > ${kat}`;
      modalVeriler.innerHTML = `
        <p>Personel: ${personel}</p>
        <p>Veren: ${veren}</p>
        <p>Miktar: ${miktar} ₺</p>
        <p>Giriş: ${tur}</p>
      `;
      modal.style.display = "flex";

// Buton içeriğini güncelle
modalKaydetBtn.onclick = function () {
  if (islem === "hedef-tanimlama") hedefleriKaydet(liste);
  if (islem === "veri-giris") veriKaydet(veri);
};

    }
  };

  async function hedefleriKaydet(liste) {
    for (let h of liste) {
      await db.collection("hedefler").doc(`${h.kategori}_${h.personel}`).set(h);
    }
    toastGoster("✅ Hedef(ler) başarıyla kaydedildi.");
    kapatModal();
  }

  async function veriKaydet(veri) {
    await db.collection("veriler").add(veri);
    toastGoster("✅ Veri başarıyla kaydedildi.");
    kapatModal();
  }

  window.kapatModal = function () {
    modal.style.display = "none";
  };

  function toastGoster(mesaj, hata = false) {
    const t = document.getElementById("toast");
    t.textContent = mesaj;
    t.className = "toast-bildirim" + (hata ? " hata" : "");
    t.style.display = "block";
    setTimeout(() => t.style.opacity = 1, 100);
    setTimeout(() => {
      t.style.opacity = 0;
      setTimeout(() => t.style.display = "none", 1000);
    }, 3000);
  }
});
