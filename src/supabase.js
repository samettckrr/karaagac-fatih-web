// Supabase Proje Ayarlarından bu bilgileri al:
// Yer: Project Settings -> API -> Project URL ve Project API Keys (anon public)
const SUPABASE_URL = 'https://lmwfibippjvqctccxiwb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtd2ZpYmlwcGp2cWN0Y2N4aXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjcwNTQsImV4cCI6MjA4MTc0MzA1NH0.V71PNZ-XQ4jmAJpM2oQ-ei5GgRaup4JgwtHirdc1SEk';

// CDN'den yüklenen Supabase'i kullanarak client oluştur
// jsDelivr CDN'den yüklenen Supabase genellikle global 'supabase' değişkeni olarak gelir
(function() {
  let retryCount = 0;
  const maxRetries = 50; // 5 saniye (50 * 100ms)

  function initSupabase() {
    retryCount++;
    
    // CDN'den yüklenen Supabase kontrolü
    // jsDelivr genellikle UMD formatında yükler, bu yüzden global 'supabase' olarak erişilebilir
    if (typeof supabase !== 'undefined') {
      try {
        // Supabase CDN'den yüklendi, createClient metodunu kullan
        if (typeof supabase.createClient === 'function') {
          window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          console.log('✅ Supabase client oluşturuldu');
          return true;
        }
        // Alternatif: supabase bir namespace ise
        const { createClient } = supabase;
        if (typeof createClient === 'function') {
          window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
          console.log('✅ Supabase client oluşturuldu (destructured)');
          return true;
        }
      } catch (error) {
        console.error('❌ Supabase client oluşturulurken hata:', error);
        return false;
      }
    }
    
    // window.supabase üzerinden kontrol
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      try {
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client oluşturuldu (window.supabase)');
        return true;
      } catch (error) {
        console.error('❌ Supabase client oluşturulurken hata:', error);
        return false;
      }
    }

    // Eğer hala yüklenmediyse ve max retry sayısına ulaşmadıysak, tekrar dene
    if (retryCount < maxRetries) {
      setTimeout(initSupabase, 100);
    } else {
      console.error('❌ Supabase CDN yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      console.log('Mevcut global değişkenler:', {
        supabase: typeof supabase,
        windowSupabase: typeof window.supabase,
        createClient: typeof createClient
      });
    }
  }

  // Script yüklendikten sonra çalıştır (CDN yüklenmesi için zaman tanı)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initSupabase, 200);
    });
  } else {
    setTimeout(initSupabase, 200);
  }
})();