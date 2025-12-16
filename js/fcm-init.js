// FCM (Firebase Cloud Messaging) Başlatma ve Token Yönetimi
// Bu dosya tüm sayfalarda yüklenmeli (ortak.js'den sonra)

(function() {
  'use strict';

  // FCM servis worker kaydı
  if ('serviceWorker' in navigator && 'Notification' in window) {
    // Service Worker kaydı
    navigator.serviceWorker.register('/js/fcm-sw.js')
      .then((registration) => {
        console.log('Service Worker kaydedildi:', registration);
        
        // FCM mesajlaşma nesnesini al
        const messaging = firebase.messaging();
        
        // Notification izni iste
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification izni verildi');
            getFCMToken(messaging);
          } else {
            console.log('Notification izni reddedildi');
          }
        });
        
        // Mesaj dinleme (foreground)
        messaging.onMessage((payload) => {
          console.log('Foreground mesaj alındı:', payload);
          
          // Toast bildirimi göster
          if (typeof window.showToast === 'function') {
            window.showToast(
              'info',
              payload.notification?.title || 'Yeni Bildirim',
              payload.notification?.body || ''
            );
          }
          
          // Bildirim sayacını güncelle
          if (typeof window.loadNotifications === 'function') {
            window.loadNotifications();
          }
        });
        
      })
      .catch((error) => {
        console.error('Service Worker kayıt hatası:', error);
      });
  }

  // FCM Token alma ve kaydetme
  async function getFCMToken(messaging) {
    try {
      const currentToken = await messaging.getToken({
        vapidKey: 'BILDIRIM_VAPID_KEY_BURAYA' // Firebase Console'dan alınacak
      });
      
      if (currentToken) {
        console.log('FCM Token alındı:', currentToken.substring(0, 20) + '...');
        await saveFCMToken(currentToken);
      } else {
        console.log('FCM Token alınamadı');
      }
    } catch (error) {
      console.error('FCM Token alma hatası:', error);
    }
  }

  // FCM Token'ı Firestore'a kaydet
  async function saveFCMToken(token) {
    const db = window.db || firebase.firestore();
    const auth = window.auth || firebase.auth();
    
    if (!auth.currentUser) {
      console.log('Kullanıcı giriş yapmamış, token kaydedilemedi');
      return;
    }
    
    const uid = auth.currentUser.uid;
    const userAgent = navigator.userAgent;
    const deviceInfo = {
      platform: navigator.platform,
      userAgent: userAgent,
      language: navigator.language,
      timestamp: new Date()
    };
    
    try {
      // Token'ı kaydet (aynı token varsa güncelle, yoksa yeni ekle)
      const tokenQuery = await db.collection("kullanici_fcm_tokens")
        .where("uid", "==", uid)
        .where("token", "==", token)
        .limit(1)
        .get();
      
      if (tokenQuery.empty) {
        // Yeni token ekle
        await db.collection("kullanici_fcm_tokens").add({
          uid,
          token,
          aktif: true,
          deviceInfo,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          sonKullanma: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Yeni FCM token kaydedildi');
      } else {
        // Mevcut token'ı güncelle
        const tokenDoc = tokenQuery.docs[0];
        await tokenDoc.ref.update({
          aktif: true,
          deviceInfo,
          sonKullanma: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('FCM token güncellendi');
      }
    } catch (error) {
      console.error('FCM token kaydetme hatası:', error);
    }
  }

  // Token yenileme
  if (typeof firebase !== 'undefined' && firebase.messaging) {
    const messaging = firebase.messaging();
    
    messaging.onTokenRefresh(async () => {
      console.log('FCM Token yenilendi');
      const newToken = await messaging.getToken({
        vapidKey: 'BILDIRIM_VAPID_KEY_BURAYA'
      });
      if (newToken) {
        await saveFCMToken(newToken);
      }
    });
  }

  // Global fonksiyonlar
  window.getFCMToken = getFCMToken;
  window.saveFCMToken = saveFCMToken;
})();

