// Kurban Ön Kayıt - Supabase bağlantısı (bu klasör tamamen bağımsız)
const SUPABASE_URL = 'https://lmwfibippjvqctccxiwb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtd2ZpYmlwcGp2cWN0Y2N4aXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjcwNTQsImV4cCI6MjA4MTc0MzA1NH0.V71PNZ-XQ4jmAJpM2oQ-ei5GgRaup4JgwtHirdc1SEk';

(function() {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
})();
