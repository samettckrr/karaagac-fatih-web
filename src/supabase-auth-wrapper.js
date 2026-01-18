/**
 * Supabase Auth Wrapper - Firebase Auth API Uyumluluğu
 * 
 * Bu wrapper, Firebase Auth API'sine benzer bir interface sağlar.
 * Böylece mevcut kodları minimum değişiklikle Supabase'e geçirebiliriz.
 * 
 * Kullanım:
 *   const auth = getSupabaseAuth();
 *   auth.signInWithEmailAndPassword(email, password)
 *   auth.onAuthStateChanged(callback)
 *   auth.signOut()
 */

(function () {
  'use strict';

  // Supabase client'ı bekle ve hazır olana kadar bekle
  function getSupabase() {
    // Eğer zaten yüklenmişse direkt dön
    if (typeof window.supabase !== 'undefined' && window.supabase && window.supabase.auth) {
      return Promise.resolve(window.supabase);
    }

    // Eğer henüz yüklenmediyse, biraz bekle
    return new Promise((resolve) => {
      let retries = 0;
      const maxRetries = 100; // 10 saniye (100 * 100ms)

      const checkInterval = setInterval(() => {
        retries++;

        // Supabase client'ın hem var hem de auth metoduna sahip olduğunu kontrol et
        if (typeof window.supabase !== 'undefined' &&
          window.supabase &&
          typeof window.supabase.auth === 'object' &&
          typeof window.supabase.auth.getSession === 'function') {
          clearInterval(checkInterval);
          resolve(window.supabase);
        } else if (retries >= maxRetries) {
          clearInterval(checkInterval);
          console.error('❌ Supabase client yüklenemedi!');
          console.error('Mevcut durum:', {
            supabase: typeof window.supabase,
            hasAuth: window.supabase ? typeof window.supabase.auth : 'N/A'
          });
          resolve(null);
        }
      }, 100);
    });
  }

  // Firebase Auth benzeri Supabase Auth wrapper
  class SupabaseAuthWrapper {
    constructor() {
      this.currentUser = null;
      this.listeners = [];
      this.supabase = null;
      this.initialized = false;

      // Supabase client'ı al ve initialize et
      this.init();
    }

    async init() {
      const supabase = await getSupabase();
      if (!supabase || !supabase.auth) {
        console.error('❌ Supabase client bulunamadı!');
        // Retry mekanizması - biraz sonra tekrar dene
        setTimeout(() => this.init(), 500);
        return;
      }

      this.supabase = supabase;
      this.initialized = true;

      try {
        // Mevcut session'ı kontrol et
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Session kontrolü hatası:', error);
        }
        if (session?.user) {
          this.currentUser = this.convertSupabaseUserToFirebase(session.user);
          this.notifyListeners(this.currentUser);
        } else {
          // Kullanıcı yoksa da bildir (null) - Firebase davranışı
          this.notifyListeners(null);
        }

        // Auth state değişikliklerini dinle
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            this.currentUser = this.convertSupabaseUserToFirebase(session.user);
            this.notifyListeners(this.currentUser);
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.notifyListeners(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            this.currentUser = this.convertSupabaseUserToFirebase(session.user);
            this.notifyListeners(this.currentUser);
          } else if (event === 'INITIAL_SESSION') {
            // Initial session event'i de null olabilir
            if (!session?.user && this.currentUser === null) {
              // Zaten null bildirdik, tekrar bildirmeye gerek yok mu?
              // Emin olmak için bildirebiliriz
              // this.notifyListeners(null);
            }
          }
        });
      } catch (err) {
        console.error('Init hatası:', err);
        // Hata durumunda da null bildir ki uygulama 'loading' ekranında kalmasın
        this.notifyListeners(null);
      }
    }

    // Supabase user'ı Firebase user formatına dönüştür
    convertSupabaseUserToFirebase(supabaseUser) {
      return {
        uid: supabaseUser.id,
        email: supabaseUser.email,
        emailVerified: supabaseUser.email_confirmed_at ? true : false,
        displayName: supabaseUser.user_metadata?.display_name || null,
        photoURL: supabaseUser.user_metadata?.photo_url || null,
        phoneNumber: supabaseUser.phone || null,
        metadata: {
          creationTime: supabaseUser.created_at,
          lastSignInTime: supabaseUser.last_sign_in_at || supabaseUser.created_at
        },
        // Firebase uyumluluğu için ek alanlar
        providerData: [{
          uid: supabaseUser.email,
          email: supabaseUser.email,
          providerId: 'password'
        }]
      };
    }

    // Auth state değişikliklerini dinle (Firebase API uyumlu)
    onAuthStateChanged(callback) {
      if (typeof callback !== 'function') {
        console.error('onAuthStateChanged: callback bir fonksiyon olmalı');
        return () => { }; // unsubscribe fonksiyonu
      }

      this.listeners.push(callback);

      // Eğer zaten initialize olduysa hemen bildir
      if (this.initialized) {
        setTimeout(() => callback(this.currentUser), 0);
      } else if (this.currentUser) {
        // Initialize bitmemiş ama user varsa (nadir)
        setTimeout(() => callback(this.currentUser), 0);
      }

      // Unsubscribe fonksiyonu
      return () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      };
    }

    // Listener'ları bilgilendir
    notifyListeners(user) {
      this.listeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('Auth state listener hatası:', error);
        }
      });
    }

    // Email/Password ile giriş (Firebase API uyumlu)
    async signInWithEmailAndPassword(email, password) {
      // Supabase client'ın hazır olduğundan emin ol
      if (!this.supabase || !this.supabase.auth) {
        await this.init();
        if (!this.supabase || !this.supabase.auth) {
          // Hala yüklenmediyse, tekrar dene
          const supabase = await getSupabase();
          if (!supabase || !supabase.auth) {
            throw new Error('Supabase client yüklenemedi. Lütfen sayfayı yenileyin.');
          }
          this.supabase = supabase;
        }
      }

      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          // Supabase hata mesajlarını Firebase formatına çevir
          const firebaseError = this.convertSupabaseError(error);
          throw firebaseError;
        }

        if (data?.user) {
          this.currentUser = this.convertSupabaseUserToFirebase(data.user);
          this.notifyListeners(this.currentUser);

          return {
            user: this.currentUser
          };
        }

        throw new Error('Giriş başarısız');

      } catch (error) {
        console.error('Giriş hatası:', error);
        throw error;
      }
    }

    // Çıkış yap (Firebase API uyumlu)
    async signOut() {
      // Supabase client'ın hazır olduğundan emin ol
      if (!this.supabase || !this.supabase.auth) {
        await this.init();
        if (!this.supabase || !this.supabase.auth) {
          const supabase = await getSupabase();
          if (!supabase || !supabase.auth) {
            throw new Error('Supabase client yüklenemedi');
          }
          this.supabase = supabase;
        }
      }

      try {
        const { error } = await this.supabase.auth.signOut();

        if (error) {
          throw error;
        }

        this.currentUser = null;
        this.notifyListeners(null);

        return Promise.resolve();

      } catch (error) {
        console.error('Çıkış hatası:', error);
        throw error;
      }
    }

    // Şifre sıfırlama emaili gönder (Firebase API uyumlu)
    async sendPasswordResetEmail(email) {
      // Supabase client'ın hazır olduğundan emin ol
      if (!this.supabase || !this.supabase.auth) {
        await this.init();
        if (!this.supabase || !this.supabase.auth) {
          const supabase = await getSupabase();
          if (!supabase || !supabase.auth) {
            throw new Error('Supabase client yüklenemedi');
          }
          this.supabase = supabase;
        }
      }

      try {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/index.html?reset=true`
        });

        if (error) {
          const firebaseError = this.convertSupabaseError(error);
          throw firebaseError;
        }

        return Promise.resolve();

      } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        throw error;
      }
    }

    // Persistence ayarla (Firebase API uyumlu - Supabase otomatik yapar)
    setPersistence(persistence) {
      // Supabase otomatik olarak session'ı localStorage'da saklar
      // Bu metod uyumluluk için boş bırakıldı
      return Promise.resolve();
    }

    // Supabase hatalarını Firebase formatına çevir
    convertSupabaseError(supabaseError) {
      const errorMap = {
        'Invalid login credentials': {
          code: 'auth/wrong-password',
          message: 'E-posta veya şifre hatalı.'
        },
        'Email not confirmed': {
          code: 'auth/email-not-verified',
          message: 'E-posta adresiniz doğrulanmamış.'
        },
        'User not found': {
          code: 'auth/user-not-found',
          message: 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı.'
        },
        'Too many requests': {
          code: 'auth/too-many-requests',
          message: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.'
        }
      };

      const errorMessage = supabaseError.message || '';
      const matchedError = Object.keys(errorMap).find(key =>
        errorMessage.includes(key)
      );

      if (matchedError) {
        const firebaseError = new Error(errorMap[matchedError].message);
        firebaseError.code = errorMap[matchedError].code;
        return firebaseError;
      }

      // Varsayılan hata
      const firebaseError = new Error(supabaseError.message || 'Bir hata oluştu');
      firebaseError.code = 'auth/unknown-error';
      return firebaseError;
    }
  }

  // Global instance oluştur
  let authInstance = null;

  // Firebase Auth benzeri global fonksiyon
  window.getSupabaseAuth = function () {
    if (!authInstance) {
      authInstance = new SupabaseAuthWrapper();
    }
    return authInstance;
  };

  // Firebase uyumluluğu için: firebase.auth() yerine kullanılabilir
  // Not: Bu sadece geçiş döneminde kullanılmalı
  if (typeof window.firebase === 'undefined') {
    window.firebase = {};
  }

  // Eğer Firebase Auth yoksa, Supabase Auth'u kullan
  if (typeof window.firebase.auth === 'undefined' || !window.firebase.auth) {
    window.firebase.auth = function () {
      return window.getSupabaseAuth();
    };
  }

  console.log('✅ Supabase Auth Wrapper yüklendi');
})();

