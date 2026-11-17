/**
 * Shared inquiry notification mail: one renderer + sender used by the contact
 * worker (first attempt), the automation worker (retry sweep) and the admin
 * worker (manual resend). Keeping them on one implementation means a retried
 * email has exactly the same content as the original.
 */
export interface InquiryMailEnv {
  CONTACT_RESEND_API_KEY?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

export interface InquiryMailRow {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  country?: string | null;
  whatsapp?: string | null;
  tel?: string | null;
  businessType?: string | null;
  quantity?: string | null;
  requirements?: string | null;
  subject?: string | null;
  message?: string | null;
  address?: string | null;
  zip?: string | null;
  locale?: string | null;
  createdAt?: number | Date | null;
  ip?: string | null;
  userAgent?: string | null;
  logoKey?: string | null;
  submissionKey?: string | null;
  buyerType?: string | null;
  productType?: string | null;
  productInterest?: string | null;
  sourceUrl?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  emailAttempts?: number | null;
}

export type InquiryEmailResult =
  | { status: 'sent'; messageId: string | null }
  | { status: 'failed'; error: string }
  | { status: 'not_configured'; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** HTML-escape every user-controlled value before it reaches the email body. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/** Header values (Subject, Reply-To) must never contain CR/LF. */
function sanitizeHeaderValue(value: string, maxLen = 200): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalise a `SELECT * FROM inquiry` row. Raw D1 rows are snake_case; Drizzle
 * rows are camelCase — both shapes are accepted so callers can use whichever
 * read path is convenient. Missing columns (migration lag) become empty.
 */
export function mailRowFromD1(row: Record<string, unknown>): InquiryMailRow {
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null) return value;
    }
    return null;
  };
  return {
    id: str(pick('id')),
    name: str(pick('name')),
    email: str(pick('email')),
    company: str(pick('company')),
    country: str(pick('country')),
    whatsapp: str(pick('whatsapp')),
    tel: str(pick('tel')),
    businessType: str(pick('businessType', 'business_type')),
    quantity: str(pick('quantity')),
    requirements: str(pick('requirements')),
    subject: str(pick('subject')),
    message: str(pick('message')),
    address: str(pick('address')),
    zip: str(pick('zip')),
    locale: str(pick('locale')),
    createdAt: (pick('createdAt', 'created_at') as number | Date | null) ?? null,
    ip: str(pick('ip')),
    userAgent: str(pick('userAgent', 'user_agent')),
    logoKey: str(pick('logoKey', 'logo_key')),
    submissionKey: str(pick('submissionKey', 'submission_key')),
    buyerType: str(pick('buyerType', 'buyer_type')),
    productType: str(pick('productType', 'product_type')),
    productInterest: str(pick('productInterest', 'product_interest')),
    sourceUrl: str(pick('sourceUrl', 'source_url')),
    referrer: str(pick('referrer')),
    utmSource: str(pick('utmSource', 'utm_source')),
    utmMedium: str(pick('utmMedium', 'utm_medium')),
    utmCampaign: str(pick('utmCampaign', 'utm_campaign')),
    utmTerm: str(pick('utmTerm', 'utm_term')),
    utmContent: str(pick('utmContent', 'utm_content')),
    emailAttempts: num(pick('emailAttempts', 'email_attempts')),
  };
}

function receivedAtIso(row: InquiryMailRow): string {
  if (row.createdAt instanceof Date) return row.createdAt.toISOString();
  if (typeof row.createdAt === 'number' && Number.isFinite(row.createdAt)) {
    // D1 stores created_at in milliseconds.
    return new Date(row.createdAt).toISOString();
  }
  return new Date().toISOString();
}

const MAIL_FIELDS: Array<[keyof InquiryMailRow, string]> = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['company', 'Company'],
  ['country', 'Country'],
  ['whatsapp', 'WhatsApp / TEL'],
  ['address', 'Address'],
  ['zip', 'Zip'],
  ['subject', 'Subject'],
  ['businessType', 'Business type'],
  ['buyerType', 'Buyer type'],
  ['productType', 'Product type'],
  ['productInterest', 'Product interest'],
  ['quantity', 'Quantity'],
  ['sourceUrl', 'Source URL'],
  ['referrer', 'External referrer'],
  ['utmSource', 'utm_source'],
  ['utmMedium', 'utm_medium'],
  ['utmCampaign', 'utm_campaign'],
  ['utmTerm', 'utm_term'],
  ['utmContent', 'utm_content'],
  ['submissionKey', 'Submission key'],
  ['locale', 'Locale'],
  ['ip', 'IP'],
  ['userAgent', 'User-Agent'],
];

interface BuiltEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}

/** Returns null when the provider/destination is not configured. */
export function buildInquiryEmail(row: InquiryMailRow, env: InquiryMailEnv): BuiltEmail | null {
  const apiKey = (env.CONTACT_RESEND_API_KEY || '').trim();
  const to = (env.CONTACT_EMAIL_TO || '').trim();
  const fromEmail = (env.CONTACT_FROM_EMAIL || '').trim();
  if (!apiKey || !EMAIL_RE.test(to) || !EMAIL_RE.test(fromEmail)) return null;

  const fromName = sanitizeHeaderValue(env.CONTACT_FROM_NAME || 'Inflatable Pool Factory Contact', 80);
  const submitterName = sanitizeHeaderValue(row.name || 'Website visitor', 120).replace(/[<>]/g, '');
  const safeEmail = (row.email || '').replace(/[<>]/g, '');
  const subject = sanitizeHeaderValue(
    `[Contact] ${row.subject || '(no subject)'} — ${row.name || 'Website visitor'}`,
    180
  );
  const receivedAt = receivedAtIso(row);
  const message = row.message || row.requirements || '';
  const attempts = Math.max(0, Math.floor(row.emailAttempts || 0));

  const valueRows = MAIL_FIELDS.filter(([key]) => {
    const value = row[key];
    return typeof value === 'string' && value.trim() !== '';
  })
    .map(
      ([key, label]) =>
        `<tr><td style="padding:6px;font-weight:600;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px">${escapeHtml(
          str(row[key])
        ).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');
  const messageRow = message
    ? `<tr><td style="padding:6px;font-weight:600;vertical-align:top">Message</td><td style="padding:6px">${escapeHtml(
        message
      ).replace(/\n/g, '<br>')}</td></tr>`
    : '';
  const attachmentLine = row.logoKey
    ? `<p><strong>Attachment:</strong> ${escapeHtml(str(row.logoKey).split('/').pop() || 'stored file')} (open in admin Submissions)</p>`
    : '';

  const html = `<div style="font-family:sans-serif;max-width:640px;margin:0 auto">
        <h2>New contact form submission</h2>
        <p>Received at ${escapeHtml(receivedAt)} | IP: ${escapeHtml(row.ip || '')} | ID: ${escapeHtml(row.id)}</p>
        ${attempts > 0 ? `<p>Delivery attempt: ${attempts + 1}</p>` : ''}
        <table>${valueRows}${messageRow}</table>
        ${attachmentLine}
      </div>`;

  const text = [
    row.name,
    row.email,
    row.company ? `Company: ${row.company}` : '',
    row.country ? `Country: ${row.country}` : '',
    row.subject ? `Subject: ${row.subject}` : '',
    message,
    ...MAIL_FIELDS.filter(
      ([key]) => !['name', 'email', 'company', 'country', 'subject'].includes(key) && str(row[key])
    ).map(([key, label]) => `${label}: ${str(row[key])}`),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    from: `${fromName} <${fromEmail}>`,
    to,
    replyTo: `${submitterName} <${safeEmail}>`,
    subject,
    html,
    text,
  };
}

/** Best-effort send. Never throws; the D1 row remains the source of truth. */
export async function sendInquiryEmail(env: InquiryMailEnv, row: InquiryMailRow): Promise<InquiryEmailResult> {
  const built = buildInquiryEmail(row, env);
  if (!built) {
    console.error('Contact email not configured: missing CONTACT_RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_EMAIL_TO');
    return { status: 'not_configured', error: 'missing provider credentials or destination' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(env.CONTACT_RESEND_API_KEY || '').trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: built.from,
        to: built.to,
        reply_to: built.replyTo,
        subject: built.subject,
        html: built.html,
        text: built.text,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Resend error:', txt.slice(0, 500));
      return { status: 'failed', error: txt.slice(0, 500) || `Resend HTTP ${res.status}` };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { status: 'sent', messageId: data?.id || null };
  } catch (e) {
    console.error('Email send failed:', e);
    return { status: 'failed', error: e instanceof Error ? e.message.slice(0, 500) : 'email send failed' };
  }
}

/**
 * Persist the delivery outcome. The 0005 columns are optional during rollout:
 * when they are missing this falls back to the 0004 status columns so the
 * inquiry is never lost or reclassified because of migration lag.
 */
export async function recordInquiryEmailAttempt(
  db: D1Database,
  id: string,
  result: InquiryEmailResult,
  attempts: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const safeAttempts = Math.max(0, Math.min(999, Math.floor(attempts)));
  const error = result.status === 'sent' ? null : result.error.slice(0, 500);
  const messageId = result.status === 'sent' ? result.messageId : null;
  try {
    await db
      .prepare(
        `UPDATE inquiry
         SET email_status = ?1,
             email_error = ?2,
             email_sent_at = CASE WHEN ?1 = 'sent' THEN ?3 ELSE email_sent_at END,
             email_attempts = ?4,
             email_last_attempt_at = ?5,
             email_message_id = ?6
         WHERE id = ?7`
      )
      .bind(result.status, error, now, safeAttempts, now, messageId, id)
      .run();
  } catch (e) {
    console.error('Email attempt update with retry columns failed; falling back:', e);
    try {
      await db
        .prepare(
          `UPDATE inquiry
           SET email_status = ?1,
               email_error = ?2,
               email_sent_at = CASE WHEN ?1 = 'sent' THEN ?3 ELSE email_sent_at END
           WHERE id = ?4`
        )
        .bind(result.status, error, now, id)
        .run();
    } catch (fallbackError) {
      console.error('Email status update failed (non-fatal):', fallbackError);
    }
  }
}
