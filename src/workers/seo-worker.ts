import { contentV2Records } from '../data/content-v2';
import { sampleTopQueries } from '../data/seo/sample-data';
import { runAllRules } from '../lib/seo/rule-engine';
import { generateTaskList } from '../lib/seo/task-list';
import { generateGeoBlocks } from '../lib/seo/geo-generator';
import { saveTasksToKv, saveHistoryToKv, saveGeoToKv, getLatestTasks, type SeoKvEnv } from '../lib/seo/kv-store';

interface Env extends SeoKvEnv {
  GSC_TOKEN?: string;
  GSC_SITE_URL?: string;
}

async function fetchGscData(env: Env): Promise<typeof sampleTopQueries> {
  if (!env.GSC_TOKEN || !env.GSC_SITE_URL) {
    return sampleTopQueries;
  }
  try {
    const url = `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(env.GSC_SITE_URL)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GSC_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'page'],
        rowLimit: 100,
      }),
    });
    if (!res.ok) return sampleTopQueries;
    const json: any = await res.json();
    return (json.rows || []).map((r: any) => ({
      query: r.keys[0],
      page: r.keys[1],
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
    }));
  } catch {
    return sampleTopQueries;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/run') {
      const gscData = await fetchGscData(env);
      const pages = gscData.map((q) => ({
        path: q.page ?? '',
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        position: q.position,
        category: 'mid-rank' as const,
      }));

      const rules = runAllRules(gscData, pages, contentV2Records);
      const tasks = generateTaskList(gscData, pages, contentV2Records);
      const geo = generateGeoBlocks(contentV2Records);

      await saveTasksToKv(env, tasks);
      for (const g of geo) {
        await saveGeoToKv(env, g);
      }
      await saveHistoryToKv(env, new Date().toISOString().split('T')[0], {
        impressions: gscData.reduce((s, q) => s + q.impressions, 0),
        clicks: gscData.reduce((s, q) => s + q.clicks, 0),
        avgCtr: gscData.length > 0 ? gscData.reduce((s, q) => s + q.ctr, 0) / gscData.length : 0,
        avgPosition: gscData.length > 0 ? gscData.reduce((s, q) => s + q.position, 0) / gscData.length : 0,
      });

      return new Response(
        JSON.stringify(
          {
            version: 'v3.5',
            timestamp: new Date().toISOString(),
            summary: {
              queries: gscData.length,
              highPriorityTasks: tasks.high.length,
              geoPages: geo.length,
            },
            seo: { rules, tasks },
            geo: geo.slice(0, 5),
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    if (url.pathname === '/tasks') {
      const tasks = await getLatestTasks(env);
      return new Response(JSON.stringify(tasks || { high: [], medium: [], low: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return new Response('Inflatable Pool Factory v3.5 SEO Worker · Free Tier', { status: 200 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const gscData = await fetchGscData(env);
    const pages = gscData.map((q) => ({
      path: q.page ?? '',
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
      position: q.position,
      category: 'mid-rank' as const,
    }));

    const tasks = generateTaskList(gscData, pages, contentV2Records);
    const geo = generateGeoBlocks(contentV2Records);

    await saveTasksToKv(env, tasks);
    for (const g of geo) {
      await saveGeoToKv(env, g);
    }
    await saveHistoryToKv(env, new Date().toISOString().split('T')[0], {
      impressions: gscData.reduce((s, q) => s + q.impressions, 0),
      clicks: gscData.reduce((s, q) => s + q.clicks, 0),
      avgCtr: gscData.length > 0 ? gscData.reduce((s, q) => s + q.ctr, 0) / gscData.length : 0,
      avgPosition: gscData.length > 0 ? gscData.reduce((s, q) => s + q.position, 0) / gscData.length : 0,
    });
  },
};
