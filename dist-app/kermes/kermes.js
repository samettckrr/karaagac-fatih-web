// Firebase bağlantı hazırsa Firestore'u kullan
const db = window.db;
let secilenUrunler = [];
let toplamTutar = 0;

function menuyuGoster() {
  const menuListesi = document.getElementById("menuListesi");
  menuListesi.innerHTML = "<p>Yükleniyor...</p>";

  db.collection("kermes_menu").orderBy("kategori").get().then(snapshot => {
    if (snapshot.empty) {
      menuListesi.innerHTML = "<p>Menüde ürün bulunamadı.</p>";
      return;
    }

    let html = "<ul>";
    snapshot.forEach(doc => {
      const urun = doc.data();
      html += `<li><strong>${urun.ad}</strong> (${urun.kategori}) - ${urun.fiyat}₺</li>`;
    });
    html += "</ul>";
    menuListesi.innerHTML = html;
  });

  document.getElementById("menuModal").style.display = "flex";
}

function satisModaliAc() {
  const satisDiv = document.getElementById("satisUrunleri");
  satisDiv.innerHTML = "Yükleniyor...";
  secilenUrunler = [];
  toplamTutar = 0;
  document.getElementById("toplamTutar").innerText = "0₺";

  db.collection("kermes_menu").orderBy("kategori").get().then(snapshot => {
    if (snapshot.empty) {
      satisDiv.innerHTML = "<p>Menüde ürün bulunamadı.</p>";
      return;
    }

    satisDiv.innerHTML = "";
    let index = 0;
    snapshot.forEach(doc => {
      const urun = doc.data();
      const satir = document.createElement("div");
      satir.innerHTML = `
        <label>${urun.ad} (${urun.fiyat}₺): 
          <input type="number" min="0" value="0" onchange="adetDegisti(${index}, this.value)">
        </label>
      `;
      satisDiv.appendChild(satir);
      secilenUrunler.push({ ...urun, adet: 0 });
      index++;
    });

    document.getElementById("satisModal").style.display = "flex";
  });
}

function adetDegisti(index, deger) {
  secilenUrunler[index].adet = parseInt(deger) || 0;
  toplamTutar = secilenUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
  document.getElementById("toplamTutar").innerText = `${toplamTutar}₺`;
}

function odemeEkraniAc() {
// Zorunlu masa no kontrolü
  const masa = document.getElementById("satisMasa").value.trim();
  if (!masa) {
    toastGoster("Lütfen masa numarası giriniz.", true);
    return;
  }

  // İsim varsa al, yoksa 'Misafir'
  const isim = document.getElementById("satisIsim").value.trim() || "Misafir";

  // Geçici olarak window objesine al (satış kaydet'te kullanacağız)
  window.satisMasaNo = masa;
  window.satisIsim = isim;

  document.getElementById("satisModal").style.display = "none";
  document.getElementById("odemeToplam").innerText = `${toplamTutar}₺`;
  document.getElementById("kalanBakiye").innerText = `${toplamTutar}₺`;
  document.getElementById("nakitOdeme").value = "";
  document.getElementById("posOdeme").value = "";
  document.getElementById("bankaOdeme").value = "";
  document.getElementById("odemeModal").style.display = "flex";
}

function odemeHesapla() {
  const nakit = parseFloat(document.getElementById("nakitOdeme").value) || 0;
  const pos = parseFloat(document.getElementById("posOdeme").value) || 0;
  const banka = parseFloat(document.getElementById("bankaOdeme").value) || 0;
  const kalan = toplamTutar - (nakit + pos + banka);
  document.getElementById("kalanBakiye").innerText = `${kalan}₺`;
}

function satisKaydet() {
  try {
    const nakit = parseFloat(document.getElementById("nakitOdeme").value) || 0;
    const pos = parseFloat(document.getElementById("posOdeme").value) || 0;
    const banka = parseFloat(document.getElementById("bankaOdeme").value) || 0;
    const kalan = toplamTutar - (nakit + pos + banka);
    const tarih = new Date().toLocaleString("tr-TR");

    // Güvenlik kontrolü: ürün seçilmiş mi?
    const secilenler = secilenUrunler.filter(u => u.adet > 0);
    if (secilenler.length === 0) {
      toastGoster("Lütfen en az bir ürün seçiniz.", true);
      return;
    }

    const veri = {
      tarih: tarih,
      masa: window.satisMasaNo || "1",
      isim: window.satisIsim || "Misafir",
      urunler: secilenler,
      toplam: toplamTutar,
      nakit,
      pos,
      banka,
      kalan,
      odendi: kalan <= 0
    };

    // Firestore objesi tanımlı mı kontrol
    if (!window.db || typeof db.collection !== "function") {
      toastGoster("Firebase bağlantısı sağlanamadı. Lütfen bağlantıyı kontrol edin.", true);
      return;
    }

    db.collection("kermes_satislar")
      .add(veri)
      .then(() => {
        toastGoster("✅ Satış başarıyla kaydedildi.", true);
        modalKapat("odemeModal");
        satisListesiniYenile(); // Tabloyu güncelle
      })
      .catch((err) => {
        console.error("🔥 Firestore Hatası:", err);
        toastGoster("Bir hata oluştu, tekrar deneyin.", true);
      });
  } catch (e) {
    console.error("❌ Genel Hata:", e);
    toastGoster("Bir hata oluştu.", true);
  }
}

function satisListesiniYenile() {
  const govde = document.getElementById("satisTabloGovde");
  govde.innerHTML = "";

  db.collection("kermes_satislar").orderBy("tarih", "desc").onSnapshot(snapshot => {
    let toplam = 0, nakit = 0, pos = 0, banka = 0;

    govde.innerHTML = "";
    snapshot.forEach(doc => {
      const veri = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${veri.tarih}</td>
        <td>${veri.masa}</td>
        <td>${veri.isim}</td>
        <td>${veri.toplam}₺</td>
        <td>${veri.odendi ? "✅" : "❌"}</td>
      `;
      govde.appendChild(tr);

      toplam += veri.toplam;
      nakit += veri.nakit;
      pos += veri.pos;
      banka += veri.banka;
    });

    document.getElementById("nakitSatis").innerText = `Nakit Satışı: ${nakit}₺`;
    document.getElementById("bankaSatis").innerText = `Banka Satışı: ${banka}₺`;
    document.getElementById("posSatis").innerText = `POS Satışı: ${pos}₺`;
    document.getElementById("toplamSatis").innerText = `Toplam Satış: ${toplam}₺`;
  });
}

function modalKapat(id) {
  document.getElementById(id).style.display = "none";
}

let secilenSatisDocId = null;

function satisListesiniYenile() {
  const govde = document.getElementById("satisTabloGovde");
  govde.innerHTML = "";

  db.collection("kermes_satislar").orderBy("tarih", "desc").onSnapshot(snapshot => {
    let toplam = 0, nakit = 0, pos = 0, banka = 0;

    govde.innerHTML = "";
    snapshot.forEach(doc => {
      const veri = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${veri.tarih}</td>
        <td>${veri.masa}</td>
        <td>${veri.isim}</td>
        <td>${veri.toplam}₺</td>
        <td>${veri.odendi ? "✅" : "❌"}</td>
      `;
      tr.onclick = () => satisDetayGoster(doc.id, veri);
      govde.appendChild(tr);

      toplam += veri.toplam;
      nakit += veri.nakit;
      pos += veri.pos;
      banka += veri.banka;
    });

    document.getElementById("nakitSatis").innerText = `Nakit Satışı: ${nakit}₺`;
    document.getElementById("bankaSatis").innerText = `Banka Satışı: ${banka}₺`;
    document.getElementById("posSatis").innerText = `POS Satışı: ${pos}₺`;
    document.getElementById("toplamSatis").innerText = `Toplam Satış: ${toplam}₺`;
  });
}

function satisDetayGoster(docId, veri) {
  secilenSatisDocId = docId;

  let html = `
    <p><strong>İsim:</strong> ${veri.isim}</p>
    <p><strong>Masa No:</strong> ${veri.masa}</p>
    <p><strong>Toplam:</strong> ${veri.toplam}₺</p>
    <p><strong>Nakit:</strong> ${veri.nakit}₺ | <strong>POS:</strong> ${veri.pos}₺ | <strong>Banka:</strong> ${veri.banka}₺</p>
    <p><strong>Ödeme Durumu:</strong> ${veri.odendi ? "🟢 Ödendi" : "🔴 Bekliyor"}</p>
    <p><strong>Ürünler:</strong></p>
    <ul>
      ${veri.urunler.map(u => `<li>${u.ad} x ${u.adet} = ${u.fiyat * u.adet}₺</li>`).join("")}
    </ul>
  `;
  document.getElementById("satisDetayIcerik").innerHTML = html;
  document.getElementById("satisDetayModal").style.display = "flex";
}

function odemeTamamlama() {
  if (!secilenSatisDocId) return;

  // Belirlenen satışın toplamını bul
  db.collection("kermes_satislar").doc(secilenSatisDocId).get().then(doc => {
    const veri = doc.data();
    window.ekOdemeToplam = veri.toplam;
    window.ekEskiNakit = veri.nakit || 0;
    window.ekEskiPos = veri.pos || 0;
    window.ekEskiBanka = veri.banka || 0;

    document.getElementById("ekToplamTutar").innerText = `${veri.toplam}₺`;
    document.getElementById("ekNakit").value = "";
    document.getElementById("ekPos").value = "";
    document.getElementById("ekBanka").value = "";
    document.getElementById("ekKalanBakiye").innerText = `${veri.kalan}₺`;

    document.getElementById("ekOdemeModal").style.display = "flex";
  });
}

function ekOdemeKaydet() {
  const yeniNakit = parseFloat(document.getElementById("ekNakit").value) || 0;
  const yeniPos = parseFloat(document.getElementById("ekPos").value) || 0;
  const yeniBanka = parseFloat(document.getElementById("ekBanka").value) || 0;

  const toplamOdeme = window.ekEskiNakit + window.ekEskiPos + window.ekEskiBanka + yeniNakit + yeniPos + yeniBanka;
  const kalan = window.ekOdemeToplam - toplamOdeme;

  const yeniVeri = {
    nakit: window.ekEskiNakit + yeniNakit,
    pos: window.ekEskiPos + yeniPos,
    banka: window.ekEskiBanka + yeniBanka,
    kalan: kalan,
    odendi: kalan <= 0
  };

  db.collection("kermes_satislar").doc(secilenSatisDocId).update(yeniVeri).then(() => {
    toastGoster("Ödeme güncellendi.", true);
    modalKapat("ekOdemeModal");
    modalKapat("satisDetayModal");
  });
}

function satisSil() {
  if (!secilenSatisDocId) return;
  if (confirm("Bu satışı silmek istediğinizden emin misiniz?")) {
    db.collection("kermes_satislar").doc(secilenSatisDocId).delete().then(() => {
      toastGoster("Satış silindi.", true);
      modalKapat("satisDetayModal");
    });
  }
}

function satisDuzenle() {
  toastGoster("Bu özellik V1.2’de eklenecek.", true);
}

function satisDuzenle() {
  if (!secilenSatisDocId) return;

  db.collection("kermes_satislar").doc(secilenSatisDocId).get().then(doc => {
    const veri = doc.data();

    // Form alanlarını doldur
    document.getElementById("duzenleIsim").value = veri.isim;
    document.getElementById("duzenleMasa").value = veri.masa;
    document.getElementById("duzenleNakit").value = veri.nakit;
    document.getElementById("duzenlePos").value = veri.pos;
    document.getElementById("duzenleBanka").value = veri.banka;

    // Ürünleri hazırla
    const urunDiv = document.getElementById("duzenleUrunler");
    urunDiv.innerHTML = "";
    window.duzenlenenUrunler = veri.urunler;

    window.duzenlenenUrunler.forEach((urun, index) => {
      const satir = document.createElement("div");
      satir.innerHTML = `
        <label>${urun.ad} (${urun.fiyat}₺): 
          <input type="number" min="0" value="${urun.adet}" onchange="duzenleAdetDegisti(${index}, this.value)">
        </label>
      `;
      urunDiv.appendChild(satir);
    });

    // Toplam hesapla
    duzenleOdemeHesapla();
    document.getElementById("duzenleModal").style.display = "flex";
  });
}

function duzenleAdetDegisti(index, deger) {
  window.duzenlenenUrunler[index].adet = parseInt(deger) || 0;
  duzenleOdemeHesapla();
}

function duzenleOdemeHesapla() {
  const toplam = window.duzenlenenUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
  document.getElementById("duzenleToplam").innerText = `${toplam}₺`;

  const nakit = parseFloat(document.getElementById("duzenleNakit").value) || 0;
  const pos = parseFloat(document.getElementById("duzenlePos").value) || 0;
  const banka = parseFloat(document.getElementById("duzenleBanka").value) || 0;
  const kalan = toplam - (nakit + pos + banka);

  document.getElementById("duzenleKalan").innerText = `${kalan}₺`;
  window.duzenleToplamTutar = toplam;
  window.duzenleKalanBakiye = kalan;
}

function satisGuncelle() {
  if (!secilenSatisDocId) return;

  const yeniVeri = {
    isim: document.getElementById("duzenleIsim").value,
    masa: document.getElementById("duzenleMasa").value,
    nakit: parseFloat(document.getElementById("duzenleNakit").value) || 0,
    pos: parseFloat(document.getElementById("duzenlePos").value) || 0,
    banka: parseFloat(document.getElementById("duzenleBanka").value) || 0,
    urunler: window.duzenlenenUrunler,
    toplam: window.duzenleToplamTutar,
    kalan: window.duzenleKalanBakiye,
    odendi: window.duzenleKalanBakiye <= 0
  };

  db.collection("kermes_satislar").doc(secilenSatisDocId).update(yeniVeri).then(() => {
    toastGoster("Satış başarıyla güncellendi.", true);
    modalKapat("duzenleModal");
    modalKapat("satisDetayModal");
  });
}

function toastGoster(mesaj, hata = false) {
  const toast = document.getElementById("toast");
  toast.innerText = mesaj;
  toast.classList.toggle("hata", hata);
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Sayfa yüklendiğinde satışları getir
window.onload = () => {
  satisListesiniYenile();
};
