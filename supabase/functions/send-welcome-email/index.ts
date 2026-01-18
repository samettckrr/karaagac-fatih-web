// Supabase Edge Function: send-welcome-email
// Resend API kullanarak hoş geldiniz maili gönderir

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request body tipi
interface RequestBody {
  to: string;
  adSoyad: string;
  sifre: string;
  rol: string;
  gorev: string;
  logoUrl?: string; // Opsiyonel: Logo URL'i (inline image için)
}

// HTML mail şablonu oluştur
function createEmailHTML(data: RequestBody): string {
  const { adSoyad, to, rol, gorev, sifre, logoUrl } = data;
  
  // XSS koruması için HTML escape
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
  };

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
      ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Karaağaç Fatih Logo" style="max-width: 120px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />` : ''}
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
function createEmailText(data: RequestBody): string {
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

Sisteme giriş yapmak için: https://karaagac-fatih.netlify.app/index.html

İyi çalışmalar,
Karaağaç Fatih Yönetim Sistemi

---
Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.
© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
}

Deno.serve(async (req) => {
  // CORS preflight (OPTIONS) isteğini handle et
  if (req.method === 'OPTIONS') {
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
    // API Key kontrolü
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Mail service configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Request body'yi parse et
    const body: RequestBody = await req.json();
    const { to, adSoyad, sifre, rol, gorev, logoUrl } = body;

    // Validasyon
    if (!to || !adSoyad || !sifre || !rol || !gorev) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['to', 'adSoyad', 'sifre', 'rol', 'gorev'] 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Email içeriklerini oluştur
    const htmlContent = createEmailHTML({ to, adSoyad, sifre, rol, gorev, logoUrl });
    const textContent = createEmailText({ to, adSoyad, sifre, rol, gorev });

    // Resend API'ye istek at
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Karaağaç Fatih <onboarding@resend.dev>', // Production'da doğrulanmış domain kullanın
        to: [to],
        subject: 'Karaağaç Fatih - Hoş Geldiniz',
        html: htmlContent,
        text: textContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: resendData 
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Başarılı yanıt
    console.log('Email sent successfully:', resendData);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        id: resendData.id 
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

