import { cron } from './cron';
import { dbCleanup } from './db-cleanup';
import { geoGenerator } from './geo-generator';
import { gscFetch } from './gsc-fetch';
import { ruleEngine } from './rule-engine';
import { taskExport } from './task-export';
import { geoScore } from './geo-score';
import { indexnowHandler } from './indexnow';
import { retryFailedInquiryEmails } from './email-retry';

interface Env {
  DATA_BUCKET: R2Bucket;
  DB: D1Database;
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  GSC_REFRESH_TOKEN?: string;
  GSC_SITE_URL?: string;
  INDEXNOW_KEY?: string;
  INDEXNOW_HOST?: string;
  INDEXNOW_KEY_LOCATION?: string;
  CLEANUP_TOKEN?: string;
  CONTACT_RESEND_API_KEY?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/automation/, '') || '/';

    try {
      switch (path) {
        case '/run':
          return await cron(env);
        case '/geo-generate':
          return await geoGenerator(env);
        case '/gsc-fetch':
          return await gscFetch(env);
        case '/rules/run':
          return await ruleEngine(env);
        case '/tasks/export':
          return await taskExport(request, env);
        case '/geo/score':
          return await geoScore(env);
        case '/indexnow':
          return await indexnowHandler(env, request);
        case '/email-retry':
          return json(await retryFailedInquiryEmails(env));
        case '/cleanup-db': {
          if (env.CLEANUP_TOKEN && url.searchParams.get('token') !== env.CLEANUP_TOKEN)
            return json({ error: 'Unauthorized' }, 401);
          return json(await dbCleanup(env));
        }
        default:
          return json(
            {
              error: 'Not found',
              endpoints: [
                '/run',
                '/geo-generate',
                '/gsc-fetch',
                '/rules/run',
                '/tasks/export',
                '/geo/score',
                '/indexnow',
                '/email-retry',
                '/cleanup-db',
              ],
            },
            404
          );
      }
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
    }
  },

  // Cloudflare Cron Trigger (daily 02:00)
  async scheduled(_event: unknown, env: Env, _ctx: unknown): Promise<void> {
    await Promise.allSettled([cron(env), dbCleanup(env)]);
  },
};
