// Supabase Edge Function: send-system-update
// Sistem güncellemesi maili gönderir (şablonlu)

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
  message: string;
  template?: 'default' | 'update' | 'warning' | 'info' | 'success';
  items?: string[]; // Madde madde liste (opsiyonel)
  actionUrl?: string;
  actionText?: string;
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

function getTemplateColors(template: string = 'default') {
  const templates: { [key: string]: { header: string; border: string; button: string } } = {
    default: { header: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: '#0ea5e9', button: '#0ea5e9' },
    update: { header: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: '#3b82f6', button: '#3b82f6' },
    warning: { header: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: '#f59e0b', button: '#f59e0b' },
    info: { header: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', border: '#06b6d4', button: '#06b6d4' },
    success: { header: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: '#22c55e', button: '#22c55e' },
  };
  return templates[template] || templates.default;
}

function createEmailHTML(data: RequestBody): string {
  const { subject, title, message, template = 'default', items, actionUrl, actionText, logoUrl } = data;
  const colors = getTemplateColors(template);
  const escapedTitle = escapeHtml(title);
  const escapedMessage = escapeHtml(message);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
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
      background: ${colors.header};
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
    .message {
      font-size: 16px;
      margin-bottom: 20px;
      white-space: pre-line;
    }
    .items-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid ${colors.border};
    }
    .items-list ul {
      margin: 0;
      padding-left: 20px;
    }
    .items-list li {
      margin: 8px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: ${colors.button};
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
      <h1>${escapedTitle}</h1>
    </div>
    <div class="content">
      <div class="message">${escapedMessage.replace(/\n/g, '<br>')}</div>
      
      ${items && items.length > 0 ? `
      <div class="items-list">
        <ul>
          ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${actionUrl && actionText ? `
      <div class="button-container">
        <a href="${escapeHtml(actionUrl)}" class="button">${escapeHtml(actionText)}</a>
      </div>
      ` : ''}
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
  const { title, message, items, actionUrl, actionText } = data;
  let text = `${title}\n\n${message}\n\n`;
  
  if (items && items.length > 0) {
    text += items.map(item => `- ${item}`).join('\n') + '\n\n';
  }
  
  if (actionUrl && actionText) {
    text += `${actionText}: ${actionUrl}\n\n`;
  }
  
  text += `Karaağaç Fatih Yönetim Sistemi\n---\nBu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyin.\n© ${new Date().getFullYear()} Karaağaç Fatih. Tüm hakları saklıdır.`;
  
  return text;
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
    const { to, subject, title, message, template, items, actionUrl, actionText, logoUrl } = body;

    if (!to || !subject || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', required: ['to', 'subject', 'title', 'message'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const htmlContent = createEmailHTML({ to, subject, title, message, template, items, actionUrl, actionText, logoUrl });
    const textContent = createEmailText({ to, subject, title, message, template, items, actionUrl, actionText });

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

    console.log('System update email sent successfully:', resendData);
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

