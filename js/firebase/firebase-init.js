// Firebase Uygulamasını Başlat - Firebase 9.22.2 (compat)
const firebaseConfig = {
  apiKey: "AIzaSyDyzADuLzkszFMTnfKwiWgsVnY7CxDngv0",
  authDomain: "karaagacfthdaimi.firebaseapp.com",
  projectId: "karaagacfthdaimi",
  storageBucket: "karaagacfthdaimi.firebasestorage.app",
  messagingSenderId: "688702235131",
  appId: "1:688702235131:web:1ad367ea6fb5136e83ab5e"
};

// Uygulamayı başlat
firebase.initializeApp(firebaseConfig);

// Firestore, Auth, Storage değişkenleri
// firebase-init.js
window.db      = window.db      || firebase.firestore();
window.auth    = window.auth    || firebase.auth();
// Storage sadece yüklüyse kullanılır (opsiyonel)
try {
  if (firebase.storage && typeof firebase.storage === 'function') {
    window.storage = window.storage || firebase.storage();
  }
} catch (e) {
  // Storage modülü yüklenmemiş, sessizce devam et
  console.debug('Firebase Storage modülü yüklenmedi, devam ediliyor...');
}
