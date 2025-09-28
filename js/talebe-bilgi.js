// ../js/talebe-bilgi.js — yeni “devreli + alt dokümanlı” şema

function talebeBilgiFormuYukle() {
  // Başlat
  const db = window.db;
  const auth = window.auth;

  const kartAlani = document.getElementById("talebeKartAlani");
  if (!kartAlani) return;

  // ---- Yardımcılar ----
  const lower = s => (s==null?'':String(s)).trim().toLowerCase();
  const pick = (obj, keys) => { for (const k of keys) { if (obj && obj[k]!=null && String(obj[k]).trim()!=='') return obj[k]; } return ''; };
  const FIELD = {
    name: ['kullAd','adSoyad','ad','isim','fullName'],
    durum:['durum','status','tip'],
    kurs: ['kurs','geldigiKurs','kaynakKurs'],
    il:   ['il','memleket','sehir'],
    ulke: ['ulke','ülke','country'],
    foto: ['fotoURL','fotograf','photoURL']
  };
  const normStatus = s => {
    const t = lower(s);
    if (t.includes('ensar')) return 'Ensar';
    if (t.includes('muhacir') || t.includes('muhacır')) return 'Muhacir';
    return 'Diğer';
  };

  async function resolveStudentsSnapshot(devre){
    // önce ‘öğrenciler’, sonra ‘ogrenciler’
    for (const sub of ['öğrenciler','ogrenciler']) {
      try {
        const snap = await db.collection('talebeler').doc(devre).collection(sub).get();
        if (!snap.empty) return { sub, snap };
      } catch (_) {}
    }
    return { sub:'öğrenciler', snap:null };
  }
// tek yerden güvenli modal açıcı
function openTalebe(uid, devre){
  // modalı hemen aç + iskelet göster
  const modal = document.getElementById('talebeModal');
  const box   = document.getElementById('modalIcerik');
  if(modal){ modal.classList.add('open'); modal.style.display='flex'; document.body.style.overflow='hidden'; }
  if(box){
    box.innerHTML = `
      <div class="modal-tabs">
        <button class="tab-btn active" data-tab="view">Görüntüle</button>
        <button class="tab-btn" data-tab="edit">Düzenle</button>
        <button class="tab-btn" data-tab="photo">Fotoğraf</button>
      </div>
      <div class="modal-body">
        <div style="padding:12px;border:1px dashed var(--stroke);border-radius:12px">
          Yükleniyor…
        </div>
      </div>`;
  }
  // parametreli çağır (localStorage’a da yaz ama parametre öncelikli olacak)
  localStorage.setItem('aktifTalebeUID', uid);
  localStorage.setItem('aktifTalebeDevre', devre || (localStorage.getItem('kf_devre')||'6.Devre'));
  if(typeof window.yukleModalIcerik === 'function') window.yukleModalIcerik(uid, devre);
}
  async function enrichWithProfilIfNeeded(devre, sub, uid, baseData){
    const hasBasic = FIELD.name.some(k=>baseData?.[k]) && FIELD.durum.some(k=>baseData?.[k]);
    if (hasBasic) return baseData;
    // profil alt dokümanı dene
    try{
      const p = await db.collection('talebeler').doc(devre).collection(sub).doc(uid)
        .collection('bilgiler').doc('profil').get();
      if (p.exists) return { ...baseData, ...p.data() };
    }catch(_){}
    return baseData;
  }

  function sortCardsAZ(){
    const cards=[...kartAlani.children];
    cards.sort((a,b)=>{
      const an=(a.querySelector('.talebe-ad')?.textContent||'').trim();
      const bn=(b.querySelector('.talebe-ad')?.textContent||'').trim();
      return an.localeCompare(bn, 'tr');
    });
    cards.forEach(c=>kartAlani.appendChild(c));
  }

  async function loadForCurrentDevre(){
    const CURRENT_DEVRE = localStorage.getItem('kf_devre') || '6.Devre';
    kartAlani.innerHTML = '<div class="talebe-alt">Yükleniyor…</div>';

    // Alt koleksiyon bulun
    const { sub, snap } = await resolveStudentsSnapshot(CURRENT_DEVRE);
    if (!snap) {
      kartAlani.innerHTML = '<div class="talebe-alt">Bu devrede öğrenci bulunamadı.</div>';
      return;
    }

    kartAlani.innerHTML = '';
    let toplam=0, ensar=0, muhacir=0;
    const byKurs={}, byMem={};

    const docs = snap.docs;

    for (const ddoc of docs) {
      const uid = ddoc.id;
      let d = await enrichWithProfilIfNeeded(CURRENT_DEVRE, sub, uid, ddoc.data());

      const ad   = pick(d, FIELD.name) || 'İsimsiz';
      const foto = pick(d, FIELD.foto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad)}&background=random`;
      const durum= normStatus(pick(d, FIELD.durum));
      const kurs = pick(d, FIELD.kurs) || 'Belirtilmemiş';
      const il   = pick(d, FIELD.il)   || '';
      const ulke = pick(d, FIELD.ulke) || '';
      const mem  = (il && ulke) ? `${il} / ${ulke}` : (il || ulke || 'Belirtilmemiş');

      toplam++; if (durum==='Ensar') ensar++; else if (durum==='Muhacir') muhacir++;
      byKurs[kurs]=(byKurs[kurs]||0)+1;
      byMem[mem]=(byMem[mem]||0)+1;

      const card = document.createElement('div');
      card.className = 'talebe-kart';
      card.dataset.id = uid;
      card.dataset.devre = CURRENT_DEVRE;
      card.dataset.name = ad;
      card.innerHTML = `
        <img class="talebe-foto" src="${foto}" alt="" loading="lazy" width="52" height="52">
        <div class="talebe-info">
          <div class="talebe-ad">${ad}</div>
          <div class="talebe-alt">${kurs} • ${durum}</div>
        </div>
      `;
      card.addEventListener('click', ()=>{
        localStorage.setItem('aktifTalebeUID', uid);
        localStorage.setItem('aktifTalebeDevre', CURRENT_DEVRE);
        const modal = document.getElementById('talebeModal');
        if (modal){
          modal.classList.add('open');
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
        if (typeof window.yukleModalIcerik === 'function') window.yukleModalIcerik();
      });

      kartAlani.appendChild(card);
    }

    // A→Z
    sortCardsAZ();

    // İstatistik kutuları (varsa)
    const $top = document.getElementById("toplamSayisi");
    const $en  = document.getElementById("ensarSayisi");
    const $mu  = document.getElementById("muhacirSayisi");
    if ($top) $top.textContent = toplam;
    if ($en)  $en.textContent  = ensar;
    if ($mu)  $mu.textContent  = muhacir;

    // Özet kutularını sayfa içi script yönetiyor ise onlara dokunmuyoruz.
  }

  // Devre seçiciyi bağla (sayfada varsa)
  const sel = document.getElementById('selDevre');
  if (sel && !sel.__bound) {
    sel.__bound = true;
    sel.addEventListener('change', ()=>{
      localStorage.setItem('kf_devre', sel.value);
      loadForCurrentDevre();
    });
  }

  // Auth akışı
  if (auth?.currentUser) {
    loadForCurrentDevre();
  } else {
    auth.onAuthStateChanged(u=>{
      if (!u) { location.replace("../index.html"); return; }
      loadForCurrentDevre();
    });
  }
}
