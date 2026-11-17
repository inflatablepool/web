interface Env {
  DATA_BUCKET: R2Bucket;
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  GSC_REFRESH_TOKEN?: string;
  GSC_SITE_URL?: string;
}

interface GscRow {
  query: string;
  page?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return json.access_token || null;
  } catch {
    return null;
  }
}

async function fetchGscQueries(accessToken: string, siteUrl: string): Promise<GscRow[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
  const allRows: GscRow[] = [];
  let startRow = 0;
  const rowLimit = 25000;

  while (true) {
    const url = `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit,
        startRow,
      }),
    });
    if (!res.ok) break;
    const json: any = await res.json();
    const rows: any[] = json.rows || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      allRows.push({
        query: r.keys[0],
        page: r.keys[1],
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: r.ctr,
        position: r.position,
      });
    }
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
  }

  return allRows;
}

export async function gscFetch(env: Env): Promise<Response> {
  const today = new Date().toISOString().split('T')[0];

  if (!env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET || !env.GSC_REFRESH_TOKEN || !env.GSC_SITE_URL) {
    return new Response(JSON.stringify({ success: false, error: 'GSC credentials not fully configured', data: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const accessToken = await getAccessToken(env.GSC_CLIENT_ID, env.GSC_CLIENT_SECRET, env.GSC_REFRESH_TOKEN);
    if (!accessToken) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to obtain GSC access token' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const queries = await fetchGscQueries(accessToken, env.GSC_SITE_URL);
    const totalClicks = queries.reduce((s, q) => s + q.clicks, 0);
    const totalImpressions = queries.reduce((s, q) => s + q.impressions, 0);
    const endDate = today;
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    const result = { date: today, startDate, endDate, queries, totalClicks, totalImpressions };
    const key = `analytics/gsc/${today}.json`;
    await env.DATA_BUCKET.put(key, JSON.stringify(result));
    // Stable pointer for the admin dashboard (avoids listing dated keys).
    await env.DATA_BUCKET.put('analytics/gsc/latest.json', JSON.stringify(result));

    // Compact daily metrics only — the full history below can grow to tens of
    // megabytes, while the dashboard trend needs a few numbers per day.
    const trendKey = 'analytics/gsc/trend.json';
    const existingTrend = await env.DATA_BUCKET.get(trendKey);
    const trend = existingTrend ? ((await existingTrend.json()) as any[]) : [];
    trend.push({
      date: today,
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      queries: queries.length,
    });
    await env.DATA_BUCKET.put(trendKey, JSON.stringify(trend.slice(-365)));

    const historyKey = 'analytics/gsc/history.json';
    const existing = await env.DATA_BUCKET.get(historyKey);
    const history = existing ? ((await existing.json()) as any[]) : [];
    history.push(result);
    await env.DATA_BUCKET.put(historyKey, JSON.stringify(history.slice(-365)));

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
