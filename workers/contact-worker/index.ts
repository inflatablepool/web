import { createDb } from '../shared/client';
import { inquiry } from '../shared/schema';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPAM_KEYWORDS = /\b(viagra|cialis|crypto airdrop|investment opportunity|casino|betting)\b/i;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface Env {
  DB: D1Database;
  DATA_BUCKET: R2Bucket;
  CONTACT_RESEND_API_KEY?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
  GITHUB_TOKEN?: string;
  CONTACT_EMAIL_PROVIDER?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

// --- Inquiry attachment gate (ported from the reference implementation) ------
// Extension allow-list because browsers report unreliable MIME types for CAD
// files; content is then magic-number sniffed before anything reaches R2.
const FILE_MAX_BYTES = 20 * 1024 * 1024;
const FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'pdf', 'ai', 'psd', 'dwg', 'dxf', 'zip'];
const FILE_ACCEPT = `.${FILE_EXTENSIONS.join(',.')}`;

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

const TEXT_DECODER = new TextDecoder('utf-8');

/** Byte-prefix check per extension — the server-side file gate. */
function sniffFile(bytes: Uint8Array, ext: string): boolean {
  const head = bytes.subarray(0, 1024);
  const ascii = (): string => {
    try {
      return TEXT_DECODER.decode(head).replace(/^\uFEFF/, '');
    } catch {
      return '';
    }
  };
  const isAscii = (start: number, end: number, expected: string) =>
    end <= head.length && ascii().slice(start, end) === expected;
  switch (ext) {
    case 'png':
      return head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    case 'jpg':
    case 'jpeg':
      return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'webp':
      return head.length >= 12 && isAscii(0, 4, 'RIFF') && isAscii(8, 12, 'WEBP');
    case 'svg':
      return /<svg[\s>]/i.test(ascii());
    case 'pdf':
      return isAscii(0, 5, '%PDF-');
    case 'ai':
      // Illustrator "Save As" files are PDFs; classic EPS-compatible files start with %!PS
      return isAscii(0, 5, '%PDF-') || isAscii(0, 4, '%!PS');
    case 'psd':
      return head.length >= 4 && head[0] === 0x38 && head[1] === 0x42 && head[2] === 0x50 && head[3] === 0x53; // 8BPS
    case 'dwg':
      return /^AC10/.test(ascii()); // DWG versions AC1015 – AC1032
    case 'dxf':
      return /^\s*0\s*SECTION/i.test(ascii()) || ascii().startsWith('AutoCAD Binary DXF');
    case 'zip':
      return (
        head.length >= 4 &&
        head[0] === 0x50 &&
        head[1] === 0x4b &&
        (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07)
      );
    default:
      return false;
  }
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  pdf: 'application/pdf',
  ai: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop',
  dwg: 'image/vnd.dwg',
  dxf: 'image/vnd.dxf',
  zip: 'application/zip',
};

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  if (!token) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const data = (await res.json()) as { success?: boolean };
    return data?.success === true;
  } catch {
    return false;
  }
}

/**
 * D1-backed fixed-window rate limit (1h) so the limit is global across worker
 * isolates. Fail-open on D1 errors: an outage must not block genuine submissions.
 */
async function isRateLimited(db: D1Database, ip: string): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW_SECONDS);
  const key = `contact:${ip}:${windowStart}`;
  try {
    await db
      .prepare(
        `INSERT INTO rate_limit (key, count) VALUES (?1, 1)
        ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = unixepoch()`
      )
      .bind(key)
      .run();
    const row = (await db.prepare('SELECT count FROM rate_limit WHERE key = ?1').bind(key).first()) as {
      count: number;
    } | null;
    // Opportunistic cleanup: drop windows older than 2 hours.
    await db.prepare(`DELETE FROM rate_limit WHERE updated_at < unixepoch() - ${2 * RATE_LIMIT_WINDOW_SECONDS}`).run();
    return (row?.count ?? 0) > RATE_LIMIT_MAX;
  } catch (e) {
    console.error('Rate limit check failed (allowing):', e);
    return false;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function sanitize(value: unknown, maxLen = 2000): string {
  if (typeof value !== 'string') return '';
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 32 && code !== 127) result += value[i];
  }
  return result.trim().slice(0, maxLen);
}

interface ParsedSubmission {
  fields: Record<
    'firstName' | 'lastName' | 'companyName' | 'address' | 'zip' | 'country' | 'email' | 'tel' | 'subject' | 'message',
    string
  >;
  locale: string;
  turnstileToken: string;
  honeypotFilled: boolean;
  file: File | null;
  fileError: string | null;
}

/** Accept both the legacy JSON body and the new multipart/form-data (with file). */
async function parseSubmission(request: Request): Promise<ParsedSubmission | null> {
  const contentType = request.headers.get('content-type') || '';
  const raw: Record<string, unknown> = {};
  let file: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') raw[key] = value;
      else if (typeof value === 'object' && typeof (value as File).arrayBuffer === 'function') {
        const candidate = value as File;
        if (key === 'file' && candidate.size > 0) file = candidate;
      }
    }
  } else {
    try {
      const body: unknown = await request.json();
      if (body && typeof body === 'object') Object.assign(raw, body as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  const s = (v: unknown, max: number): string => (typeof v === 'string' ? sanitize(v, max) : '');
  return {
    fields: {
      firstName: s(raw.firstName, 100),
      lastName: s(raw.lastName, 100),
      companyName: s(raw.companyName, 200),
      address: s(raw.address, 400),
      zip: s(raw.zip, 40),
      country: s(raw.country, 100),
      email: s(raw.email, 200),
      tel: s(raw.tel, 60),
      subject: s(raw.subject, 200),
      message: s(raw.message, 4000),
    },
    locale: typeof raw.locale === 'string' ? raw.locale.slice(0, 10) : 'en',
    turnstileToken: typeof raw.turnstileToken === 'string' ? raw.turnstileToken.slice(0, 4096) : '',
    honeypotFilled: typeof raw.email_confirm === 'string' && raw.email_confirm.trim() !== '',
    file,
    fileError: null,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405);
    }

    const ip = request.headers.get('cf-connecting-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const parsed = await parseSubmission(request);
    if (!parsed) return json({ success: false, error: 'Invalid JSON' }, 400);
    const fields = parsed.fields;

    if (!fields.firstName || !fields.lastName)
      return json({ success: false, error: 'First and last name required' }, 400);
    if (!fields.email) return json({ success: false, error: 'Email required' }, 400);
    if (!EMAIL_RE.test(fields.email)) return json({ success: false, error: 'Invalid email' }, 400);
    if (!fields.message || fields.message.length < 5) return json({ success: false, error: 'Message too short' }, 400);
    if (SPAM_KEYWORDS.test(fields.message) || SPAM_KEYWORDS.test(fields.subject || '')) {
      return json({ success: false, error: 'Submission rejected' }, 400);
    }

    // Honeypot: a bot that filled the hidden field gets a fake success and NO
    // write / email — it must not be able to tell it was caught.
    if (parsed.honeypotFilled) {
      return json({ success: true, id: crypto.randomUUID(), receivedAt: new Date().toISOString() });
    }

    // Turnstile (invisible/managed) verification — active only when a secret
    // key is configured; otherwise degrade gracefully like every other optional
    // integration. Verified AFTER field validation: a token is one-time-use.
    if (env.TURNSTILE_SECRET_KEY && !(await verifyTurnstile(parsed.turnstileToken, env.TURNSTILE_SECRET_KEY, ip))) {
      return json({ success: false, error: 'Captcha verification failed. Please try again.' }, 400);
    }

    // Global per-IP rate limit (D1-backed, 5/hour).
    const db = createDb(env.DB);
    if (await isRateLimited(env.DB, ip || 'unknown')) {
      const resetAt =
        Math.ceil(Date.now() / 1000 / RATE_LIMIT_WINDOW_SECONDS) * RATE_LIMIT_WINDOW_SECONDS +
        RATE_LIMIT_WINDOW_SECONDS;
      return new Response(JSON.stringify({ success: false, error: 'Too many submissions. Please try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...CORS_HEADERS,
          'Retry-After': String(3600),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAt),
        },
      });
    }

    // --- Attachment gate: extension allow-list + size + magic-number sniff ---
    let logoKey: string | null = null;
    if (parsed.file) {
      const file = parsed.file;
      const ext = fileExtension(file.name || '');
      if (!FILE_EXTENSIONS.includes(ext)) {
        return json({ success: false, error: `Unsupported file type. Accepted: ${FILE_ACCEPT} (max 20 MB).` }, 400);
      }
      if (file.size > FILE_MAX_BYTES) {
        return json({ success: false, error: 'File too large. Maximum size is 20 MB.' }, 400);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!sniffFile(bytes, ext)) {
        return json(
          { success: false, error: 'File content does not match its extension. Please upload the original file.' },
          400
        );
      }
      logoKey = `inquiry-files/${crypto.randomUUID()}.${ext}`;
      // Store before the D1 insert: an orphaned object (D1 failure) is inert,
      // while an inquiry row pointing at a missing object would 404 in admin.
      try {
        await env.DATA_BUCKET.put(logoKey, bytes, {
          httpMetadata: { contentType: EXT_CONTENT_TYPES[ext] || 'application/octet-stream' },
        });
      } catch (e) {
        console.error('R2 upload failed:', e);
        return json({ success: false, error: 'Could not store attachment. Please try again.' }, 500);
      }
    }

    const destinationEmail = env.CONTACT_EMAIL_TO || '';
    if (!destinationEmail || !EMAIL_RE.test(destinationEmail)) {
      return json({ success: false, error: 'Destination email not configured' }, 500);
    }

    const receivedAt = new Date();
    const id = crypto.randomUUID();

    // Persist to D1 — the single source of truth for the admin Submissions page.
    try {
      await db.insert(inquiry).values({
        id,
        name: `${fields.firstName} ${fields.lastName}`.trim(),
        company: fields.companyName,
        country: fields.country,
        email: fields.email.toLowerCase(),
        whatsapp: fields.tel,
        businessType: 'other',
        quantity: 'unsure',
        requirements: fields.message,
        subject: fields.subject,
        message: fields.message,
        address: fields.address,
        zip: fields.zip,
        tel: fields.tel,
        logoKey,
        status: 'new',
        locale: parsed.locale,
        ip,
        userAgent,
        createdAt: receivedAt,
      });
    } catch (e) {
      console.error('D1 insert failed:', e);
      return json({ success: false, error: 'Could not store submission' }, 500);
    }

    if (env.CONTACT_RESEND_API_KEY && env.CONTACT_FROM_EMAIL) {
      const fromName = env.CONTACT_FROM_NAME || 'Inflatable Pool Factory Contact';
      const from = `${fromName} <${env.CONTACT_FROM_EMAIL}>`;
      const replyTo = `${fields.firstName} ${fields.lastName} <${fields.email}>`;

      const subject = `[Contact] ${fields.subject || '(no subject)'} — ${fields.firstName} ${fields.lastName}`;
      const attachmentLine = logoKey ? `<p><strong>Attachment:</strong> stored (open in admin Submissions)</p>` : '';
      const html = `<div style="font-family:sans-serif;max-width:640px;margin:0 auto">
        <h2>New contact form submission</h2>
        <p>Received at ${receivedAt.toISOString()} | IP: ${ip} | ID: ${id}</p>
        <table>${Object.entries(fields)
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px;font-weight:600">${k}</td><td style="padding:6px">${v.replace(/\n/g, '<br>')}</td></tr>`
          )
          .join('')}</table>
        ${attachmentLine}
        <p style="font-size:12px;color:#666">User-Agent: ${userAgent}</p>
      </div>`;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.CONTACT_RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: destinationEmail,
            reply_to: replyTo,
            subject,
            html,
            text: `${fields.firstName} ${fields.lastName}\n${fields.email}\n${fields.message}`,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Resend error:', txt.slice(0, 500));
          return json({ success: false, error: 'Email delivery failed. Please try again later.' }, 502);
        }
      } catch (e) {
        console.error('Email send failed:', e);
        return json({ success: false, error: 'Email service error. Please try again later.' }, 502);
      }
    } else {
      console.error('Contact email not configured: missing CONTACT_RESEND_API_KEY or CONTACT_FROM_EMAIL');
      return json({ success: false, error: 'Contact service not configured.' }, 500);
    }

    return json({ success: true, id, receivedAt: receivedAt.toISOString() });
  },
};
