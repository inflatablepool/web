/**
 * Real GSC dashboard data. Reads the snapshots written by the automation
 * worker (`analytics/gsc/latest.json` + `trend.json`) and derives metrics,
 * opportunities and cannibalization candidates. There is no sample/demo
 * fallback: a missing snapshot returns configured:false so the admin UI can
 * show an honest empty state.
 */
export interface SeoQueryMetric {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  pages: number;
}

export interface SeoPageMetric {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SeoOpportunity {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  reason: 'low_ctr' | 'striking_distance';
}

export interface SeoCannibalization {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  pages: Array<{ page: string; impressions: number; clicks: number; position: number }>;
}

export interface SeoTask {
  priority: 'high' | 'medium';
  type: 'low_ctr' | 'striking_distance' | 'cannibalization';
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  action: string;
}

export interface SeoTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export type SeoDashboard =
  | { configured: false; reason: string; checkedAt: string }
  | {
      configured: true;
      source: 'google-search-console';
      snapshotDate: string;
      startDate: string | null;
      endDate: string | null;
      totals: {
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
        queries: number;
        pages: number;
      };
      topQueries: SeoQueryMetric[];
      topPages: SeoPageMetric[];
      opportunities: SeoOpportunity[];
      cannibalization: SeoCannibalization[];
      tasks: SeoTask[];
      trend: SeoTrendPoint[];
      rowCount: number;
      checkedAt: string;
    };

interface NormalizedRow {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface NormalizedSnapshot {
  date: string;
  startDate: string | null;
  endDate: string | null;
  rows: NormalizedRow[];
  totalClicks: number;
  totalImpressions: number;
}

interface QueryAggregate {
  query: string;
  impressions: number;
  clicks: number;
  positionSum: number;
  pages: Map<string, { impressions: number; clicks: number; positionSum: number }>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeRows(raw: unknown): NormalizedRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: NormalizedRow[] = [];
  for (const item of raw) {
    const record = asRecord(item);
    if (!record) continue;
    const query = asString(record.query).trim();
    if (!query) continue;
    const impressions = asNumber(record.impressions);
    const clicks = asNumber(record.clicks);
    const position = asNumber(record.position);
    rows.push({
      query,
      page: asString(record.page).trim(),
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position,
    });
  }
  return rows;
}

function normalizeSnapshot(raw: unknown, fallbackDate = ''): NormalizedSnapshot | null {
  const record = asRecord(raw);
  if (!record) return null;
  const rows = normalizeRows(record.queries);
  const totalImpressions = rows.length
    ? rows.reduce((sum, row) => sum + row.impressions, 0)
    : asNumber(record.totalImpressions);
  const totalClicks = rows.length ? rows.reduce((sum, row) => sum + row.clicks, 0) : asNumber(record.totalClicks);
  return {
    date: asString(record.date) || fallbackDate,
    startDate: asString(record.startDate) || null,
    endDate: asString(record.endDate) || null,
    rows,
    totalClicks,
    totalImpressions,
  };
}

async function readJson(bucket: R2Bucket, key: string): Promise<unknown | null> {
  try {
    const object = await bucket.get(key);
    if (!object) return null;
    return JSON.parse(await object.text());
  } catch {
    return null;
  }
}

async function loadLatestSnapshot(bucket: R2Bucket): Promise<NormalizedSnapshot | null> {
  const latest = normalizeSnapshot(await readJson(bucket, 'analytics/gsc/latest.json'));
  if (latest) return latest;

  // Fallback for snapshots written before latest.json existed.
  let keys: string[];
  try {
    const listed = await bucket.list({ prefix: 'analytics/gsc/', limit: 100 });
    keys = listed.objects
      .map((object) => object.key)
      .filter((key) => /\/\d{4}-\d{2}-\d{2}\.json$/.test(key))
      .sort()
      .reverse();
  } catch {
    return null;
  }
  for (const key of keys.slice(0, 5)) {
    const snapshot = normalizeSnapshot(await readJson(bucket, key), key.slice(-15, -5));
    if (snapshot) return snapshot;
  }
  return null;
}

function normalizeTrend(raw: unknown): SeoTrendPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: SeoTrendPoint[] = [];
  for (const item of raw) {
    const record = asRecord(item);
    if (!record) continue;
    const date = asString(record.date);
    if (!date) continue;
    const queries = normalizeRows(record.queries);
    const impressions = queries.length
      ? queries.reduce((sum, row) => sum + row.impressions, 0)
      : asNumber(record.impressions);
    const clicks = queries.length ? queries.reduce((sum, row) => sum + row.clicks, 0) : asNumber(record.clicks);
    points.push({ date, clicks, impressions, ctr: impressions > 0 ? clicks / impressions : 0 });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
}

async function loadTrend(bucket: R2Bucket, latest: NormalizedSnapshot): Promise<SeoTrendPoint[]> {
  const compact = normalizeTrend(await readJson(bucket, 'analytics/gsc/trend.json'));
  if (compact.length > 0) return compact.slice(-14);

  // Legacy fallback: history.json embeds every query row, so only read it when
  // the object is small enough to keep the admin request cheap.
  try {
    const history = await bucket.get('analytics/gsc/history.json');
    if (history && history.size <= 8_000_000) {
      const points = normalizeTrend(JSON.parse(await history.text()));
      if (points.length > 0) return points.slice(-14);
    }
  } catch {
    /* fall through to the single latest point */
  }
  return [
    {
      date: latest.date,
      clicks: latest.totalClicks,
      impressions: latest.totalImpressions,
      ctr: latest.totalImpressions > 0 ? latest.totalClicks / latest.totalImpressions : 0,
    },
  ];
}

function aggregateQueries(rows: NormalizedRow[]): QueryAggregate[] {
  const map = new Map<string, QueryAggregate>();
  for (const row of rows) {
    let entry = map.get(row.query);
    if (!entry) {
      entry = { query: row.query, impressions: 0, clicks: 0, positionSum: 0, pages: new Map() };
      map.set(row.query, entry);
    }
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.positionSum += row.position * row.impressions;
    if (row.page) {
      const page = entry.pages.get(row.page) || { impressions: 0, clicks: 0, positionSum: 0 };
      page.impressions += row.impressions;
      page.clicks += row.clicks;
      page.positionSum += row.position * row.impressions;
      entry.pages.set(row.page, page);
    }
  }
  return [...map.values()];
}

function aggregatePages(rows: NormalizedRow[]): SeoPageMetric[] {
  const map = new Map<string, { impressions: number; clicks: number; positionSum: number }>();
  for (const row of rows) {
    if (!row.page) continue;
    const entry = map.get(row.page) || { impressions: 0, clicks: 0, positionSum: 0 };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.positionSum += row.position * row.impressions;
    map.set(row.page, entry);
  }
  return [...map.entries()].map(([page, entry]) => ({
    page,
    impressions: entry.impressions,
    clicks: entry.clicks,
    ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
    position: entry.impressions > 0 ? entry.positionSum / entry.impressions : 0,
  }));
}

function queryMetric(entry: QueryAggregate): SeoQueryMetric {
  return {
    query: entry.query,
    impressions: entry.impressions,
    clicks: entry.clicks,
    ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
    position: entry.impressions > 0 ? entry.positionSum / entry.impressions : 0,
    pages: entry.pages.size,
  };
}

export async function buildSeoDashboard(bucket: R2Bucket): Promise<SeoDashboard> {
  const checkedAt = new Date().toISOString();
  const latest = await loadLatestSnapshot(bucket);
  if (!latest) {
    return { configured: false, reason: 'no_gsc_data', checkedAt };
  }

  const rows = latest.rows;
  const clicks = latest.totalClicks;
  const impressions = latest.totalImpressions;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const weightedPosition =
    impressions > 0 ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions : 0;

  const queryAggregates = aggregateQueries(rows);
  const topQueries = queryAggregates
    .map(queryMetric)
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 15);
  const allPages = aggregatePages(rows);
  const topPages = allPages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 15);

  const opportunities: SeoOpportunity[] = queryAggregates
    .map((entry) => {
      const metric = queryMetric(entry);
      const lowCtr = metric.position > 0 && metric.position <= 20 && metric.ctr < 0.02;
      const striking = metric.position >= 10.5 && metric.position <= 20;
      if (metric.impressions < 50 || (!lowCtr && !striking)) return null;
      return {
        query: metric.query,
        impressions: metric.impressions,
        clicks: metric.clicks,
        ctr: metric.ctr,
        position: metric.position,
        reason: (lowCtr ? 'low_ctr' : 'striking_distance') as SeoOpportunity['reason'],
      };
    })
    .filter((entry): entry is SeoOpportunity => entry !== null)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  const cannibalization: SeoCannibalization[] = queryAggregates
    .filter((entry) => entry.pages.size >= 2 && entry.impressions >= 20)
    .map((entry) => {
      const metric = queryMetric(entry);
      return {
        query: metric.query,
        impressions: metric.impressions,
        clicks: metric.clicks,
        ctr: metric.ctr,
        position: metric.position,
        pages: [...entry.pages.entries()]
          .map(([page, value]) => ({
            page,
            impressions: value.impressions,
            clicks: value.clicks,
            position: value.impressions > 0 ? value.positionSum / value.impressions : 0,
          }))
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 10),
      };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  const tasks: SeoTask[] = [
    ...opportunities.map((entry) => ({
      priority: entry.reason === 'low_ctr' ? ('high' as const) : ('medium' as const),
      type: entry.reason,
      query: entry.query,
      impressions: entry.impressions,
      clicks: entry.clicks,
      ctr: entry.ctr,
      position: entry.position,
      action:
        entry.reason === 'low_ctr'
          ? 'Rewrite the title and meta description for a stronger SERP snippet'
          : 'Add depth, FAQs and internal links to move into the top 10',
    })),
    ...cannibalization.map((entry) => ({
      priority: 'high' as const,
      type: 'cannibalization' as const,
      query: entry.query,
      impressions: entry.impressions,
      clicks: entry.clicks,
      ctr: entry.ctr,
      position: entry.position,
      action: `Differentiate or consolidate ${entry.pages.length} competing pages`,
    })),
  ]
    .sort((a, b) => (a.priority === b.priority ? b.impressions - a.impressions : a.priority === 'high' ? -1 : 1))
    .slice(0, 50);

  return {
    configured: true,
    source: 'google-search-console',
    snapshotDate: latest.date,
    startDate: latest.startDate,
    endDate: latest.endDate,
    totals: {
      clicks,
      impressions,
      ctr,
      position: weightedPosition,
      queries: queryAggregates.length,
      pages: allPages.length,
    },
    topQueries,
    topPages,
    opportunities,
    cannibalization,
    tasks,
    trend: await loadTrend(bucket, latest),
    rowCount: rows.length,
    checkedAt,
  };
}
