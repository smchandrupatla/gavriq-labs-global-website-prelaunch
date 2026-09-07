const MAX_LENGTHS = { name: 200, email: 200, organisation: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
      }
      return handleContact(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleContact(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot: real visitors never fill this hidden field in.
  if (typeof data.company_website === 'string' && data.company_website.trim() !== '') {
    return jsonResponse({ ok: true });
  }

  const name = sanitize(data.name);
  const email = sanitize(data.email);
  const organisation = sanitize(data.organisation);
  const message = sanitize(data.message);

  if (!name || !email || !message) {
    return jsonResponse({ ok: false, error: 'Name, email and message are required.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ ok: false, error: 'Please provide a valid email address.' }, 400);
  }
  for (const [field, value] of Object.entries({ name, email, organisation, message })) {
    if (value.length > MAX_LENGTHS[field]) {
      return jsonResponse({ ok: false, error: 'One or more fields are too long.' }, 400);
    }
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: 'Enquiries are temporarily unavailable. Please email admin@gavriqlabsglobal.com directly.' }, 503);
  }

  const subject = `New website enquiry from ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organisation: ${organisation || '(not provided)'}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GAVRIQ Labs Global Website <admin@gavriqlabsglobal.com>',
      to: ['admin@gavriqlabsglobal.com'],
      reply_to: email,
      subject,
      text,
    }),
  });

  if (!resendResponse.ok) {
    return jsonResponse({ ok: false, error: 'We could not send your enquiry right now. Please email admin@gavriqlabsglobal.com directly.' }, 502);
  }

  return jsonResponse({ ok: true });
}

function sanitize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
