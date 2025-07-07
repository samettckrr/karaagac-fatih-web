// Firebase Uygulamasını Başlat - Firebase 9.22.2 (compat)
const firebaseConfig = {
  apiKey: "AIzaSyA_hIufeRPDcHLV1RGtBakVJRHcPZVVN4M",
  authDomain: "karaagacdaimi.firebaseapp.com",
  projectId: "karaagacdaimi",
  storageBucket: "karaagacdaimi.firebasestorage.app",
  messagingSenderId: "1010440261347",
  appId: "1:1010440261347:web:60f2ccbcb64f5551dd3fd6"
};

// Uygulamayı başlat
firebase.initializeApp(firebaseConfig);

// Firestore, Auth, Storage değişkenleri
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
