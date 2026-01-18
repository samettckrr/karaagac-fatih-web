// Supabase Edge Function: send-password-reset
// Şifre yenileme maili gönderir

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  to: string;
  adSoyad: string;
  resetLink: string;
  expiryMinutes?: number;
  logoUrl?: string;
}

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

function createEmailHTML(data: RequestBody): string {
  const { adSoyad, resetLink, expiryMinutes = 60, logoUrl } = data;
  const escapedAdSoyad = escapeHtml(adSoyad || '');
  const escapedResetLink = escapeHtml(resetLink);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Karaağaç Fatih - Şifre Yenileme</title>
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
      <h1>Şifre Yenileme</h1>
    </div>
    <div class="content">
      <div class="greeting">
        <p>Merhaba <strong>${escapedAdSoyad}</strong>,</p>
        <p>Şifre yenileme talebiniz alındı. Aşağıdaki butona tıklayarak şifrenizi yenileyebilirsiniz.</p>
      </div>
      
      <div class="button-container">
        <a href="${escapedResetLink}" class="button">🔑 Şifremi Yenile</a>
      </div>
      
      <div class="warning">
        <p><strong>⚠️ ÖNEMLİ GÜVENLİK UYARISI:</strong></p>
        <p>Bu link ${expiryMinutes} dakika içinde geçerliliğini yitirecektir. Eğer siz bu talepte bulunmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayıp yapıştırabilirsiniz:<br>
        <a href="${escapedResetLink}" style="color: #0ea5e9; word-break: break-all;">${escapedResetLink}</a>
      </p>
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

function createEmailText(data: RequestBody): string {
  const { adSoyad, resetLink, expiryMinutes = 60 } = data;
  return `Karaağaç Fatih - Şifre Yenileme

Merhaba ${adSoyad || ''},

Şifre yenileme talebiniz alındı. Aşağıdaki linke tıklayarak şifrenizi yenileyebilirsiniz:

${resetLink}

⚠️ ÖNEMLİ: Bu link ${expiryMinutes} dakika içinde geçerliliğini yitirecektir.

Eğer siz bu talepte bulunmadıysanız, lütfen bu e-postayı görmezden gelin.

İyi çalışmalar,
Karaağaç Fatih Yönetim Sistemi

---
Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.
© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Mail service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { to, adSoyad, resetLink, expiryMinutes, logoUrl } = body;

    if (!to || !adSoyad || !resetLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', required: ['to', 'adSoyad', 'resetLink'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const htmlContent = createEmailHTML({ to, adSoyad, resetLink, expiryMinutes, logoUrl });
    const textContent = createEmailText({ to, adSoyad, resetLink, expiryMinutes });

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Karaağaç Fatih <onboarding@resend.dev>',
        to: [to],
        subject: 'Karaağaç Fatih - Şifre Yenileme',
        html: htmlContent,
        text: textContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset email sent successfully:', resendData);
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

