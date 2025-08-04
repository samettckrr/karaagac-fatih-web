const db = firebase.firestore();
const tabloGovde = document.getElementById("talebeTablosu");

// Her talebe için toplam ücret
const TOPLAM_AIDAT = 7500;
const TOPLAM_KITAP = 2250;

// Tabloyu güncelle
function tabloyuYenile() {
  const satirlar = tabloGovde.querySelectorAll("tr");

  satirlar.forEach(satir => {
    const isim = satir.children[0].innerText;
    let aidatOdeme = 0, kitapOdeme = 0;
    let aidatIndirim = 0, kitapIndirim = 0;

    db.collection("aidat_kitap").where("isim", "==", isim).get().then(snapshot => {
      snapshot.forEach(doc => {
        const o = doc.data();

        // Ödeme türüne göre toplama ekle
        if (o.islemTuru === "Aidat") {
          aidatOdeme += o.miktar;
          if (o.aidatIndirim) aidatIndirim = Math.max(aidatIndirim, o.aidatIndirim);
        }
        else if (o.islemTuru === "Kitap") {
          kitapOdeme += o.miktar;
          if (o.kitapIndirim) kitapIndirim = Math.max(kitapIndirim, o.kitapIndirim);
        }
      });

      // İndirimleri uygula
      const aidatOdenecek = TOPLAM_AIDAT * (1 - aidatIndirim / 100);
      const kitapOdenecek = TOPLAM_KITAP - kitapIndirim;

      const kalanAidat = Math.max(0, aidatOdenecek - aidatOdeme);
      const kalanKitap = Math.max(0, kitapOdenecek - kitapOdeme);
      const toplamBorc = kalanAidat + kalanKitap;

      // Tabloya yaz
      satir.children[1].innerText = `${aidatOdeme} ₺`;
      satir.children[2].innerText = `${kalanAidat} ₺`;
      satir.children[3].innerText = `${kitapOdeme} ₺`;
      satir.children[4].innerText = `${kalanKitap} ₺`;
      satir.children[5].innerText = `${toplamBorc} ₺`;

      // Renklendirme
      satir.style.color = toplamBorc > 0 ? "red" : "black";
      satir.style.background = toplamBorc === 0 ? "#c8f7c5" : "white";

      // Sadece aidat bitmişse aidat sütunları yeşil
      if (kalanAidat === 0 && kalanKitap > 0) {
        satir.children[1].style.background = "#d4edda";
        satir.children[2].style.background = "#d4edda";
      } else {
        satir.children[1].style.background = "white";
        satir.children[2].style.background = "white";
      }
    });
  });
}

// İlk çalıştırma
tabloyuYenile();
