// Supabase Edge Function: send-permission-update
// Kullanıcı yetki güncellemesi bildirim maili gönderir

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
  eskiRol?: string;
  yeniRol?: string;
  eskiGorev?: string;
  yeniGorev?: string;
  eskiYetkiler?: string[];
  yeniYetkiler?: string[];
  logoUrl?: string;
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
function createEmailHTML(data: RequestBody): string {
  const { adSoyad, to, eskiRol, yeniRol, eskiGorev, yeniGorev, eskiYetkiler, yeniYetkiler, logoUrl } = data;
  
  const escapedAdSoyad = escapeHtml(adSoyad || '');
  const escapedEmail = escapeHtml(to || '');
  const escapedEskiRol = escapeHtml(eskiRol || '');
  const escapedYeniRol = escapeHtml(yeniRol || '');
  const escapedEskiGorev = escapeHtml(eskiGorev || '');
  const escapedYeniGorev = escapeHtml(yeniGorev || '');

  const hasRolChange = eskiRol && yeniRol && eskiRol !== yeniRol;
  const hasGorevChange = eskiGorev && yeniGorev && eskiGorev !== yeniGorev;
  const hasYetkiChange = eskiYetkiler && yeniYetkiler;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Karaağaç Fatih - Yetki Güncellemesi</title>
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
    .change-item {
      padding: 12px;
      margin: 10px 0;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid #0ea5e9;
    }
    .change-item strong {
      color: #1f2937;
    }
    .old-value {
      color: #ef4444;
      text-decoration: line-through;
      margin-right: 8px;
    }
    .new-value {
      color: #22c55e;
      font-weight: 600;
    }
    .yetki-list {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }
    .yetki-list li {
      padding: 4px 0;
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
      <h1>Yetki Güncellemesi</h1>
    </div>
    <div class="content">
      <div class="greeting">
        <p>Merhaba <strong>${escapedAdSoyad}</strong>,</p>
        <p>Hesabınızda yapılan güncellemeler aşağıda belirtilmiştir:</p>
      </div>
      
      <div class="info-box">
        <h3>📋 Güncellenen Bilgiler</h3>
        
        ${hasRolChange ? `
        <div class="change-item">
          <strong>Rol:</strong>
          <span class="old-value">${escapedEskiRol}</span>
          <span class="new-value">→ ${escapedYeniRol}</span>
        </div>
        ` : ''}
        
        ${hasGorevChange ? `
        <div class="change-item">
          <strong>Görev:</strong>
          <span class="old-value">${escapedEskiGorev}</span>
          <span class="new-value">→ ${escapedYeniGorev}</span>
        </div>
        ` : ''}
        
        ${hasYetkiChange ? `
        <div class="change-item">
          <strong>Yetkiler:</strong>
          <ul class="yetki-list">
            ${yeniYetkiler.map(y => `<li>✓ ${escapeHtml(y)}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
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
  const { adSoyad, to, eskiRol, yeniRol, eskiGorev, yeniGorev, eskiYetkiler, yeniYetkiler } = data;
  
  const hasRolChange = eskiRol && yeniRol && eskiRol !== yeniRol;
  const hasGorevChange = eskiGorev && yeniGorev && eskiGorev !== yeniGorev;
  const hasYetkiChange = eskiYetkiler && yeniYetkiler;

  let changes = '';
  if (hasRolChange) changes += `Rol: ${eskiRol} → ${yeniRol}\n`;
  if (hasGorevChange) changes += `Görev: ${eskiGorev} → ${yeniGorev}\n`;
  if (hasYetkiChange) {
    changes += `Yetkiler:\n${yeniYetkiler.map(y => `- ${y}`).join('\n')}\n`;
  }

  return `Karaağaç Fatih - Yetki Güncellemesi

Merhaba ${adSoyad || ''},

Hesabınızda yapılan güncellemeler:

${changes}

Sisteme giriş yapmak için: https://karaagacfatih.netlify.app

İyi çalışmalar,
Karaağaç Fatih Yönetim Sistemi

---
Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.
© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

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

    const body: RequestBody = await req.json();
    const { to, adSoyad, eskiRol, yeniRol, eskiGorev, yeniGorev, eskiYetkiler, yeniYetkiler, logoUrl } = body;

    if (!to || !adSoyad) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['to', 'adSoyad'] 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const htmlContent = createEmailHTML({ to, adSoyad, eskiRol, yeniRol, eskiGorev, yeniGorev, eskiYetkiler, yeniYetkiler, logoUrl });
    const textContent = createEmailText({ to, adSoyad, eskiRol, yeniRol, eskiGorev, yeniGorev, eskiYetkiler, yeniYetkiler });

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Karaağaç Fatih <onboarding@resend.dev>',
        to: [to],
        subject: 'Karaağaç Fatih - Yetki Güncellemesi',
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

    console.log('Permission update email sent successfully:', resendData);
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

