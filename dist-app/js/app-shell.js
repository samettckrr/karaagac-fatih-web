/* Karaağaç Fatih — NAV SHELL (sadece üst bar + alt tabbar)
   Gereken HTML id'leri: adSoyad, gun, tarih, temaYazi, tabRail, panelSheet, sheetList, sheetTitle, sheetBackdrop
   Gereken koleksiyonlar:
     - kullanicilar/{uid}.yetkiler   -> ["Personel: İzinler", "Muhasebe: Alacaklar", ...]
     - sayfa_manifesti/{Panel}       -> { pages:[{key,title,path,order}] }
*/

;(function(){
  const ALL_PANELS = ["Talebe","Personel","Nehari","Kermes","Muhasebe","Ayarlar","Admin"];
  const ICONS = {Talebe:"👨‍🎓",Personel:"👥",Nehari:"📚",Kermes:"🧺",Muhasebe:"📊",Ayarlar:"⚙️",Admin:"🛡️",Home:"🏠"};

  const PANEL_ALIAS = {"Sistem Ayarları":"Ayarlar","Sistem Ayarlari":"Ayarlar","Sistem Ayarları ":"Ayarlar"};
  const normPanelName = (x)=> PANEL_ALIAS[(x||'').trim()] || (x||'').trim();

  const db   = window.db || (firebase && firebase.firestore && firebase.firestore());
  const auth = firebase.auth();

  // ---------- küçük yardımcılar ----------
  const $  = (id)=> document.getElementById(id);
  function trHeaderDate(d=new Date()){
    const daysShort = ['Pzt','Sal','Çar','Per','Cum','Cts','Paz'];
    const idx = (d.getDay()+6)%7;
    return {
      gun: daysShort[idx],
      tarih: d.toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'}).replace(/\./g,'')
    };
  }
  function themeLabel(){
    const pref = (localStorage.getItem('temaModu')||'oto').toLowerCase();
    if(pref==='acik') return 'Açık';
    if(pref==='koyu') return 'Koyu';
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'Koyu' : 'Oto';
  }
  function setThemeFrom(pref){
    const root = document.documentElement;
    if(pref==='koyu') root.classList.add('dark');
    else if(pref==='acik') root.classList.remove('dark');
    else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    try{ localStorage.setItem('temaModu', pref) }catch{}
    const t = $('temaYazi'); if(t) t.textContent = (pref==='oto'?'Oto':pref==='acik'?'Açık':'Koyu');
  }

  // ---------- manifest & yetki ----------
  async function loadUserDoc(uid){
    const doc = await db.collection('kullanicilar').doc(uid).get();
    return doc.exists ? doc.data() : {};
  }
  async function loadManifest(){
    const out={};
    const snap = await db.collection('sayfa_manifesti').get();
    for(const d of snap.docs){
      const name = normPanelName(d.id);
      const data = d.data()||{};
      const pages = Array.isArray(data.pages) ? data.pages : [];
      out[name] = pages.map(p=>{
        const key=(p.key||'').trim();
        const title=(p.title||'').trim();
        const label = title || ((key.includes(':')? key.split(':')[1] : key) || '').trim();
        return { label, path:(p.path||'').trim(), key, order:Number(p.order||0) };
      }).sort((a,b)=>a.order-b.order);
    }
    return out; // { Panel: [{label,path,key,order}...] }
  }
  function groupPermsByPanel(yetkiler){
    const byPanel={};
    (Array.isArray(yetkiler)?yetkiler:[]).forEach(s=>{
      const i=String(s).indexOf(':'); if(i<0) return;
      let panel = normPanelName(String(s).slice(0,i).trim());
      let label = String(s).slice(i+1).trim();
      if(!ALL_PANELS.includes(panel)) return;
      (byPanel[panel] ||= []).push(label);
    });
    return byPanel; // {Panel:[label,...]}
  }

  // ---------- TABBAR ----------
  function renderTabbar(allowedPanels){
    const rail = $('tabRail'); if(!rail) return;
    rail.innerHTML = '';

    // Home'ı ortalara denk getirmek için diziyi ikiye bölerek yerleştir
    const panels = ALL_PANELS.filter(p => allowedPanels.includes(p));
    const half = Math.ceil(panels.length/2);
    const left = panels.slice(0,half), right = panels.slice(half);

    [...left, 'Home', ...right].forEach(p=>{
      const a = document.createElement('a');
      a.href="#";
      a.className='tbtn' + (p==='Home' ? ' home' : '');
      a.dataset.panel=p;
      a.innerHTML = `<div class="ico">${ICONS[p]||'📁'}</div><div class="lbl">${p==='Home'?'Ana Sayfa':p}</div>`;
      a.addEventListener('click', e=>{
        e.preventDefault();
        if(p==='Home'){ closeSheet(); window.scrollTo({top:0,behavior:'smooth'}); }
        else { setActiveTab(a); openSheet(p); }
      });
      rail.appendChild(a);
    });
  }
  function setActiveTab(el){
    const rail = $('tabRail'); if(!rail) return;
    rail.querySelectorAll('.tbtn').forEach(x=>x.classList.remove('active'));
    el.classList.add('active');
  }

  // ---------- SHEET ----------
  const sheet = $('panelSheet'), sheetList=$('sheetList'), sheetTitle=$('sheetTitle'), sheetBackdrop=$('sheetBackdrop');
  let PERMS_BY_PANEL = {}; // { Panel:[label,...] }
  let MANIFEST = {};       // { Panel:[{label,path,key,order}...] }

  function openSheet(panel){
    if(!sheet || !sheetList || !sheetTitle) return;
    sheetTitle.textContent = panel;
    sheetList.innerHTML = '';

    const allowedLabels = PERMS_BY_PANEL[panel] || [];
    const manifestPages  = MANIFEST[panel] || [];

    const items = manifestPages.filter(p=>{
      const label = (p.label||'').toLowerCase();
      const key   = (p.key||'').toLowerCase();
      return allowedLabels.some(L=>{
        const l=L.toLowerCase();
        return l===label || l===`${panel.toLowerCase()}: ${label}` || (key && l===key);
      });
    });

    if(!items.length){
      const it=document.createElement('div'); it.className='item'; it.textContent='Bu panel için sayfa tanımlı değil';
      sheetList.appendChild(it);
    }else{
      items.forEach(p=>{
        const it=document.createElement('div'); it.className='item';
        it.innerHTML=`<div>${p.label}</div><div class="go">›</div>`;
        it.addEventListener('click', ()=>{ if(p.path) window.location.href=p.path; });
        sheetList.appendChild(it);
      });
    }
    sheet.style.display='block'; sheetBackdrop.style.display='block';
  }
  function closeSheet(){ if(sheet){ sheet.style.display='none'; } if(sheetBackdrop){ sheetBackdrop.style.display='none'; } }
  sheetBackdrop && sheetBackdrop.addEventListener('click', closeSheet);
  if(sheet){
    let sStartY=null;
    sheet.addEventListener('touchstart',e=>{ sStartY=e.touches[0].clientY },{passive:true});
    sheet.addEventListener('touchmove',e=>{ if(sStartY==null) return; const dy=e.touches[0].clientY - sStartY; if(dy>40){ closeSheet(); sStartY=null; } },{passive:true});
  }

  // ---------- PUBLIC: sadece header + tabbar kurulum ----------
  async function start(){
    // üst metin
    const {gun, tarih} = trHeaderDate();
    $('gun') && ($('gun').textContent = gun);
    $('tarih') && ($('tarih').textContent = tarih);
    $('temaYazi') && ($('temaYazi').textContent = themeLabel());

    // auth
    auth.onAuthStateChanged(async (user)=>{
      if(!user){ location.href='./index.html'; return; }

      // ad
      const udoc = await loadUserDoc(user.uid);
      $('adSoyad') && ($('adSoyad').textContent = udoc.adSoyad || user.displayName || 'Kullanıcı');

      // tema
      const pref = (udoc.tema || localStorage.getItem('temaModu') || 'oto').toLowerCase();
      setThemeFrom(pref);

      // yetki -> panel listesi
      PERMS_BY_PANEL = groupPermsByPanel(udoc.yetkiler || []);
      const allowedPanels = Object.keys(PERMS_BY_PANEL);

      // manifest ve tabbar
      MANIFEST = await loadManifest();
      renderTabbar(allowedPanels);
    });
  }

  window.NavShell = { start };
})();
