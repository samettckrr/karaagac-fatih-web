// ../js/talebe-modal.js
// Modal dış tıklama (mevcut davranışı korur)
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("talebeModal");
  if (!modal) return;
  window.addEventListener("click", function (event) {
    if (event.target === modal) modalKapat();
  });
});

// ========= Yardımcılar =========
// EN ÜSTE EKLEYİN (veya mevcut firebase.* tanımlarını bununla değiştirin)
const db = window.db;
const auth = window.auth;
const storage = window.storage;

// Mevcut dokümanı tutacağız (view/edit/photo arasında aynı kayıt)
let __AKTIF_ID = null;
let __AKTIF_REC = null;

const F = {
  // Kök alanlar (sizdeki isimlerle birebir)
  ad: 'kullAd',
  durum: 'durum',
  kurs: 'kurs',
  foto: 'fotograf',
  dogum: 'dogumTarihi',
  kan: 'kanGrubu',
  memIl: 'memleket',
  memUlke: 'ulke',
  tc: 'tc',
  ikamet: 'ikamet',
  // Alt nesneler
  adres: 'adresBilgisi',
  okul: 'okulBilgisi',
  aile: 'aileBilgisi',
  saglik: 'saglikBilgisi',
  vazife: 'vazifeBilgisi'
};

function safe(obj, path, fallback='-'){
  try{
    return path.split('.').reduce((o,k)=> (o && o[k] != null ? o[k] : null), obj) ?? fallback;
  }catch(_){ return fallback; }
}

function fmtDateTR(isoLike){
  if(!isoLike || typeof isoLike!=='string' || !isoLike.includes('-')) return isoLike || '-';
  const [y, m, d] = isoLike.split('-');
  return `${d}.${m}.${y}`;
}

function tplTabs(active='view'){
  return `
    <div class="modal-tabs">
      <button class="tab-btn ${active==='view'?'active':''}"   data-tab="view">Görüntüle</button>
      <button class="tab-btn ${active==='edit'?'active':''}"   data-tab="edit">Düzenle</button>
      <button class="tab-btn ${active==='photo'?'active':''}"  data-tab="photo">Fotoğraf</button>
    </div>
  `;
}

// ========= VIEW (PDF benzeri) =========
function tplView(rec){
  const d = rec || {};
  const adres = d[F.adres] || {};
  const aile  = d[F.aile]  || {};
  const okul  = d[F.okul]  || {};
  const saglik= d[F.saglik]|| {};
  const vazife= d[F.vazife]|| {};

  const foto = d[F.foto] || `https://ui-avatars.com/api/?name=${encodeURIComponent(d[F.ad] || "Talebe")}&background=random`;
  const dogumGoster = fmtDateTR(d[F.dogum]);

  const vazifeler = Array.isArray(vazife.vazifeler) ? vazife.vazifeler.join(', ') : (vazife.vazifeler || '-');
  const mezhepler = ["Hanefi", "Şafi", "Maliki", "Hanbeli"];
  const mezhepBtns = mezhepler.map(m => `<div class="mezhep-btn${d.mezhep === m ? ' aktif' : ''}">${m}</div>`).join("");

  return `
    <div class="modal-body">
      <style>
        .sayfa{width:800px;margin:20px auto;background:#fff;padding:30px 40px;box-sizing:border-box;border:1px solid #ccc}
        .baslik{display:flex;justify-content:space-between;align-items:center}
        .baslik-sol h1{font-size:18px;margin:0 0 4px 0}
        .baslik-sol h2{font-size:13px;font-weight:normal;margin:0}
        .baslik-sag{width:100px;height:100px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#e4e4e4}
        .baslik-sag img{width:100%;height:100%;object-fit:cover}
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

          <div class="isim">${d[F.ad] || '-'}</div>
          <div class="tek-satir"><label>Geldiği Kurs:</label><span>${d[F.kurs] || '-'}</span></div>

          <div class="bolum-baslik"><div class="bolum-harf">A</div>TALEBE BİLGİLERİ</div>
          <div class="row">
            <div class="etiketli"><label>Kimlikteki Adı</label><div class="kutu">${d.kimlikAd || '-'}</div></div>
            <div class="etiketli"><label>Durum</label><div class="kutu">${d[F.durum] || '-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Doğum Tarihi</label><div class="kutu">${dogumGoster}</div></div>
            <div class="etiketli"><label>Kan Grubu</label><div class="kutu">${d[F.kan] || '-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Memleket (İl)</label><div class="kutu">${d[F.memIl] || '-'}</div></div>
            <div class="etiketli"><label>Memleket (Ülke)</label><div class="kutu">${d[F.memUlke] || '-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>TC Kimlik</label><div class="kutu">${d[F.tc] || '-'}</div></div>
            <div class="etiketli"><label>İkamet Durumu</label><div class="kutu">${d[F.ikamet] || '-'}</div></div>
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
            <div class="etiketli"><label>Kursta Okuyan "Kend.Hariç"</label><div class="kutu">${aile.kurstakiKardesSayisi || '-'}</div></div>
            <div class="etiketli"><label>Kardeş Sayısı "Kend.Dahil"</label><div class="kutu">${aile.kardesSayisi || '-'}</div></div>
          </div>

          <div class="bolum-baslik"><div class="bolum-harf">E</div>SAĞLIK BİLGİLERİ</div>
          <div class="row"><div class="etiketli"><label>Not</label><div class="kutu">${saglik.rahatsizlik || '-'}</div></div></div>

          <div class="bolum-baslik"><div class="bolum-harf">F</div>VAZİFE BİLGİLERİ</div>
          <div class="row"><div class="etiketli"><label>Vazifeleri</label><div class="kutu">${vazifeler || '-'}</div></div></div>
          <div class="row"><div class="etiketli"><label>Cuma Namazı Kıldırabilir Mi?</label><div class="kutu">${vazife.cumaKilabilir || '-'}</div></div></div>
        </div>

        <div class="modal-footer">
          <button onclick="modalKapat()">Kapat</button>
          <button onclick="pdfCiktisiAl()">PDF Çıktı Al</button>
        </div>
      </div>
    </div>
  `;
}

// ========= EDIT =========
function tplEdit(rec){
  const d = rec || {};
  const adres = d[F.adres] || {};
  const aile  = d[F.aile]  || {};
  const okul  = d[F.okul]  || {};
  const saglik= d[F.saglik]|| {};
  const vazife= d[F.vazife]|| {};

  return `
    <form id="editForm" class="modal-body">
      <div class="form-grid">
        <div class="fld"><label>Ad Soyad</label><input name="${F.ad}" value="${d[F.ad] || ''}"></div>
        <div class="fld"><label>Durum</label>
          <select name="${F.durum}">
            ${['Ensar','Muhacir','Diğer'].map(v=>`<option ${d[F.durum]===v?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="fld"><label>Kurs</label><input name="${F.kurs}" value="${d[F.kurs] || ''}"></div>
        <div class="fld"><label>Doğum Tarihi</label><input type="date" name="${F.dogum}" value="${(d[F.dogum]||'').slice(0,10)}"></div>
        <div class="fld"><label>Kan Grubu</label><input name="${F.kan}" value="${d[F.kan] || ''}"></div>
        <div class="fld"><label>Memleket (İl)</label><input name="${F.memIl}" value="${d[F.memIl] || ''}"></div>
        <div class="fld"><label>Memleket (Ülke)</label><input name="${F.memUlke}" value="${d[F.memUlke] || ''}"></div>
        <div class="fld"><label>TC Kimlik</label><input name="${F.tc}" value="${d[F.tc] || ''}"></div>
        <div class="fld"><label>İkamet</label><input name="${F.ikamet}" value="${d[F.ikamet] || ''}"></div>

        <!-- Alt Objeler -->
        <div class="fld"><label>Adres İl</label><input name="${F.adres}.il" value="${adres.il||''}"></div>
        <div class="fld"><label>Adres İlçe</label><input name="${F.adres}.ilce" value="${adres.ilce||''}"></div>
        <div class="fld"><label>Adres Mahalle</label><input name="${F.adres}.mahalle" value="${adres.mahalle||''}"></div>
        <div class="fld" style="grid-column:1/-1"><label>Açık Adres</label><input name="${F.adres}.acikAdres" value="${adres.acikAdres || adres.adresAcik || ''}"></div>

        <div class="fld"><label>Öğrenim Seviyesi</label><input name="${F.okul}.ogrenimSeviyesi" value="${okul.ogrenimSeviyesi||''}"></div>
        <div class="fld"><label>Mezuniyet Durumu</label><input name="${F.okul}.mezuniyetDurumu" value="${okul.mezuniyetDurumu||''}"></div>
        <div class="fld"><label>Eğitim Türü</label><input name="${F.okul}.egitimTuru" value="${okul.egitimTuru||''}"></div>

        <div class="fld" style="grid-column:1/-1"><label>Sağlık Notu</label><textarea name="${F.saglik}.rahatsizlik">${saglik.rahatsizlik||''}</textarea></div>
        <div class="fld"><label>Vazifeler (virgülle)</label><input name="${F.vazife}.vazifeler" value="${Array.isArray(vazife.vazifeler)?vazife.vazifeler.join(', '):(vazife.vazifeler||'')}"></div>
        <div class="fld"><label>Cuma Kıldırabilir mi?</label>
          <select name="${F.vazife}.cumaKilabilir">
            ${['Evet','Hayır','-'].map(v=>`<option ${String(vazife.cumaKilabilir||'-')===v?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-ghost" data-act="close">Kapat</button>
        <button type="submit" class="btn-primary">Kaydet</button>
      </div>
    </form>
  `;
}

// ========= PHOTO =========
function tplPhoto(rec){
  const foto = rec?.[F.foto] || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec?.[F.ad] || "Talebe")}&background=random`;
  return `
    <div class="modal-body">
      <div class="view-head">
      <img class="view-photo" id="photoPreview" src="${foto}" alt=""
          loading="lazy" width="84" height="84">
        <div>
          <div class="view-name">${rec?.[F.ad] || '-'}</div>
          <div class="talebe-alt">Fotoğraf yükle/değiştir</div>
        </div>
      </div>
      <div class="view-kutu" style="margin-top:10px">
        <input type="file" id="photoFile" accept="image/*">
        <div id="photoHint" class="talebe-alt" style="margin-top:6px">JPG/PNG, tercihen 600×600+</div>
        <div id="photoStatus" class="talebe-alt" style="margin-top:6px"></div>
      </div>

      <div class="modal-actions">
        <button class="btn-ghost" data-act="close">Kapat</button>
      </div>
    </div>
  `;
}

// ========= Modal Çiz =========
function drawModal(active='view'){
  const c = document.getElementById("modalIcerik");
  if(!c) return;

  c.innerHTML = `
    ${tplTabs(active)}
    ${active==='view' ? tplView(__AKTIF_REC) : active==='edit' ? tplEdit(__AKTIF_REC) : tplPhoto(__AKTIF_REC)}
  `;

  // Tab olayları
  c.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> drawModal(btn.dataset.tab));
  });

  // Kapat
  c.querySelector('[data-act="close"]')?.addEventListener('click', modalKapat);

  // Kaydet
  const form = document.getElementById('editForm');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      await kaydetForm(form);
      // Kartı ekranda güncelle
      try{
        const card = document.querySelector(`.talebe-kart[data-id="${__AKTIF_ID}"]`);
        if(card){
          card.querySelector('.talebe-ad')?.replaceChildren(document.createTextNode(__AKTIF_REC[F.ad]||'İsimsiz'));
          const alt = `${__AKTIF_REC[F.kurs]||'-'} • ${__AKTIF_REC[F.durum]||'-'}`;
          card.querySelector('.talebe-alt')?.replaceChildren(document.createTextNode(alt));
          if(__AKTIF_REC[F.foto]) card.querySelector('.talebe-foto')?.setAttribute('src', __AKTIF_REC[F.foto]);
        }
      }catch(_){}
      drawModal('view');
    });
  }

  // Foto upload
  if(active==='photo'){
    const file = document.getElementById('photoFile');
    file?.addEventListener('change', uploadPhotoToStorage);
  }
}

// ========= Form Kaydet (Firestore) =========
async function kaydetForm(formEl){
  const data = new FormData(formEl);
  const payload = JSON.parse(JSON.stringify(__AKTIF_REC || {})); // derin kopya

  // Form isimlerini objeye uygula (alt nesne destekli: "adresBilgisi.il" gibi)
  for(const [k,vRaw] of data.entries()){
    const v = String(vRaw).trim();
    if(!k.includes('.')){
      payload[k] = v;
    }else{
      const parts = k.split('.');
      let ref = payload;
      for(let i=0;i<parts.length;i++){
        const key = parts[i];
        if(i === parts.length-1){
          // özel: vazifeler virgül → dizi
          if(k.endsWith('vazifeler')){
            ref[key] = v ? v.split(',').map(s=>s.trim()).filter(Boolean) : [];
          }else{
            ref[key] = v;
          }
        }else{
          ref[key] = ref[key] || {};
          ref = ref[key];
        }
      }
    }
  }

  // meta
  payload.updatedAt = new Date().toISOString();

  await db.collection('talebeler').doc(__AKTIF_ID).set(payload, { merge:true });
  __AKTIF_REC = payload;
  if(window.showToast) showToast('Kaydedildi.');
}

// ========= Fotoğraf Yükleme (Firebase Storage) =========
async function uploadPhotoToStorage(e){
  const f = e.target.files?.[0];
  const stat = document.getElementById('photoStatus');
  const prev = document.getElementById('photoPreview');
  if(!f){ return; }

  // basit doğrulama
  if(!/^image\//.test(f.type)){
    stat.textContent = 'Sadece resim dosyası yükleyin.'; return;
  }

  try{
    stat.textContent = 'Yükleniyor...';

    const ext  = (f.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `talebe-fotolar/${__AKTIF_ID}/${Date.now()}.${ext}`;

    const ref  = storage.ref().child(path);
    const task = ref.put(f, {
      contentType: f.type,
      cacheControl: 'public, max-age=3600'
    });

    task.on('state_changed',
      (snap)=>{
        // % ilerleme (isterseniz gösterin)
        const pct = Math.round((snap.bytesTransferred/snap.totalBytes)*100);
        stat.textContent = `Yükleniyor... %${pct}`;
      },
      (err)=>{
        console.error(err);
        stat.textContent = 'Yükleme başarısız.';
        showToast?.('Fotoğraf yükleme başarısız.');
      },
      async ()=>{
        const url = await ref.getDownloadURL();
        await db.collection('talebeler').doc(__AKTIF_ID)
          .set({ fotograf: url, updatedAt: new Date().toISOString() }, { merge:true });

        __AKTIF_REC.fotograf = url;
        if(prev) prev.src = url;

        // kart önizleme de güncellensin
        try{
          const card = document.querySelector(`.talebe-kart[data-id="${__AKTIF_ID}"]`);
          card?.querySelector('.talebe-foto')?.setAttribute('src', url);
        }catch(_){}

        stat.textContent = 'Yüklendi ✓';
        showToast?.('Fotoğraf güncellendi');
      }
    );
  }catch(err){
    console.error(err);
    stat.textContent = 'Yükleme hatası.';
  }
}

// ========= Eski API ile uyum (modal açılışı aynı kalsın) =========
async function yukleModalIcerik() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return alert("Talebe seçimi bulunamadı.");

  const snap = await db.collection("talebeler").doc(uid).get();
  if (!snap.exists) return alert("Talebe kaydı bulunamadı.");

  __AKTIF_ID  = uid;
  __AKTIF_REC = snap.data();

  // Varsayılan sekme: Görüntüle
  drawModal('view');
}
window.yukleModalIcerik = yukleModalIcerik;

// ========= Kapat & PDF =========
window.modalKapat = function () {
  const modal = document.getElementById("talebeModal");
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = "none"; // eski stil desteği
    document.body.style.overflow = "auto";
  }
};

window.pdfCiktisiAl = function () {
  const el = document.getElementById("pdfAlani");
  if(!el){ alert('PDF alanı bulunamadı'); return; }
  html2pdf().from(el).save("talebe.pdf");
};
