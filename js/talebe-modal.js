/* ../js/talebe-modal.js — yeni şema tam uyum + A4 tek sayfa görünüm + eski kayıt fallback */

/* ===== Bağımlılıklar =====
   - window.db  (Firestore compat)
   - window.storage (Firebase Storage compat; firebase-init.js içinde set edilmiş olmalı)
   - html2pdf.js (sayfada yüklü)
*/

const db = window.db;
const storage = window.storage;

/* ===== Modal dış tıklama (kapat) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("talebeModal");
  if (!modal) return;
  window.addEventListener("click", (e) => { if (e.target === modal) modalKapat(); });
  window.addEventListener("keydown", (e)=>{ if(e.key==='Escape') modalKapat(); });
});

/* ===== Durum ===== */
let __AKTIF_ID = null;
let __AKTIF_DEVRE = null;
let __SUBCOL = 'öğrenciler'; // çalışma anında keşfediliyor
let __AKTIF_REC = null;

/* ===== Alan eşlemeleri (UI + kayıt) ===== */
const F = {
  // UI özet alanları
  ad: 'kullAd',
  durum: 'durum',
  kurs: 'kurs',
  foto: 'fotoURL',
  dogum: 'dogumTarihi',
  kan: 'kanGrubu',
  mezhep: 'mezhep',
  memIl: 'il',
  memUlke: 'ulke',
  tc: 'tc',
  ikamet: 'ikametDurumu',
  kimlikAd: 'kimlikAd',
  kimlikBitis: 'kimlikBitis',

  // alt doküman isimleri
  profil: 'profil',
  okul: 'okul',
  adres: 'adres',
  aile: 'aile',
  saglik: 'saglik',
  vazife: 'vazife',
};

const lower = s => (s==null?'':String(s)).trim().toLowerCase();
function fmtDateTR(iso){
  if(!iso || typeof iso!=='string' || !iso.includes('-')) return iso||'-';
  const [y,m,d] = iso.split('-'); return `${d}.${m}.${y}`;
}

/* ===== Firestore yol çözücü ===== */
async function resolveStudentDocRef(devre, uid){
  const base = db.collection('talebeler').doc(devre);
  for(const name of ['öğrenciler','ogrenciler']){
    try{
      const ref = base.collection(name).doc(uid);
      const ex  = await ref.get();
      if(ex.exists){ __SUBCOL = name; return ref; }
    }catch(_) {}
  }
  __SUBCOL = 'öğrenciler';
  return base.collection(__SUBCOL).doc(uid);
}
function fmtDateTime(v){
  if(!v) return '-';
  let dt = v;
  try{
    if (v?.toDate) dt = v.toDate();              // Firestore Timestamp
    else if (typeof v==='object' && 'seconds' in v) dt = new Date(v.seconds*1000);
    else if (typeof v==='string') dt = new Date(v);
  }catch(_){}
  if(!(dt instanceof Date) || isNaN(+dt)) return '-';
  return dt.toLocaleDateString('tr-TR')+' '+dt.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
}

/* ===== Kayıt + alt dokümanları oku/merge et ===== */
async function fetchStudentWithDetails(devre, uid){
  const ref = await resolveStudentDocRef(devre, uid);
  const snap = await ref.get();
  if(!snap.exists) return null;

  const core = snap.data() || {};
  const det = {};
  const parts = [F.profil, F.okul, F.adres, F.aile, F.saglik, F.vazife];

  await Promise.all(parts.map(async p=>{
    try{
      const s = await ref.collection('bilgiler').doc(p).get();
      if(s.exists) det[p] = s.data();
    }catch(_) {}
  }));

  const profil = det[F.profil] || {};

  // UI için tek objeye normalize (profil öncelikli)
  const merged = {
    ...core,
    [F.ad]:      core[F.ad]      ?? profil.kullAd ?? profil.kimlikAd ?? '',
    [F.kimlikAd]:core[F.kimlikAd]?? profil.kimlikAd ?? '',
    [F.durum]:   core[F.durum]   ?? profil.durum  ?? '',
    [F.kurs]:    core[F.kurs]    ?? profil.kurs   ?? '',
    [F.dogum]:   core[F.dogum]   ?? profil.dogumTarihi ?? '',
    [F.kan]:     core[F.kan]     ?? profil.kanGrubu ?? '',
    [F.mezhep]:  core[F.mezhep]  ?? profil.mezhep ?? '',
    [F.memIl]:   core[F.memIl]   ?? profil.il ?? '',
    [F.memUlke]: core[F.memUlke] ?? profil.ulke ?? '',
    [F.tc]:      core[F.tc]      ?? profil.tc ?? '',
    [F.ikamet]:  core[F.ikamet]  ?? profil.ikametDurumu ?? '',
    [F.kimlikBitis]: core[F.kimlikBitis] ?? profil.kimlikBitis ?? '',
    [F.foto]:    core[F.foto]    ?? profil.fotoURL ?? '',

    [F.okul]:   det[F.okul]   || core[F.okul]   || {},
    [F.adres]:  det[F.adres]  || core[F.adres]  || {},
    [F.aile]:   det[F.aile]   || core[F.aile]   || {},
    [F.saglik]: det[F.saglik] || core[F.saglik] || {},
    [F.vazife]: det[F.vazife] || core[F.vazife] || {},
  };

  return { ref, data: merged };
}

/* ====== TEMPLATE: Sekmeler ====== */
function tplTabs(active='view'){
  return `
  <div class="modal-tabs">
    <button class="tab-btn ${active==='view'?'active':''}"  data-tab="view">Görüntüle</button>
    <button class="tab-btn ${active==='edit'?'active':''}"  data-tab="edit">Düzenle</button>
    <button class="tab-btn ${active==='photo'?'active':''}" data-tab="photo">Fotoğraf</button>
  </div>`;
}

/* ====== TEMPLATE: VIEW (A4 tek sayfa) ====== */
function tplView(rec){
  const d = rec || {};
  const adres  = d[F.adres]  || {};
  const okul   = d[F.okul]   || {};
  const aile   = d[F.aile]   || {};
  const saglik = d[F.saglik] || {};
  const vazife = d[F.vazife] || {};

  const foto  = d[F.foto] || `https://ui-avatars.com/api/?name=${encodeURIComponent(d[F.ad]||'Talebe')}&background=random`;
  const dogum = fmtDateTR(d[F.dogum]);
  const kimlikBitis = fmtDateTR(d[F.kimlikBitis]);
  const nowStr = fmtDateTime(new Date());
  const createdStr = fmtDateTime(d.__createdAt);
  const updatedStr = fmtDateTime(d.__updatedAt);

  const mezhepler = ["Hanefi","Şafi","Maliki","Hanbeli"];
  const mezhepBtns = mezhepler.map(m=>`<div class="mezhep-btn${d[F.mezhep]===m?' aktif':''}">${m}</div>`).join("");

  return `
  <div class="modal-body">
<style>
  .sayfa{ width:794px; max-width:100%; margin:20px auto; background:#fff; color:#000;
          padding:22px 26px; border:1px solid #e5e7eb; border-radius:8px; box-sizing:border-box }
  .tight *{ line-height:1.25 }
  .baslik{display:flex;justify-content:space-between;align-items:center;gap:14px}
  .baslik-sag{width:96px;height:96px;border-radius:10px;overflow:hidden;background:#e5e7eb;display:flex;align-items:center;justify-content:center}
  .baslik-sag img{width:100%;height:100%;object-fit:cover}
  .isim{font-size:22px;font-weight:800;margin:14px 0 6px}
  .row{display:flex;gap:10px;margin:8px 0;flex-wrap:wrap}
  .etiketli{flex:1 1 250px}
  .etiketli label{font-size:12px;font-weight:700;margin-bottom:4px;display:block;color:#374151}
  .kutu{background:#f8fafc;border:1px solid #e5e7eb;padding:6px 8px;font-size:13px;min-height:28px;font-weight:600;border-radius:8px}
  .bolum-baslik{display:flex;align-items:center;background:#1f2937;color:#fff;margin:14px 0 8px;padding:6px 10px;font-size:13px;font-weight:800;border-radius:8px}
  .bolum-harf{background:#ef4444;padding:3px 8px;margin-right:8px;border-radius:6px;font-weight:800}
  .mezhep-btnlar{display:flex;gap:6px;margin-top:2px;flex-wrap:wrap}
  .mezhep-btn{border:1px solid #e5e7eb;padding:4px 8px;border-radius:8px;font-size:12px;background:#fff}
  .mezhep-btn.aktif{background:#e0f2fe;border-color:#93c5fd}

  /* Bölüm bloklarını asla bölme (başlık + içerik birlikte kalsın) */
  .sec{ break-inside: avoid; page-break-inside: avoid; }
  .aile-tab{width:100%; border-collapse:collapse; font-size:13px}
  .aile-tab th, .aile-tab td{border:1px solid #e5e7eb; padding:6px 8px; text-align:left}
  .aile-tab th{background:#f3f4f6; font-weight:800}
  .pdf-footer{font-size:10px;color:#6b7280;margin-top:8px;text-align:right}

  /* Yazdırma / PDF */
  @page { size: A4; margin: 10mm; }
  @media print{
    :root{ color-scheme: light }
    .sayfa{ width:auto; margin:0; border:none; border-radius:0; box-shadow:none; padding:0 }
    *{ -webkit-print-color-adjust: exact; print-color-adjust: exact }
    .pdf-footer{ position: fixed; bottom: 8mm; right: 10mm; left: 10mm; }
  }
</style>

    <div class="modal-pdf tight">
      <div class="sayfa" id="pdfAlani">
        <!-- ÜST BAŞLIK -->
        <div class="baslik">
          <div class="baslik-sol">
            <h1 style="font-size:16px;margin:0 0 2px">KARAAĞAÇ FATİH DAİMİ TEKÂMÜLALTI</h1>
            <h2 style="font-size:12px;margin:0;font-weight:600">Eğitim Yılı | ${__AKTIF_DEVRE}</h2>
          </div>
          <div class="baslik-sag">
            <img
              id="pdfFoto"
              src="${foto}"
              alt=""
              width="96" height="96"
              style="width:100%;height:100%;object-fit:cover;border-radius:10px"
              loading="eager"
            >
          </div>
        </div>

        <div class="isim">${d[F.ad]||'-'}</div>
        <div class="row">
          <div class="etiketli"><label>Geldiği Kurs</label><div class="kutu">${d[F.kurs]||'-'}</div></div>
          <div class="etiketli"><label>Durum</label><div class="kutu">${d[F.durum]||'-'}</div></div>
        </div>

        <!-- A -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">A</div>TALEBE BİLGİLERİ</div>
          <div class="row">
            <div class="etiketli"><label>Kimlikteki Ad</label><div class="kutu">${d[F.kimlikAd]||'-'}</div></div>
            <div class="etiketli"><label>Doğum Tarihi</label><div class="kutu">${dogum}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Kan Grubu</label><div class="kutu">${d[F.kan]||'-'}</div></div>
            <div class="etiketli"><label>Mezhep</label><div class="mezhep-btnlar">${mezhepBtns}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Memleket (İl)</label><div class="kutu">${d[F.memIl]||'-'}</div></div>
            <div class="etiketli"><label>Memleket (Ülke)</label><div class="kutu">${d[F.memUlke]||'-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>TC (Ensar)</label><div class="kutu">${d[F.tc]||'-'}</div></div>
            <div class="etiketli"><label>İkamet Durumu (Muhacir)</label><div class="kutu">${d[F.ikamet]||'-'}${d[F.kimlikBitis]?(' — Bitiş: '+kimlikBitis):''}</div></div>
          </div>
        </section>

        <!-- B -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">B</div>OKUL BİLGİLERİ</div>
          <div class="row">
            <div class="etiketli"><label>Öğrenim Seviyesi</label><div class="kutu">${okul.ogrenimSeviyesi||'-'}</div></div>
            <div class="etiketli"><label>Mezuniyet Durumu</label><div class="kutu">${okul.mezuniyetDurumu||'-'}</div></div>
            <div class="etiketli"><label>Eğitim Türü</label><div class="kutu">${okul.egitimTuru||'-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Üniversite Türü</label><div class="kutu">${okul.universiteTuru||'-'}</div></div>
            <div class="etiketli"><label>Üniversite Adı</label><div class="kutu">${okul.universiteAdi||'-'}</div></div>
          </div>
          <div class="row">
            <div class="etiketli"><label>Bölüm</label><div class="kutu">${okul.bolum||'-'}</div></div>
            <div class="etiketli"><label>Sınıf</label><div class="kutu">${okul.uniSinif||'-'}</div></div>
          </div>
        </section>

        <!-- C -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">C</div>ADRES BİLGİLERİ</div>
          <div class="row"><div class="etiketli"><label>İl / İlçe / Mahalle</label>
            <div class="kutu">${adres.adresIl||'-'} / ${adres.adresIlce||'-'} / ${adres.adresMahalle||'-'}</div>
          </div></div>
          <div class="row"><div class="etiketli"><label>Açık Adres</label><div class="kutu">${adres.adresAcik||'-'}</div></div></div>
        </section>

        <!-- D -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">D</div>AİLE</div>
          <table class="aile-tab">
            <thead><tr><th>Yakın</th><th>Ad</th><th>Tel</th><th>Durum</th><th>Meslek</th></tr></thead>
            <tbody>
              <tr><td><strong>Baba</strong></td><td>${aile.babaAd||'-'}</td><td>${aile.babaTel||'-'}</td><td>${aile.babaDurum||'-'}</td><td>${aile.babaMeslek||'-'}</td></tr>
              <tr><td><strong>Anne</strong></td><td>${aile.anneAd||'-'}</td><td>${aile.anneTel||'-'}</td><td>${aile.anneDurum||'-'}</td><td>${aile.anneMeslek||'-'}</td></tr>
            </tbody>
          </table>
          <div class="row">
            <div class="etiketli"><label>Maddi Durum</label><div class="kutu">${aile.maddiDurum||'-'}</div></div>
            <div class="etiketli"><label>Kardeş Sayısı</label><div class="kutu">${(aile.kardesSayisi??'-')}</div></div>
            <div class="etiketli"><label>Kursta Okuyan Kardeş</label><div class="kutu">${(aile.kurstakiKardesSayisi??'-')}</div></div>
          </div>
        </section>

        <!-- E -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">E</div>SAĞLIK</div>
          <div class="row"><div class="etiketli"><label>Not</label><div class="kutu">${saglik.saglikNot || '-'}</div></div></div>
        </section>

        <!-- F -->
        <section class="sec">
          <div class="bolum-baslik"><div class="bolum-harf">F</div>VAZİFE</div>
          <div class="row"><div class="etiketli"><label>Vazifeler</label><div class="kutu">${(vazife.vazifeler||[]).join(', ')||'-'}</div></div></div>
          <div class="row"><div class="etiketli"><label>Cuma Kıldırabilir?</label><div class="kutu">${vazife.cumaKilabilir||'-'}</div></div></div>
        </section>

        <!-- ALT BİLGİ -->
        <div class="pdf-footer">
          Kayıt: <b>${createdStr}</b> • Güncelleme: <b>${updatedStr}</b> • İndirme: <b>${nowStr}</b>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" onclick="modalKapat()">Kapat</button>
        <button type="button" onclick="pdfCiktisiAl()">PDF Çıktı Al</button>
      </div>
    </div>
  </div>`;
}

/* ====== TEMPLATE: EDIT ====== */
function tplEdit(rec){
  const d = rec || {};
  const adres  = d[F.adres]  || {};
  const okul   = d[F.okul]   || {};
  const aile   = d[F.aile]   || {};
  const saglik = d[F.saglik] || {};
  const vazife = d[F.vazife] || {};

  return `
  <form id="editForm" class="modal-body">
    <div class="form-grid">
      <!-- PROFIL -->
      <div class="fld"><label>Ad Soyad (kullAd)</label><input name="profil.kullAd" value="${d[F.ad]||''}"></div>
      <div class="fld"><label>Kimlikteki Ad</label><input name="profil.kimlikAd" value="${d[F.kimlikAd]||''}"></div>
      <div class="fld"><label>Durum</label>
        <select name="profil.durum">
          ${['Ensar','Muhacir','Diğer'].map(v=>`<option ${d[F.durum]===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="fld"><label>Kurs</label><input name="profil.kurs" value="${d[F.kurs]||''}"></div>
      <div class="fld"><label>Doğum Tarihi</label><input type="date" name="profil.dogumTarihi" value="${(d[F.dogum]||'').slice(0,10)}"></div>
      <div class="fld"><label>Mezhep</label>
        <select name="profil.mezhep">
          ${['Hanefi','Şafi','Hanbeli','Maliki'].map(v=>`<option ${d[F.mezhep]===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="fld"><label>Kan Grubu</label><input name="profil.kanGrubu" value="${d[F.kan]||''}" placeholder="A+, 0-, ..."></div>
      <div class="fld"><label>Memleket İl</label><input name="profil.il" value="${d[F.memIl]||''}"></div>
      <div class="fld"><label>Memleket Ülke</label><input name="profil.ulke" value="${d[F.memUlke]||''}"></div>
      <div class="fld"><label>İkamet Durumu</label>
        <select name="profil.ikametDurumu">
          ${['','Var','Yok'].map(v=>`<option ${String(d[F.ikamet]||'')===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="fld"><label>Kimlik Bitiş (Muhacir)</label><input type="date" name="profil.kimlikBitis" value="${(d[F.kimlikBitis]||'').slice(0,10)}"></div>
      <div class="fld"><label>TC (Ensar)</label><input name="profil.tc" value="${d[F.tc]||''}" inputmode="numeric"></div>

      <!-- ADRES -->
      <div class="fld"><label>Adres İl</label><input name="adres.adresIl" value="${adres.adresIl||''}"></div>
      <div class="fld"><label>Adres İlçe</label><input name="adres.adresIlce" value="${adres.adresIlce||''}"></div>
      <div class="fld"><label>Adres Mahalle</label><input name="adres.adresMahalle" value="${adres.adresMahalle||''}"></div>
      <div class="fld" style="grid-column:1/-1"><label>Açık Adres</label><input name="adres.adresAcik" value="${adres.adresAcik||''}"></div>

      <!-- OKUL -->
      <div class="fld"><label>Öğrenim Seviyesi</label><input name="okul.ogrenimSeviyesi" value="${okul.ogrenimSeviyesi||''}"></div>
      <div class="fld"><label>Mezuniyet Durumu</label><input name="okul.mezuniyetDurumu" value="${okul.mezuniyetDurumu||''}"></div>
      <div class="fld"><label>Eğitim Türü</label><input name="okul.egitimTuru" value="${okul.egitimTuru||''}"></div>
      <div class="fld"><label>Üniversite Türü</label><input name="okul.universiteTuru" value="${okul.universiteTuru||''}"></div>
      <div class="fld"><label>Üniversite Adı</label><input name="okul.universiteAdi" value="${okul.universiteAdi||''}"></div>
      <div class="fld"><label>Bölüm</label><input name="okul.bolum" value="${okul.bolum||''}"></div>
      <div class="fld"><label>Sınıf</label><input name="okul.uniSinif" value="${okul.uniSinif||''}"></div>

      <!-- AİLE -->
      <div class="fld"><label>Baba Ad</label><input name="aile.babaAd" value="${aile.babaAd||''}"></div>
      <div class="fld"><label>Baba Tel</label><input name="aile.babaTel" value="${aile.babaTel||''}" inputmode="tel"></div>
      <div class="fld"><label>Baba Durum</label><input name="aile.babaDurum" value="${aile.babaDurum||''}"></div>
      <div class="fld"><label>Baba Meslek</label><input name="aile.babaMeslek" value="${aile.babaMeslek||''}"></div>
      <div class="fld"><label>Anne Ad</label><input name="aile.anneAd" value="${aile.anneAd||''}"></div>
      <div class="fld"><label>Anne Tel</label><input name="aile.anneTel" value="${aile.anneTel||''}" inputmode="tel"></div>
      <div class="fld"><label>Anne Durum</label><input name="aile.anneDurum" value="${aile.anneDurum||''}"></div>
      <div class="fld"><label>Anne Meslek</label><input name="aile.anneMeslek" value="${aile.anneMeslek||''}"></div>
      <div class="fld"><label>Maddi Durum</label><input name="aile.maddiDurum" value="${aile.maddiDurum||''}"></div>
      <div class="fld"><label>Kardeş Sayısı</label><input name="aile.kardesSayisi" value="${aile.kardesSayisi??''}" inputmode="numeric"></div>
      <div class="fld"><label>Kursta Kardeş</label><input name="aile.kurstakiKardesSayisi" value="${aile.kurstakiKardesSayisi??''}" inputmode="numeric"></div>

      <!-- SAĞLIK -->
      <div class="fld" style="grid-column:1/-1"><label>Sağlık Notu</label><textarea name="saglik.saglikNot">${saglik.saglikNot||''}</textarea></div>

      <!-- VAZİFE -->
      <div class="fld"><label>Vazifeler (virgülle)</label><input name="vazife.vazifeler" value="${Array.isArray(vazife.vazifeler)?vazife.vazifeler.join(', '):(vazife.vazifeler||'')}"></div>
      <div class="fld"><label>Diğer (Vazife)</label><input name="vazife.diger" value="${vazife.diger||''}"></div>
      <div class="fld"><label>Cuma Kıldırabilir?</label>
        <select name="vazife.cumaKilabilir">
          ${['','Evet','Hayır'].map(v=>`<option ${String(vazife.cumaKilabilir||'')===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-ghost" data-act="close">Kapat</button>
      <button type="submit" class="btn-primary">Kaydet</button>
    </div>
  </form>`;
}

/* ====== TEMPLATE: PHOTO ====== */
function tplPhoto(rec){
  const foto = rec?.[F.foto] || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec?.[F.ad]||'Talebe')}&background=random`;
  return `
  <div class="modal-body">
    <div class="view-head" style="display:flex;gap:12px;align-items:center">
      <img class="view-photo" id="photoPreview" src="${foto}" alt="" loading="lazy" width="84" height="84" style="border-radius:12px;border:1px solid var(--stroke)">
      <div>
        <div class="view-name" style="font-weight:900;font-size:18px">${rec?.[F.ad]||'-'}</div>
        <div class="talebe-alt">Fotoğraf yükle/değiştir</div>
      </div>
    </div>
    <div class="view-kutu" style="margin-top:10px;border:1px solid var(--stroke);border-radius:12px;padding:10px;background:var(--surface)">
      <input type="file" id="photoFile" accept="image/*">
      <div id="photoStatus" class="talebe-alt" style="margin-top:6px"></div>
    </div>
    <div class="modal-actions"><button class="btn-ghost" data-act="close">Kapat</button></div>
  </div>`;
}

/* ===== Modal çiz + olay bağla ===== */
function drawModal(active='view'){
  const c = document.getElementById('modalIcerik'); if(!c) return;
  c.innerHTML = `${tplTabs(active)}${active==='view'?tplView(__AKTIF_REC):active==='edit'?tplEdit(__AKTIF_REC):tplPhoto(__AKTIF_REC)}`;

  c.querySelectorAll('.tab-btn').forEach(b=> b.addEventListener('click', ()=>drawModal(b.dataset.tab)));
  c.querySelector('[data-act="close"]')?.addEventListener('click', modalKapat);

  const form = document.getElementById('editForm');
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    await kaydetForm(new FormData(form));
    drawModal('view');
  });

  if(active==='photo'){
    document.getElementById('photoFile')?.addEventListener('change', uploadPhotoToStorage);
  }
}

/* ===== Dış API: Modal yükle ===== */
// ÇAKIŞMA ÖNLEYİCİ
let __LOAD_TOKEN = 0;

async function yukleModalIcerik(pUid, pDevre){
  const box = document.getElementById('modalIcerik');
  const token = ++__LOAD_TOKEN;

  const uid   = pUid   || localStorage.getItem('aktifTalebeUID');
  const devre = pDevre || localStorage.getItem('aktifTalebeDevre') || localStorage.getItem('kf_devre') || '6.Devre';
  if(!uid){ alert('Talebe seçimi bulunamadı.'); return; }

  // Loader
  if(box){
    box.innerHTML = `
      <div class="modal-tabs">
        <button class="tab-btn active" data-tab="view">Görüntüle</button>
        <button class="tab-btn" data-tab="edit">Düzenle</button>
        <button class="tab-btn" data-tab="photo">Fotoğraf</button>
      </div>
      <div class="modal-body">
        <div style="padding:12px;border:1px dashed var(--stroke);border-radius:12px">Veriler getiriliyor…</div>
      </div>`;
  }

  // ---- 1) Yeni şema
  async function tryNewSchema(){
    const base = db.collection('talebeler').doc(devre);
    for(const sub of ['öğrenciler','ogrenciler']){
      try{
        const doc = await base.collection(sub).doc(uid).get();
        if(doc.exists){
          const subNames = [F.profil,F.okul,F.adres,F.aile,F.saglik,F.vazife];
          const det = {};
          await Promise.all(subNames.map(async n=>{
            try{ const s = await base.collection(sub).doc(uid).collection('bilgiler').doc(n).get();
                 if(s.exists) det[n]=s.data(); }catch(_){}
          }));
          return { core: doc.data(), det };
        }
      }catch(_){}
    }
    return null;
  }

  // ---- 2) Eski şema (farklı koleksiyon adları)
  async function tryOldSchema(){
    const CANDS = ['talebeler','talebe_kayit','talebeKayit','talebe_kayitlari','talebe_index'];
    for(const col of CANDS){
      try{
        const doc = await db.collection(col).doc(uid).get();
        if(doc.exists) return { core: doc.data(), det:{} };
      }catch(_){}
    }
    return null;
  }

  let packed = await tryNewSchema();
  if(!packed) packed = await tryOldSchema();
  if(token !== __LOAD_TOKEN) return;

  if(!packed){
    const body = box?.querySelector('.modal-body');
    if(body) body.innerHTML = `<div class="talebe-alt">Kayıt bulunamadı.</div>`;
    return;
  }

  // Merge
  const prof = packed.det.profil || {};
  __AKTIF_ID    = uid;
  __AKTIF_DEVRE = devre;
  __AKTIF_REC   = {
    ...(packed.core||{}),
    [F.ad]:      (packed.core||{})[F.ad]      ?? prof.kullAd ?? prof.kimlikAd ?? '',
    [F.kimlikAd]:(packed.core||{})[F.kimlikAd]?? prof.kimlikAd ?? '',
    [F.durum]:   (packed.core||{})[F.durum]   ?? prof.durum ?? '',
    [F.kurs]:    (packed.core||{})[F.kurs]    ?? prof.kurs ?? '',
    [F.dogum]:   (packed.core||{})[F.dogum]   ?? prof.dogumTarihi ?? '',
    [F.kan]:     (packed.core||{})[F.kan]     ?? prof.kanGrubu ?? '',
    [F.mezhep]:  (packed.core||{})[F.mezhep]  ?? prof.mezhep ?? '',
    [F.memIl]:   (packed.core||{})[F.memIl]   ?? prof.il ?? '',
    [F.memUlke]: (packed.core||{})[F.memUlke] ?? prof.ulke ?? '',
    [F.tc]:      (packed.core||{})[F.tc]      ?? prof.tc ?? '',
    [F.ikamet]:  (packed.core||{})[F.ikamet]  ?? prof.ikametDurumu ?? '',
    [F.kimlikBitis]:(packed.core||{})[F.kimlikBitis] ?? prof.kimlikBitis ?? '',
    [F.foto]:    (packed.core||{})[F.foto]    ?? prof.fotoURL ?? '',
    [F.okul]:   packed.det.okul   || (packed.core||{})[F.okul]   || {},
    [F.adres]:  packed.det.adres  || (packed.core||{})[F.adres]  || {},
    [F.aile]:   packed.det.aile   || (packed.core||{})[F.aile]   || {},
    [F.saglik]: packed.det.saglik || (packed.core||{})[F.saglik] || {},
    [F.vazife]: packed.det.vazife || (packed.core||{})[F.vazife] || {}
  };

  __AKTIF_REC.__createdAt = prof.createdAt || (packed.core||{}).createdAt || null;
  __AKTIF_REC.__updatedAt = prof.updatedAt || (packed.core||{}).updatedAt || null;
  __AKTIF_REC.__fotoDataURL = prof.fotoDataURL || null;   // <<< ekle

  if(token !== __LOAD_TOKEN) return;
  drawModal('view');
}
window.yukleModalIcerik = yukleModalIcerik;

/* ===== Kaydet (yeni şema altına yazar + özet alanları köke işler) ===== */
async function kaydetForm(fd){
  const chunks = { profil:{}, okul:{}, adres:{}, aile:{}, saglik:{}, vazife:{} };
  const rootPayload = {}; // özet alanlar (liste hızlı açılış)

  for(const [k,v0] of fd.entries()){
    const v = String(v0).trim();
    if(k.includes('.')){
      const [grp, ...rest] = k.split('.');
      const key = rest.join('.');
      if(grp in chunks){
        if(grp==='vazife' && key==='vazifeler'){
          chunks.vazife.vazifeler = v ? v.split(',').map(s=>s.trim()).filter(Boolean) : [];
        }else{
          chunks[grp][key] = v;
        }
      }
    }else{
      rootPayload[k]=v; // köke serbest
    }
  }

  // Özet alanlar (kök)
  const p = chunks.profil;
  if(p.kullAd)       rootPayload[F.ad] = p.kullAd;
  if(p.kimlikAd)     rootPayload[F.kimlikAd] = p.kimlikAd;
  if(p.kurs)         rootPayload[F.kurs] = p.kurs;
  if(p.durum)        rootPayload[F.durum] = p.durum;
  if(p.dogumTarihi)  rootPayload[F.dogum] = p.dogumTarihi;
  if(p.kanGrubu)     rootPayload[F.kan] = p.kanGrubu;
  if(p.mezhep)       rootPayload[F.mezhep] = p.mezhep;
  if(p.il)           rootPayload[F.memIl] = p.il;
  if(p.ulke)         rootPayload[F.memUlke] = p.ulke;
  if(p.tc)           rootPayload[F.tc] = p.tc;
  if(p.ikametDurumu) rootPayload[F.ikamet] = p.ikametDurumu;
  if(p.kimlikBitis)  rootPayload[F.kimlikBitis] = p.kimlikBitis;

  const ref = await resolveStudentDocRef(__AKTIF_DEVRE, __AKTIF_ID);

  // kök: özet
  if(Object.keys(rootPayload).length){
    await ref.set({ ...rootPayload, updatedAt: new Date() }, { merge:true });
  }

  // alt dokümanlar
  await Promise.all(Object.entries(chunks).map(([name, data])=>{
    if(!Object.keys(data).length) return Promise.resolve();
    return ref.collection('bilgiler').doc(name).set({ ...data, updatedAt:new Date() }, { merge:true });
  }));

  // Bellek & kart başlığı senkron
  __AKTIF_REC = {
    ...__AKTIF_REC,
    ...rootPayload,
    [F.profil]: { ...(__AKTIF_REC[F.profil]||{}), ...(chunks.profil||{}) },
    [F.okul]:   { ...(__AKTIF_REC[F.okul]||{}),   ...(chunks.okul||{}) },
    [F.adres]:  { ...(__AKTIF_REC[F.adres]||{}),  ...(chunks.adres||{}) },
    [F.aile]:   { ...(__AKTIF_REC[F.aile]||{}),   ...(chunks.aile||{}) },
    [F.saglik]: { ...(__AKTIF_REC[F.saglik]||{}), ...(chunks.saglik||{}) },
    [F.vazife]: { ...(__AKTIF_REC[F.vazife]||{}), ...(chunks.vazife||{}) },
  };

  try{
    const card = document.querySelector(`.talebe-kart[data-id="${__AKTIF_ID}"]`);
    if(card){
      card.querySelector('.talebe-ad')?.replaceChildren(document.createTextNode(__AKTIF_REC[F.ad]||'İsimsiz'));
      const alt = `${__AKTIF_REC[F.kurs]||'-'} • ${__AKTIF_REC[F.durum]||'-'}`;
      card.querySelector('.talebe-alt')?.replaceChildren(document.createTextNode(alt));
    }
  }catch(_) {}
}

/* ===== Fotoğraf yükleme (Storage) ===== */
async function uploadPhotoToStorage(e){
  const f = e.target.files?.[0];
  const stat = document.getElementById('photoStatus');
  const prev = document.getElementById('photoPreview');
  if(!f){ return; }
  if(!/^image\//.test(f.type)){ if(stat) stat.textContent='Sadece resim dosyası yükleyin.'; return; }

  const ext  = (f.name.split('.').pop()||'jpg').toLowerCase();
  const path = `talebe-fotolar/${__AKTIF_ID}/profil.${ext}`;

  const refS = storage.ref().child(path);
  const task = refS.put(f, { contentType:f.type, cacheControl:'public, max-age=3600' });

  task.on('state_changed',
    (s)=>{ const p=Math.round(s.bytesTransferred*100/s.totalBytes); if(stat) stat.textContent=`Yükleniyor… %${p}`; },
    (err)=>{ console.error(err); if(stat) stat.textContent='Yükleme hatası.'; },
    async ()=>{
      const url = await refS.getDownloadURL();
      const docRef = await resolveStudentDocRef(__AKTIF_DEVRE, __AKTIF_ID);
      await Promise.all([
        docRef.collection('bilgiler').doc(F.profil).set({ fotoURL:url, fotoPath:path, updatedAt:new Date() }, { merge:true }),
        docRef.set({ [F.foto]:url, updatedAt:new Date() }, { merge:true })
      ]);
      __AKTIF_REC[F.foto] = url;
      if(prev) prev.src = url;
      try{
        document.querySelector(`.talebe-kart[data-id="${__AKTIF_ID}"]`)?.querySelector('.talebe-foto')?.setAttribute('src', url);
      }catch(_){}
      if(stat) stat.textContent='Yüklendi ✓';
      // ...url alındıktan ve Firestore'a yazıldıktan hemen sonra:
      // Yükleme başarılı olduktan hemen sonra:
      const toDataURL = (file) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const max = 512; // PDF için yeter, dosya boyutu küçük kalır
          const w = img.naturalWidth || max, h = img.naturalHeight || max;
          const scale = Math.min(1, max / Math.max(w, h));
          const cw = Math.round(w * scale), ch = Math.round(h * scale);
          const c = document.createElement('canvas'); c.width = cw; c.height = ch;
          c.getContext('2d').drawImage(img, 0, 0, cw, ch);
          resolve(c.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => reject(new Error('img load error'));
        const objUrl = URL.createObjectURL(file);
        img.src = objUrl;
      });

      const dataUrl = await toDataURL(f);
      await docRef.collection('bilgiler').doc(F.profil)
        .set({ fotoDataURL: dataUrl, updatedAt:new Date() }, { merge:true });
      __AKTIF_REC.__fotoDataURL = dataUrl;

    }
  );
}

/* ===== Kapat & PDF ===== */
window.modalKapat = function(){
  const modal = document.getElementById('talebeModal');
  if(modal){
    modal.classList.remove('open');
    // display:none vermiyoruz; sınıf yönetimi yeterli (taşmaların önüne geçer)
  }
};
// CORS vermezse yedek: isimden monogram avatar üret
// Monogram (en son çare)
function makeInitialsDataURL(name='Talebe', size=200){
  const parts = String(name).trim().split(/\s+/);
  const initials = (parts[0]?.[0]||'') + (parts[1]?.[0]||'');
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e5efff'; ctx.fillRect(0,0,size,size);
  ctx.fillStyle = '#bfd3ff'; ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0b5ea8';
  ctx.font = Math.round(size*0.42)+'px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(initials.toUpperCase(), size/2, size/2+size*0.02);
  return c.toDataURL('image/png');
}

async function preparePdfImages(){
  const img = document.getElementById('pdfFoto');
  if(!img) return;

  // 0) kayıtlı dataURL varsa direkt onu bas
  if(__AKTIF_REC?.__fotoDataURL){
    img.src = __AKTIF_REC.__fotoDataURL;
    return;
  }

  // data:/blob: ise zaten güvenli
  if(!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) return;

  const src = img.src;
  // 1) fetch -> blob -> blobURL
  try{
    const res = await fetch(src, { mode: 'cors', cache: 'no-store' });
    if(!res.ok) throw new Error('http '+res.status);
    const blob = await res.blob();
    img.setAttribute('data-src-original', src);
    img.src = URL.createObjectURL(blob);
    return;
  }catch(e){}

  // 2) crossOrigin image -> canvas -> dataURL
  try{
    await new Promise((resolve, reject)=>{
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.referrerPolicy = 'no-referrer';
      im.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = im.naturalWidth || 256; c.height = im.naturalHeight || 256;
        c.getContext('2d').drawImage(im,0,0);
        img.setAttribute('data-src-original', src);
        img.src = c.toDataURL('image/jpeg', 0.95);
        resolve();
      };
      im.onerror = ()=>reject(new Error('img load error'));
      im.src = src + (src.includes('?')?'&':'?') + 'cb=' + Date.now();
    });
    return;
  }catch(e){}

  // 3) monogram fallback
  img.src = makeInitialsDataURL(__AKTIF_REC?.[F.ad] || 'Talebe', 220);
}

window.pdfCiktisiAl = async function(){
  const el = document.getElementById('pdfAlani');
  if(!el) return alert('PDF alanı bulunamadı');

  await preparePdfImages(); // <<< foto PDF’te görünmesi için

  const ad = (__AKTIF_REC?.[F.ad] || 'Talebe').replace(/[\\/:*?"<>|]/g,'-').trim();
  const devre = (__AKTIF_DEVRE || 'Devre').replace(/[\\/:*?"<>|]/g,'-').trim();
  const filename = `${devre} - ${ad}.pdf`;

  const opt = {
    margin: [10,10,10,10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0, scrollY: 0
    },
    pagebreak: { mode: ['css','legacy'] },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(el).save();
};


