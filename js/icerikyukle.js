function icerikYukle(icerik) {
  const yanPanel = document.querySelector('.yan-panel');
  yanPanel.classList.remove('acik');

  const icerikPaneli = document.getElementById('icerik-paneli');

  if (icerik === 'liste') {
    // Talebe listesi
    fetch("calisma-karti.html")
  }

  else if (icerik === 'kayit') {
    // Talebe kayıt formu (1. adım)
    fetch("parcalar/talebe-kayit.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-kayit-adim1.js";
        script.type = "module";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'bilgi') {
    // Talebe bilgi formu + modal
    fetch("talebe/talebe-bilgi-formu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;

        // Önce modal JS
        const modalScript = document.createElement("script");
        modalScript.src = "js/talebe-modal.js";
        modalScript.onload = () => {
          // Ardından bilgi formu JS
          const bilgiScript = document.createElement("script");
          bilgiScript.src = "js/talebe-bilgi.js";
          bilgiScript.onload = () => {
            if (typeof talebeBilgiFormuYukle === "function") {
              talebeBilgiFormuYukle();
            } else {
              console.error("❌ talebeBilgiFormuYukle tanımlı değil.");
            }
          };
          document.body.appendChild(bilgiScript);
        };
        document.body.appendChild(modalScript);
      });
  }

  else if (icerik === 'okul') {
    // Okul bilgileri
    fetch("parcalar/talebe-okul.html")
  }

  else {
    icerikPaneli.innerHTML = `<p>İçerik yüklenemedi.</p>`;
  }
}
