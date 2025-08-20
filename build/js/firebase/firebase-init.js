// Firebase Uygulamasını Başlat - Firebase 9.22.2 (compat)
const firebaseConfig = {
  apiKey: "AIzaSyDyzADuLzkszFMTnfKwiWgsVnY7CxDngv0",
  authDomain: "karaagacfthdaimi.firebaseapp.com",
  projectId: "karaagacfthdaimi",
  storageBucket: "karaagacfthdaimi.appspot.com",
  messagingSenderId: "688702235131",
  appId: "1:688702235131:web:1ad367ea6fb5136e83ab5e"
};

// Uygulamayı başlat
firebase.initializeApp(firebaseConfig);

// Firestore, Auth, Storage değişkenleri
window.auth = firebase.auth();
window.db = firebase.firestore();
