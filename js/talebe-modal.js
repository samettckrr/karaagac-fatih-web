// Sayfa yüklendiğinde modal dış tıklama kontrolü tanımlanır
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("talebeModal");

  if (!modal) {
    console.warn("⚠️ Modal elementi (talebeModal) bulunamadı.");
    return;
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modalKapat();
    }
  });
});

// Modal içeriğini doldurur
async function yukleModalIcerik() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return alert("Talebe seçimi bulunamadı.");

  const doc = await firebase.firestore().collection("talebeler").doc(uid).get();
  if (!doc.exists) return alert("Talebe kaydı bulunamadı.");
  const d = doc.data();
  const tipi = d.tipi || '-'; // ensar veya muhacir olduğunu belirler

    console.log("📄 Talebe Verisi:", d); // 👈 buraya ekle

  const icerik = document.getElementById("modalIcerik");
  if (!icerik) return;

    // ALT NESNELERİ PARÇALA
  const adres = d.adresBilgisi || {};
  const aile = d.aileBilgisi || {};
  const okul = d.okulBilgisi || {};
  const saglik = d.saglikBilgisi || {};
  const vazife = d.vazifeBilgisi || {};

  const kimlikAd = d.kimlikAd || "-";
  const durum = d.durum || "-";
  const dogumTarihi = d.dogumTarihi || "-";
  const kanGrubu = d.kanGrubu || "-";
  const memleketIl = tipi === "ensar" ? (d.memleket || "-") : "-";
  const memleketUlke = tipi === "muhacir" ? (d.memleket || "-") : "-";
  const ikametDurumu = tipi === "muhacir" ? (d.ikametVarYok || d.ikametDurumu || "-") : "-";
  const tcKimlik = tipi === "ensar" ? (d.tc || "-") : "-";

const foto = d.fotograf || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.kullAd || "Talebe")}&background=random`;
const vazifeler = (vazife.vazifeler || []).join(", ");
const mezhepBtns = ["Hanefi", "Şafi", "Maliki", "Hanbeli"]
    .map(m => `<div class="mezhep-btn${d.mezhep === m ? ' aktif' : ''}">${m}</div>`).join("");

  icerik.innerHTML = `
    <style>
      .sayfa{width:800px;margin:20px auto;background:#fff;padding:30px 40px;box-sizing:border-box;border:1px solid #ccc}
      .baslik{display:flex;justify-content:space-between;align-items:center}
      .baslik-sol h1{font-size:18px;margin:0 0 4px 0}
      .baslik-sol h2{font-size:13px;font-weight:normal;margin:0}
      .baslik-sag{width:100px;height:100px;border-radius:50%;background-color:#e4e4e4;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold}
      .isim{font-size:26px;font-weight:bold;margin:20px 0 10px 0}
      .row{display:flex;gap:10px;margin:10px 0}
      .etiketli{flex:1}
      .etiketli label{font-size:14px;font-weight:bold;margin-bottom:4px;display:block}
      .kutu{background-color:#f3f3f3;border:1px solid #ccc;padding:7px 10px;font-size:14px;min-height:28px;font-weight:bold}
      .bolum-baslik{display:flex;align-items:center;background-color:#2f4f30;color:white;margin:30px 0 10px;padding:5px 10px;font-size:15px;font-weight:bold}
      .bolum-harf{background-color:#d94141;padding:4px 12px;margin-right:10px;border-radius:3px;font-weight:bold}
      .mezhep-btnlar{display:flex;gap:5px;margin-top:5px}
      .mezhep-btn{border:1px solid #ccc;padding:3px 10px;border-radius:4px;font-size:13px;background:white}
      .mezhep-btn.aktif{background:#d3e8d3;border-color:#68b268}
      .tek-satir{margin:15px 0}
      .tek-satir label{font-size:14px;font-weight:bold;margin-right:10px}
      .tek-satir span{background:#f3f3f3;border:1px solid #ccc;padding:6px 10px;font-size:14px;font-weight:bold}
      .modal-footer{display:flex;justify-content:center;gap:20px;margin:30px 0}
      .modal-footer button{padding:10px 20px;background:#4a637d;border:none;color:white;border-radius:5px;cursor:pointer;font-size:14px}
      .modal-footer button:hover{background:#3b526b}
    </style>

      <div class="modal-pdf">
      <div class="sayfa" id="pdfAlani">
        <div class="baslik">
          <div class="baslik-sol">
            <h1>KARAAĞAÇ FATİH DAİMİ TEKÂMÜLALTI</h1>
            <h2>2025-2026 Eğitim Yılı | 6. Devre</h2>
          </div>
          <div class="baslik-sag"><img src="${foto}" alt="Fotoğraf"></div>
        </div>

        <div class="isim">${d.kullAd || '-'}</div>
        <div class="tek-satir"><label>Geldiği Kurs:</label><span>${d.kurs || '-'}</span></div>

        <div class="bolum-baslik"><div class="bolum-harf">A</div>TALEBE BİLGİLERİ</div>
                <div class="row">
          <div class="etiketli"><label>Kimlikteki Adı</label><div class="kutu">${kimlikAd}</div></div>
          <div class="etiketli"><label>Durum</label><div class="kutu">${durum}</div></div>
        </div>
        <div class="row">
          <div class="etiketli"><label>Doğum Tarihi</label><div class="kutu">${dogumTarihi}</div></div>
          <div class="etiketli"><label>Kan Grubu</label><div class="kutu">${kanGrubu}</div></div>
        </div>
        <div class="row">
          <div class="etiketli"><label>Memleket (İl)</label><div class="kutu">${memleketIl}</div></div>
          <div class="etiketli"><label>Memleket (Ülke)</label><div class="kutu">${memleketUlke}</div></div>
        </div>
        <div class="row">
          <div class="etiketli"><label>İkamet Durumu</label><div class="kutu">${ikametDurumu}</div></div>
          <div class="etiketli"><label>TC Kimlik</label><div class="kutu">${tcKimlik}</div></div>
        </div>
        <div class="etiketli"><label>Mezhep</label><div class="mezhep-btnlar">${mezhepBtns}</div></div>

        <div class="bolum-baslik"><div class="bolum-harf">B</div>OKUL BİLGİLERİ</div>
        <div class="row">
        <div class="etiketli"><label>Öğrenim Seviyesi</label><div class="kutu">${okul.ogrenimSeviyesi || '-'}</div></div>
        <div class="etiketli"><label>Mezuniyet Durumu</label><div class="kutu">${okul.mezuniyetDurumu || '-'}</div></div>
        <div class="etiketli"><label>Eğitim Türü</label><div class="kutu">${okul.egitimTuru || '-'}</div></div>
      </div>

      <div class="bolum-baslik"><div class="bolum-harf">C</div>ADRES BİLGİLERİ</div>
      <div class="row"><div class="etiketli"><label>İl / İlçe / Mahalle</label><div class="kutu">${adres.il || '-'}/${adres.ilce || '-'}/${adres.mahalle || '-'}</div></div></div>
      <div class="row"><div class="etiketli"><label>Açık Adres</label><div class="kutu">${adres.acikAdres || adres.adresAcik || '-'}</div></div></div>

        <div class="bolum-baslik"><div class="bolum-harf">D</div>AİLE BİLGİLERİ</div>
        <div class="row">
        <div class="etiketli"><label>Baba</label>
          <div class="kutu">${aile.babaAd || '-'}</div>
          <div class="kutu">${aile.babaTel || '-'}</div>
          <div class="kutu">${aile.babaMeslek || '-'}</div>
          <div class="kutu">${aile.babaDurum || '-'}</div>
        </div>
        <div class="etiketli"><label>Anne</label>
          <div class="kutu">${aile.anneAd || '-'}</div>
          <div class="kutu">${aile.anneTel || '-'}</div>
          <div class="kutu">${aile.anneMeslek || '-'}</div>
          <div class="kutu">${aile.anneDurum || '-'}</div>
        </div>
      </div>
        <div class="row">
        <div class="etiketli"><label>Maddi Durum</label><div class="kutu">${aile.maddiDurum || '-'}</div></div>
        <div class="etiketli"><label>Kursta Okuyan</label><div class="kutu">${aile.kurstakiKardesSayisi || '-'}</div></div>
        <div class="etiketli"><label>Kardeş Sayısı</label><div class="kutu">${aile.kardesSayisi || '-'}</div></div>
      </div>

        <div class="bolum-baslik"><div class="bolum-harf">E</div>SAĞLIK BİLGİLERİ</div>
      <div class="row"><div class="etiketli"><label>Not</label><div class="kutu">${saglik.rahatsizlik || '-'}</div></div></div>

       <div class="bolum-baslik"><div class="bolum-harf">F</div>VAZİFE BİLGİLERİ</div>
      <div class="row"><div class="etiketli"><label>Vazifeler</label><div class="kutu">${vazifeler || '-'}</div></div></div>
      <div class="row"><div class="etiketli"><label>Cuma Namazı Kıldırabilir</label><div class="kutu">${vazife.cumaKilabilir || '-'}</div></div></div>
    </div>


      <div class="modal-footer">
        <button onclick="modalKapat()">Kapat</button>
        <button onclick="pdfCiktisiAl()">PDF Çıktı Al</button>
      </div>
    </div>
  `;
}

// Modal kapatma
window.modalKapat = function () {
  const modal = document.getElementById("talebeModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// PDF çıktısı alma
window.pdfCiktisiAl = function () {
  const el = document.getElementById("pdfAlani");
  html2pdf().from(el).save("talebe.pdf");
}