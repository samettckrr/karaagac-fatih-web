const db = firebase.firestore();

const veriGirisiBtn = document.getElementById("veriGirisiBtn");
const veriGirisiModal = document.getElementById("veriGirisiModal");
const onayModal = document.getElementById("onayModal");
const kapatModal = document.getElementById("kapatModal");
const veriFormu = document.getElementById("veriFormu");
const onIzlemeAlani = document.getElementById("onIzlemeAlani");
const sonKaydetBtn = document.getElementById("sonKaydetBtn");
const talebeSec = document.getElementById("talebeSec");
const tabloGovde = document.getElementById("talebeTablosu");

let girilenVeri = {};

// Modal açma/kapama
veriGirisiBtn.onclick = () => (veriGirisiModal.style.display = "block");
kapatModal.onclick = () => (veriGirisiModal.style.display = "none");
window.onclick = (e) => {
  if (e.target == veriGirisiModal) veriGirisiModal.style.display = "none";
  if (e.target == onayModal) onayModal.style.display = "none";
};

// Önizleme
veriFormu.onsubmit = (e) => {
  e.preventDefault();

  const islemTuru = document.getElementById("islemTuru").value;
  const isim = talebeSec.value;
  const miktar = parseFloat(document.getElementById("paraMiktari").value);
  const odemeYontemi = document.getElementById("odemeYontemi").value;

  if (!islemTuru || !isim || !miktar || !odemeYontemi) return;

  girilenVeri = { isim, islemTuru, miktar, odemeYontemi, tarih: new Date().toISOString() };

  onIzlemeAlani.innerHTML = `
    <p><strong>İşlem Türü:</strong> ${islemTuru}</p>
    <p><strong>Talebe:</strong> ${isim}</p>
    <p><strong>Miktar:</strong> ${miktar} TL</p>
    <p><strong>Ödeme Yöntemi:</strong> ${odemeYontemi}</p>
  `;

  veriGirisiModal.style.display = "none";
  onayModal.style.display = "block";
};

// Kaydet
sonKaydetBtn.onclick = () => {
  db.collection("aidat_kitap").add(girilenVeri).then(() => {
    onayModal.style.display = "none";
    veriFormu.reset();
    alert("✅ Veri kaydedildi.");
    tabloyuYenile();
  });
};

// Tabloyu güncelle
function tabloyuYenile() {
  const satirlar = tabloGovde.querySelectorAll("tr");

  satirlar.forEach(satir => {
    const isim = satir.children[0].innerText;
    let aidatOdeme = 0, kitapOdeme = 0;

    db.collection("aidat_kitap").where("isim", "==", isim).get().then(snapshot => {
      snapshot.forEach(doc => {
        const o = doc.data();
        if (o.islemTuru === "Aidat") aidatOdeme += o.miktar;
        else if (o.islemTuru === "Kitap") kitapOdeme += o.miktar;
      });

      // Toplamlar elle tanımlanabilir veya sıfır kabul edilebilir
      const toplamAidat = 5000; // örnek
      const toplamKitap = 2250;

      const kalanAidat = Math.max(0, toplamAidat - aidatOdeme);
      const kalanKitap = Math.max(0, toplamKitap - kitapOdeme);
      const toplamBorc = kalanAidat + kalanKitap;

      satir.children[1].innerText = `${aidatOdeme} ₺`;
      satir.children[2].innerText = `${kalanAidat} ₺`;
      satir.children[3].innerText = `${kitapOdeme} ₺`;
      satir.children[4].innerText = `${kalanKitap} ₺`;
      satir.children[5].innerText = `${toplamBorc} ₺`;
    });
  });
}

// İlk çalıştırma
tabloyuYenile();
