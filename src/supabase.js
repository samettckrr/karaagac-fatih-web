// Supabase Proje Ayarlarından bu bilgileri al:
// Yer: Project Settings -> API -> Project URL ve Project API Keys (anon public)
const SUPABASE_URL = 'https://lmwfibippjvqctccxiwb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtd2ZpYmlwcGp2cWN0Y2N4aXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjcwNTQsImV4cCI6MjA4MTc0MzA1NH0.V71PNZ-XQ4jmAJpM2oQ-ei5GgRaup4JgwtHirdc1SEk';

// ===== MULTI-TAB AUTH FIX =====
// Çoklu sekme açıldığında token refresh race condition'ını önler.
// Sadece bir sekme refresh yapar, diğerleri localStorage'dan güncel session'ı okur.
(function() {
  const REFRESH_LOCK_KEY = 'sb-auth-refresh-lock';
  const AUTH_CHANNEL = 'sb-auth-multitab';
  const LOCK_TTL_MS = 12000;
  const POLL_INTERVAL_MS = 150;
  const POLL_MAX_MS = 10000;

  function getTabId() {
    let id = sessionStorage.getItem('sb-tab-id');
    if (!id) {
      id = 'tab_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      sessionStorage.setItem('sb-tab-id', id);
    }
    return id;
  }

  function tryAcquireLock() {
    const lock = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) || 'null');
    const now = Date.now();
    const tabId = getTabId();
    if (lock && lock.tabId !== tabId && (now - lock.ts) < LOCK_TTL_MS) {
      return false;
    }
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ tabId, ts: now }));
    return true;
  }

  function releaseLock() {
    const tabId = getTabId();
    const lock = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) || 'null');
    if (lock && lock.tabId === tabId) {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  }

  function getAuthStorageKey() {
    const ref = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] || 'auth';
    return 'sb-' + ref + '-auth-token';
  }

  function parseStoredSessionToTokenResponse(stored) {
    if (!stored) return null;
    try {
      const data = typeof stored === 'string' ? JSON.parse(stored) : stored;
      const session = data?.currentSession || data?.session || data;
      if (!session?.access_token) return null;
      const expiresAt = session.expires_at || 0;
      const expiresIn = Math.max(0, Math.floor(expiresAt - Date.now() / 1000));
      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token || session.access_token,
        expires_in: expiresIn,
        token_type: session.token_type || 'bearer',
        user: session.user || null
      };
    } catch (_) {
      return null;
    }
  }

  async function waitForOtherTabRefresh(authKey) {
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANNEL) : null;
    const start = Date.now();
    const initialVal = localStorage.getItem(authKey);

    return new Promise((resolve) => {
      const check = () => {
        const now = Date.now();
        if (now - start > POLL_MAX_MS) {
          resolve(null);
          return;
        }
        const current = localStorage.getItem(authKey);
        if (current && current !== initialVal) {
          const parsed = parseStoredSessionToTokenResponse(current);
          if (parsed?.access_token) {
            resolve(parsed);
            return;
          }
        }
        setTimeout(check, POLL_INTERVAL_MS);
      };

      const onMessage = (e) => {
        if (e.data?.type === 'auth_refresh_done') {
          const parsed = parseStoredSessionToTokenResponse(localStorage.getItem(authKey));
          if (parsed) {
            bc?.removeEventListener('message', onMessage);
            resolve(parsed);
          }
        }
      };

      bc?.addEventListener('message', onMessage);
      setTimeout(check, POLL_INTERVAL_MS);
    });
  }

  function createMultiTabFetch() {
    const authKey = getAuthStorageKey();
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANNEL) : null;

    return async function multiTabFetch(url, options = {}) {
      const urlStr = typeof url === 'string' ? url : (url?.url || '');
      const isRefresh = urlStr.includes('/auth/v1/token') &&
        (urlStr.includes('refresh_token') || (options.body && String(options.body).includes('refresh_token')));

      if (!isRefresh) {
        return fetch(url, options);
      }

      if (tryAcquireLock()) {
        try {
          bc?.postMessage({ type: 'auth_refresh_started' });
          const res = await fetch(url, options);
          const cloned = res.clone();
          if (res.ok) {
            try {
              const data = await cloned.json();
              if (data?.access_token) {
                bc?.postMessage({ type: 'auth_refresh_done' });
              }
            } catch (_) {}
          }
          return res;
        } finally {
          releaseLock();
        }
      }

      const tokenData = await waitForOtherTabRefresh(authKey);
      if (tokenData) {
        return new Response(JSON.stringify(tokenData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      releaseLock();
      return fetch(url, options);
    };
  }

  window.__supabaseMultiTabFetch = createMultiTabFetch();
})();

// CDN'den yüklenen Supabase'i kullanarak client oluştur
(function() {
  let retryCount = 0;
  const maxRetries = 50;

  function initSupabase() {
    retryCount++;

    if (typeof supabase !== 'undefined') {
      try {
        const createClientFn = supabase.createClient || supabase.default?.createClient;
        if (typeof createClientFn === 'function') {
          const opts = {
            auth: { persistSession: true, autoRefreshToken: true }
          };
          if (typeof window.__supabaseMultiTabFetch === 'function') {
            opts.global = { fetch: window.__supabaseMultiTabFetch };
          }
          window.supabase = createClientFn(SUPABASE_URL, SUPABASE_KEY, opts);
          console.log('✅ Supabase client oluşturuldu (multi-tab uyumlu)');
          return true;
        }
        const { createClient } = supabase;
        if (typeof createClient === 'function') {
          const opts = {};
          if (typeof window.__supabaseMultiTabFetch === 'function') {
            opts.global = { fetch: window.__supabaseMultiTabFetch };
          }
          window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, opts);
          console.log('✅ Supabase client oluşturuldu (destructured, multi-tab uyumlu)');
          return true;
        }
      } catch (error) {
        console.error('❌ Supabase client oluşturulurken hata:', error);
        return false;
      }
    }

    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      try {
        const opts = {};
        if (typeof window.__supabaseMultiTabFetch === 'function') {
          opts.global = { fetch: window.__supabaseMultiTabFetch };
        }
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, opts);
        console.log('✅ Supabase client oluşturuldu (window.supabase, multi-tab uyumlu)');
        return true;
      } catch (error) {
        console.error('❌ Supabase client oluşturulurken hata:', error);
        return false;
      }
    }

    if (retryCount < maxRetries) {
      setTimeout(initSupabase, 100);
    } else {
      console.error('❌ Supabase CDN yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 200));
  } else {
    setTimeout(initSupabase, 200);
  }
})();
