// Supabase Edge Function: admin-create-user
// Admin API kullanarak kullanıcı oluşturur (admin session'ı korunur)
// Service Role Key ile çalışır

// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_URL = 'https://api.resend.com/emails';
// Environment variables runtime'da alınacak (Deno.env.get() fonksiyon içinde çağrılacak)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request body tipi
interface RequestBody {
  email: string;
  password: string;
  adSoyad: string;
  rol: string;
  gorev: string;
  yetkiler?: string[];
  adminUid?: string; // Admin'in UID'si (şifre kaydı için)
}

// HTML escape fonksiyonu
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
}

// HTML mail şablonu
function createEmailHTML(data: { adSoyad: string; to: string; rol: string; gorev: string; sifre: string }): string {
  const { adSoyad, to, rol, gorev, sifre } = data;
  
  const escapedAdSoyad = escapeHtml(adSoyad || '');
  const escapedEmail = escapeHtml(to || '');
  const escapedRol = escapeHtml(rol || '');
  const escapedGorev = escapeHtml(gorev || '');
  const escapedSifre = escapeHtml(sifre || '');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Karaağaç Fatih - Hoş Geldiniz</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background: #f9fafb;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #0ea5e9;
    }
    .info-box h3 {
      margin-top: 0;
      color: #0ea5e9;
      font-size: 18px;
    }
    .info-box p {
      margin: 10px 0;
      color: #4b5563;
    }
    .info-box strong {
      color: #1f2937;
    }
    .password-box {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
      text-align: center;
    }
    .password-box p {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #92400e;
    }
    .password-value {
      font-size: 20px;
      font-family: 'Courier New', monospace;
      letter-spacing: 2px;
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      display: inline-block;
    }
    .warning {
      background: #fee2e2;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #ef4444;
    }
    .warning strong {
      color: #991b1b;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #0ea5e9;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #0284c7;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Karaağaç Fatih - Hoş Geldiniz</h1>
    </div>
    <div class="content">
      <div class="greeting">
        <p>Merhaba <strong>${escapedAdSoyad}</strong>,</p>
        <p>Karaağaç Fatih yönetim sistemine başarıyla eklendiniz. Sistem kayıtlarınıza erişim bilgileriniz aşağıdadır.</p>
      </div>
      
      <div class="info-box">
        <h3>📋 Hesap Bilgileriniz</h3>
        <p><strong>E-posta:</strong> ${escapedEmail}</p>
        <p><strong>Rol:</strong> ${escapedRol}</p>
        <p><strong>Görev:</strong> ${escapedGorev}</p>
      </div>
      
      <div class="password-box">
        <p>🔑 Geçici Şifreniz:</p>
        <div class="password-value">${escapedSifre}</div>
      </div>
      
      <div class="warning">
        <p><strong>⚠️ ÖNEMLİ GÜVENLİK UYARISI:</strong></p>
        <p>Güvenliğiniz için lütfen ilk girişinizde şifrenizi değiştirin. Bu geçici şifreyi kimseyle paylaşmayın.</p>
      </div>
      
      <div class="button-container">
        <a href="https://karaagacfatih.netlify.app" class="button">🚀 Sisteme Giriş Yap</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Karaağaç Fatih Yönetim Sistemi</strong></p>
      <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.</p>
      <p>© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>`;
}

// Plain text mail şablonu
function createEmailText(data: { adSoyad: string; to: string; rol: string; gorev: string; sifre: string }): string {
  const { adSoyad, to, rol, gorev, sifre } = data;
  return `Karaağaç Fatih - Hoş Geldiniz

Merhaba ${adSoyad || ''},

Karaağaç Fatih yönetim sistemine başarıyla eklendiniz. Sistem kayıtlarınıza erişim bilgileriniz aşağıdadır.

HESAP BİLGİLERİNİZ:
- E-posta: ${to || ''}
- Rol: ${rol || ''}
- Görev: ${gorev || ''}
- Geçici Şifre: ${sifre || ''}

⚠️ ÖNEMLİ GÜVENLİK UYARISI:
Güvenliğiniz için lütfen ilk girişinizde şifrenizi değiştirin. Bu geçici şifreyi kimseyle paylaşmayın.

Sisteme giriş yapmak için: https://karaagacfatih.netlify.app/index.html

İyi çalışmalar,
Karaağaç Fatih Yönetim Sistemi

---
Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.
© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
}

Deno.serve(async (req) => {
  // Loglama: Fonksiyon çağrıldı
  console.log('🔵 Function triggered:', req.method, req.url);
  
  // CORS preflight (OPTIONS) isteğini handle et
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - CORS preflight');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Environment variable'ları runtime'da al
    // Supabase Edge Functions'da bu değişkenler otomatik olarak sağlanır
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Supabase Admin Client oluştur (Service Role Key ile)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Request body'yi parse et (sadece bir kez okunur - body consumed olmaması için)
    let body: RequestBody;
    try {
      const parsedBody = await req.json();
      // RequestBody tipine cast et
      body = parsedBody as RequestBody;
      console.log('📥 Edge Function - Alınan body:', body);
    } catch (parseError) {
      console.error('❌ Edge Function - JSON parse hatası:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON',
          details: parseError instanceof Error ? parseError.message : 'Request body could not be parsed as JSON'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Body'den verileri destructure yap (req.json() tekrar çağrılmaz - body already consumed olmaması için)
    const { email, password, adSoyad, rol, gorev, yetkiler, adminUid } = body;

    // Validasyon
    if (!email || !password || !adSoyad || !rol || !gorev) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['email', 'password', 'adSoyad', 'rol', 'gorev'] 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Strateji: Önce createUser dene, eğer "already registered" hatası alırsak güncelleme yap
    // Bu yaklaşım daha verimli çünkü çoğu durumda yeni kullanıcı oluşturulacak
    let userId: string;
    let isNewUser = false;

    // 1. Önce yeni kullanıcı oluşturmayı dene
    console.log('🆕 Yeni kullanıcı oluşturuluyor...');
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Email'i otomatik onayla
      user_metadata: {
        adsoyad: adSoyad,
        rol: rol,
        gorev: gorev
      }
    });

    if (createError) {
      // Eğer "already registered" hatası ise, kullanıcıyı bul ve güncelle
      if (createError.message && createError.message.includes('already been registered')) {
        console.log('🔄 Kullanıcı zaten kayıtlı, güncelleme moduna geçiliyor...');
        
        let foundUser: { id: string; email?: string } | null = null;

        // Önce public.kullanicilar üzerinden e-posta ile çöz (O(1) — listUsers sayfalama çok yavaş olabiliyordu)
        const emailTrim = String(email || '').trim();
        const { data: rowByEmail, error: rowLookupError } = await supabaseAdmin
          .from('kullanicilar')
          .select('id')
          .eq('email', emailTrim)
          .maybeSingle();

        if (rowLookupError) {
          console.warn('kullanicilar e-posta araması hatası (Auth listesine düşülecek):', rowLookupError);
        } else if (rowByEmail?.id) {
          foundUser = { id: String(rowByEmail.id), email: emailTrim };
          console.log('✅ Kullanıcı public.kullanicilar üzerinden bulundu:', foundUser.id);
        }

        // Satır yoksa (Auth'ta var, tabloda yok / e-posta eşleşmedi) Auth Admin listUsers ile ara — sınırlı sayfa
        let page = 1;
        const perPage = 200;
        const maxPages = 5;

        while (!foundUser && page <= maxPages) {
          const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: perPage
          });
          
          if (listError) {
            console.error('listUsers hatası:', listError);
            break;
          }
          
          if (usersList && usersList.users) {
            foundUser = usersList.users.find((u: { id: string; email?: string }) =>
              String(u.email || '').toLowerCase() === emailTrim.toLowerCase()
            ) || null;
            if (foundUser) {
              console.log('✅ Kullanıcı Auth listUsers ile bulundu:', foundUser.id);
              break;
            }
            
            if (usersList.users.length < perPage) {
              break;
            }
          } else {
            break;
          }
          
          page++;
        }
        
        if (foundUser && foundUser.id) {
          userId = foundUser.id;
          isNewUser = false;
          console.log('📝 Mevcut kullanıcı bulundu, güncelleniyor:', userId);

          // Auth kullanıcısını güncelle
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: password,
            user_metadata: {
              adsoyad: adSoyad,
              rol: rol,
              gorev: gorev
            }
          });

          if (updateAuthError) {
            console.error('Auth kullanıcı güncelleme hatası:', updateAuthError);
            // Auth güncelleme hatası kritik değil, devam et
          }

          // Veritabanını upsert
          const { error: dbError } = await supabaseAdmin
            .from('kullanicilar')
            .upsert({
              id: userId,
              adsoyad: adSoyad,
              email: email,
              rol: rol,
              gorev: gorev,
              yetkiler: yetkiler || [],
              aktif: true,
              eklenmetarihi: new Date().toISOString()
            }, { onConflict: 'id' });

          if (dbError) {
            console.error('Database upsert error:', dbError);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to save user data to database',
                details: dbError.message 
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          // 2b. Şifreyi kullanici_sifreleri tablosuna kaydet (güncelleme durumu)
          if (password && userId) {
            try {
              const { error: passwordError } = await supabaseAdmin
                .from('kullanici_sifreleri')
                .upsert({
                  uid: userId,
                  email: email,
                  sifre: password,
                  olusturan_admin_uid: adminUid || null,
                  olusturma_tarihi: new Date().toISOString(),
                  guncelleme_tarihi: new Date().toISOString()
                }, { onConflict: 'uid' });

              if (passwordError) {
                console.error('⚠️ Şifre kaydetme hatası (non-critical):', passwordError);
                // Şifre kaydetme hatası kritik değil, kullanıcı güncelleme başarılı
              } else {
                console.log('✅ Şifre kullanici_sifreleri tablosuna kaydedildi (güncelleme)');
              }
            } catch (passwordSaveError) {
              console.error('⚠️ Şifre kaydetme exception (non-critical):', passwordSaveError);
              // Şifre kaydetme hatası kritik değil, kullanıcı güncelleme başarılı
            }
          }
        } else {
          // Kullanıcı bulunamadı ama "already registered" hatası aldık
          console.error('❌ Kullanıcı bulunamadı ama "already registered" hatası alındı');
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create user',
              details: 'User already exists but could not be found for update. Please try again.'
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } else {
        // Başka bir hata
        console.error('Admin API user creation error:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user',
            details: createError.message 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Kullanıcı başarıyla oluşturuldu
      if (!userData.user) {
        return new Response(
          JSON.stringify({ error: 'User creation failed - no user data returned' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      userId = userData.user.id;
      isNewUser = true;
      console.log('✅ Yeni kullanıcı oluşturuldu:', userId);

      // 2. public.kullanicilar tablosuna verileri yaz (upsert kullan - ID varsa güncelle, yoksa ekle)
      const { error: dbError } = await supabaseAdmin
        .from('kullanicilar')
        .upsert({
          id: userId,
          adsoyad: adSoyad,
          email: email,
          rol: rol,
          gorev: gorev,
          yetkiler: yetkiler || [],
          aktif: true,
          eklenmetarihi: new Date().toISOString()
        }, { onConflict: 'id' });

      if (dbError) {
        console.error('Database upsert error:', dbError);
        // Kullanıcı oluşturuldu ama veritabanına yazılamadı - kullanıcıyı sil
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (deleteError) {
          console.error('Failed to delete user after database error:', deleteError);
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save user data to database',
            details: dbError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 2b. Şifreyi kullanici_sifreleri tablosuna kaydet
      if (password && userId) {
        try {
          const { error: passwordError } = await supabaseAdmin
            .from('kullanici_sifreleri')
            .upsert({
              uid: userId,
              email: email,
              sifre: password,
              olusturan_admin_uid: adminUid || null,
              olusturma_tarihi: new Date().toISOString(),
              guncelleme_tarihi: new Date().toISOString()
            }, { onConflict: 'uid' });

          if (passwordError) {
            console.error('⚠️ Şifre kaydetme hatası (non-critical):', passwordError);
            // Şifre kaydetme hatası kritik değil, kullanıcı oluşturma başarılı
          } else {
            console.log('✅ Şifre kullanici_sifreleri tablosuna kaydedildi');
          }
        } catch (passwordSaveError) {
          console.error('⚠️ Şifre kaydetme exception (non-critical):', passwordSaveError);
          // Şifre kaydetme hatası kritik değil, kullanıcı oluşturma başarılı
        }
      }
    }

    // 3. Mail gönder (Resend API kullanarak)
    // NOT: Mail gönderme hatası kritik değil, kullanıcı oluşturma başarılı sayılmalı
    if (resendApiKey) {
      try {
        const htmlContent = createEmailHTML({ adSoyad, to: email, rol, gorev, sifre: password });
        const textContent = createEmailText({ adSoyad, to: email, rol, gorev, sifre: password });

        // Timeout ile mail gönderme (10 saniye timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

        const resendResponse = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Karaağaç Fatih <onboarding@resend.dev>',
            to: [email],
            subject: 'Karaağaç Fatih - Hoş Geldiniz',
            html: htmlContent,
            text: textContent,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resendResponse.ok) {
          const resendData = await resendResponse.json();
          console.error('⚠️ Resend API error (non-critical - user created successfully):', resendData);
        } else {
          const resendData = await resendResponse.json();
          console.log('✅ Welcome email sent successfully:', resendData);
        }
      } catch (mailError) {
        // Mail gönderme hatası kritik değil - kullanıcı oluşturma başarılı
        // Timeout, network error, veya API error olsa bile kullanıcı oluşturuldu
        console.error('⚠️ Mail sending error (non-critical - user created successfully):', mailError);
        // İşlemi devam ettir, kullanıcı oluşturma başarılı
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not set, email not sent (user created successfully)');
    }

    // Başarılı yanıt
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userId,
          email: email,
          adsoyad: adSoyad,
          rol: rol,
          gorev: gorev
        },
        message: 'User created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

