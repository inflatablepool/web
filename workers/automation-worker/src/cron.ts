interface Env {
  DB: D1Database;
  DATA_BUCKET: R2Bucket;
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  GSC_REFRESH_TOKEN?: string;
  GSC_SITE_URL?: string;
  INDEXNOW_KEY?: string;
  INDEXNOW_HOST?: string;
  INDEXNOW_KEY_LOCATION?: string;
  CONTACT_RESEND_API_KEY?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

export async function cron(env: Env): Promise<Response> {
  const results: Record<string, string> = {};
  const startedAt = new Date().toISOString();

  try {
    const { gscFetch } = await import('./gsc-fetch');
    results.gsc = await gscFetch(env).then((r) => (r.ok ? 'ok' : 'fail'));
  } catch {
    results.gsc = 'error';
  }

  try {
    const { ruleEngine } = await import('./rule-engine');
    results.rules = await ruleEngine(env).then((r) => (r.ok ? 'ok' : 'fail'));
  } catch {
    results.rules = 'error';
  }

  try {
    const { geoGenerator } = await import('./geo-generator');
    results.geo = await geoGenerator(env).then((r) => (r.ok ? 'ok' : 'fail'));
  } catch {
    results.geo = 'error';
  }

  try {
    const { submitToIndexNow } = await import('./indexnow');
    const indexnowResult = await submitToIndexNow(env);
    results.indexnow =
      indexnowResult.submitted > 0
        ? `ok:${indexnowResult.submitted}`
        : indexnowResult.errors.length > 0
          ? `fail:${indexnowResult.errors.join(',')}`
          : 'skip';
  } catch {
    results.indexnow = 'error';
  }

  try {
    const { retryFailedInquiryEmails } = await import('./email-retry');
    const summary = await retryFailedInquiryEmails(env);
    results.email = summary.skipped
      ? `skip:${summary.skipped}`
      : summary.failed > 0
        ? `fail:${summary.failed}`
        : `ok:${summary.sent}`;
  } catch {
    results.email = 'error';
  }

  const completedAt = new Date().toISOString();

  try {
    const log = await env.DATA_BUCKET.get('automation/log.json');
    const history = log ? ((await log.json()) as any[]) : [];
    history.push({ startedAt, completedAt, results });
    await env.DATA_BUCKET.put('automation/log.json', JSON.stringify(history.slice(-90)));
  } catch {
    /* log write failed */
  }

  return new Response(
    JSON.stringify({
      success: Object.values(results).every(
        (r) => r === 'ok' || r === 'skip' || r.startsWith('ok:') || r.startsWith('skip:')
      ),
      startedAt,
      completedAt,
      results,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
