import {
  mailRowFromD1,
  recordInquiryEmailAttempt,
  sendInquiryEmail,
  type InquiryMailEnv,
} from '../../shared/inquiry-mail';

export interface EmailRetryEnv extends InquiryMailEnv {
  DB: D1Database;
}

export interface EmailRetrySummary {
  enabled: boolean;
  retried: number;
  sent: number;
  failed: number;
  skipped?: string;
  errors: string[];
}

// D1 Outbox sweep: rows created by the contact worker are retried up to five
// times (15-minute cooldown, 30-day window) before the admin has to resend
// manually. Cloudflare Queues are deliberately not required.
const MAX_ATTEMPTS = 5;
const RETRY_WINDOW_DAYS = 30;
const RETRY_COOLDOWN_SECONDS = 15 * 60;
const BATCH_SIZE = 20;

export async function retryFailedInquiryEmails(env: EmailRetryEnv, limit = BATCH_SIZE): Promise<EmailRetrySummary> {
  if (!env.CONTACT_RESEND_API_KEY || !env.CONTACT_EMAIL_TO || !env.CONTACT_FROM_EMAIL) {
    return { enabled: false, retried: 0, sent: 0, failed: 0, skipped: 'not_configured', errors: [] };
  }

  let rows: Record<string, unknown>[];
  try {
    const result = await env.DB.prepare(
      `SELECT * FROM inquiry
       WHERE email_status IN ('pending', 'failed', 'not_configured')
         AND COALESCE(email_attempts, 0) < ?1
         AND created_at > ?2
         AND (email_last_attempt_at IS NULL OR email_last_attempt_at < unixepoch() - ?3)
       ORDER BY created_at ASC
       LIMIT ?4`
    )
      .bind(
        MAX_ATTEMPTS,
        Date.now() - RETRY_WINDOW_DAYS * 24 * 3600 * 1000,
        RETRY_COOLDOWN_SECONDS,
        Math.max(1, Math.min(100, limit))
      )
      .all<Record<string, unknown>>();
    rows = result.results || [];
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // 0005 may lag the worker deploy (deploy.yml migrations are best-effort).
    if (/no such column/i.test(message)) {
      return { enabled: true, retried: 0, sent: 0, failed: 0, skipped: 'schema_missing', errors: [message] };
    }
    throw e;
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const raw of rows) {
    const row = mailRowFromD1(raw);
    if (!row.id || !row.email) continue;
    const result = await sendInquiryEmail(env, row);
    const attempts = row.emailAttempts || 0;
    await recordInquiryEmailAttempt(
      env.DB,
      row.id,
      result,
      result.status === 'not_configured' ? attempts : attempts + 1
    );
    if (result.status === 'sent') {
      sent += 1;
    } else {
      failed += 1;
      errors.push(`${row.id}: ${result.status}: ${result.error}`);
    }
  }

  return {
    enabled: true,
    retried: rows.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  };
}
