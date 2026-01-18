// Supabase Edge Function: send-report-newsletter
// Rapor ve bülten maili gönderir

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  to: string | string[]; // Tekil veya çoklu alıcı
  subject: string;
  title: string;
  content: string; // HTML içerik
  logoUrl?: string;
  attachments?: Array<{ filename: string; url: string }>; // Opsiyonel ekler
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
  const { title, content, logoUrl } = data;
  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
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
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
    }
    .content-body {
      font-size: 16px;
      line-height: 1.8;
    }
    .content-body h1, .content-body h2, .content-body h3 {
      color: #1f2937;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .content-body p {
      margin: 12px 0;
    }
    .content-body ul, .content-body ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    .content-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .content-body table th,
    .content-body table td {
      padding: 8px;
      border: 1px solid #e5e7eb;
      text-align: left;
    }
    .content-body table th {
      background: #f9fafb;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Karaağaç Fatih Logo" style="max-width: 120px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />` : ''}
      <h1>${escapedTitle}</h1>
    </div>
    <div class="content">
      <div class="content-body">
        ${content}
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

function createEmailText(data: RequestBody): string {
  const { title, content } = data;
  // HTML'den basit text çıkarımı (basit bir yaklaşım)
  const textContent = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  return `${title}\n\n${textContent}\n\nKaraağaç Fatih Yönetim Sistemi\n---\nBu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.\n© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
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
    const { to, subject, title, content, logoUrl } = body;

    if (!to || !subject || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', required: ['to', 'subject', 'title', 'content'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const htmlContent = createEmailHTML({ to, subject, title, content, logoUrl });
    const textContent = createEmailText({ to, subject, title, content });

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Karaağaç Fatih <onboarding@resend.dev>',
        to: recipients,
        subject: subject,
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

    console.log('Report/Newsletter email sent successfully:', resendData);
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

