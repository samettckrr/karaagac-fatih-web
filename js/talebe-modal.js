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

  const icerik = document.getElementById("modalIcerik");
  if (!icerik) return;

  const foto = d.fotograf || `https://ui-avatars.com/api/?name=${(d.kullAd || "Talebe").replace(/\s+/g, '+')}&background=random`;
  const vazifeler = (d.vazifeCheckboxGrup || []).concat(d.digerInput || []).join(", ");
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
          <div class="baslik-sag">
            <img src="${foto}" alt="Fotoğraf">
          </div>
        </div>

        <div class="isim">${d.kullAd || '-'}</div>
        <div class="tek-satir"><label>Geldiği Kurs:</label><span>${d.kurs || '-'}</span></div>

        <div class="bolum-baslik"><div class="bolum-harf">A</div>TALEBE BİLGİLERİ</div>
        <div class="row">
          <div class="etiketli"><label>Kimlikteki Adı</label><div class="kutu">${d.kimlikAd || '-'}</div></div>
          <div class="etiketli"><label>Durum</label><div class="kutu">${d.durum || '-'}</div></div>
        </div>
        <div class="row">
          <div class="etiketli"><label>Doğum Tarihi</label><div class="kutu">${d.dogumTarihi || '-'}</div></div>
          <div class="etiketli"><label>TC Kimlik</label><div class="kutu">${d.tc || '-'}</div></div>
        </div>
        <div class="row">
          <div class="etiketli"><label>Memleket</label><div class="kutu">${d.memleket || '-'}</div></div>
          <div class="etiketli"><label>Kan Grubu</label><div class="kutu">${d.kanGrubu || '-'}</div></div>
        </div>
        <div class="etiketli"><label>Mezhep</label><div class="mezhep-btnlar">${mezhepBtns}</div></div>

        <div class="bolum-baslik"><div class="bolum-harf">B</div>OKUL BİLGİLERİ</div>
        <div class="row">
          <div class="etiketli"><label>Öğrenim Seviyesi</label><div class="kutu">${d.ogrenimSeviyesi || '-'}</div></div>
          <div class="etiketli"><label>Mezuniyet Durumu</label><div class="kutu">${d.mezuniyetDurumu || '-'}</div></div>
          <div class="etiketli"><label>Eğitim Türü</label><div class="kutu">${d.egitimTuru || '-'}</div></div>
        </div>

        <div class="bolum-baslik"><div class="bolum-harf">C</div>ADRES BİLGİLERİ</div>
        <div class="row"><div class="etiketli"><label>İl / İlçe / Mahalle</label><div class="kutu">${d.adresIl || '-'}/${d.adresIlce || '-'}/${d.adresMahalle || '-'}</div></div></div>
        <div class="row"><div class="etiketli"><label>Açık Adres</label><div class="kutu">${d.adresAcik || '-'}</div></div></div>

        <div class="bolum-baslik"><div class="bolum-harf">D</div>AİLE BİLGİLERİ</div>
        <div class="row">
          <div class="etiketli"><label>Baba</label>
            <div class="kutu">${d.babaAd || '-'}</div>
            <div class="kutu">${d.babaTel || '-'}</div>
            <div class="kutu">${d.babaMeslek || '-'}</div>
            <div class="kutu">${d.babaDurum || '-'}</div>
          </div>
          <div class="etiketli"><label>Anne</label>
            <div class="kutu">${d.anneAd || '-'}</div>
            <div class="kutu">${d.anneTel || '-'}</div>
            <div class="kutu">${d.anneMeslek || '-'}</div>
            <div class="kutu">${d.anneDurum || '-'}</div>
          </div>
        </div>
        <div class="row">
          <div class="etiketli"><label>Maddi Durum</label><div class="kutu">${d.maddiDurum || '-'}</div></div>
          <div class="etiketli"><label>Kursta Okuyan</label><div class="kutu">${d.kurstakiKardesSayisi || '-'}</div></div>
          <div class="etiketli"><label>Kardeş Sayısı</label><div class="kutu">${d.kardesSayisi || '-'}</div></div>
        </div>

        <div class="bolum-baslik"><div class="bolum-harf">E</div>SAĞLIK BİLGİLERİ</div>
        <div class="row"><div class="etiketli"><label>Not</label><div class="kutu">${d.rahatsizlik || '-'}</div></div></div>

        <div class="bolum-baslik"><div class="bolum-harf">F</div>VAZİFE BİLGİLERİ</div>
        <div class="row"><div class="etiketli"><label>Vazifeler</label><div class="kutu">${vazifeler || '-'}</div></div></div>
        <div class="row"><div class="etiketli"><label>Cuma Namazı Kıldırabilir</label><div class="kutu">${d.cumaKilabilir || '-'}</div></div></div>
      </div>

      <div class="modal-footer">
        <button onclick="modalKapat()">Kapat</button>
        <button onclick="pdfCiktisiAl()">PDF Çıktı Al</button>
      </div>
    </div>
  `;
}

// talebe-modal.js içine en alta ekle:
window.modalKapat = function () {
  const modal = document.getElementById("talebeModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

window.pdfCiktisiAl = function () {
  const el = document.getElementById("pdfAlani");
  html2pdf().from(el).save("talebe.pdf");
}
