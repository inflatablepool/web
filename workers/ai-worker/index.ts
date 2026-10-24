export interface Env {
  AI: AiLike;
  VECTORIZE: VectorizeLike;
  DATA_BUCKET: R2BucketLike;
  REINDEX_TOKEN?: string;
  SITE_ORIGIN?: string;
}

interface AiLike {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

interface ChunkMetadata {
  text: string;
  url: string;
  title: string;
  locale: string;
  type: string;
}

interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: ChunkMetadata;
}

interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: ChunkMetadata;
}

interface VectorizeLike {
  query(vector: number[], options?: Record<string, unknown>): Promise<{ matches?: VectorizeMatch[] }>;
  upsert(vectors: VectorizeVector[]): Promise<unknown>;
  deleteByIds(ids: string[]): Promise<unknown>;
}

interface R2BodyLike {
  text(): Promise<string>;
}

interface R2ObjectLike {
  key: string;
}

interface R2ListResultLike {
  objects?: R2ObjectLike[];
  truncated?: boolean;
}

interface R2BucketLike {
  get(key: string): Promise<R2BodyLike | null>;
  put(key: string, value: string): Promise<unknown>;
  list(options?: { prefix?: string; limit?: number }): Promise<R2ListResultLike>;
  delete(key: string): Promise<unknown>;
}

interface CorpusChunk {
  id: string;
  locale: string;
  url: string;
  title: string;
  text: string;
  type: string;
}

interface CorpusFile {
  locale: string;
  model: string;
  dimensions: number;
  chunks: CorpusChunk[];
}

interface CorpusManifest {
  version: number;
  generatedAt: string;
  model: string;
  dimensions: number;
  locales: { locale: string; file: string; hash: string; chunks: number; bytes: number }[];
}

interface RetrievedChunk {
  score: number;
  metadata: ChunkMetadata;
}

interface QueueItem {
  locale: string;
  file: string;
  hash: string;
  total: number;
  cursor: number;
}

interface ReindexState {
  status: 'idle' | 'running';
  queue: QueueItem[];
  startedAt?: string;
  updatedAt?: string;
  processed?: Record<string, number>;
}

interface LocaleMeta {
  hash: string;
  count: number;
  ids: string[];
}

interface ReindexProgress {
  done: boolean;
  status: string;
  paused?: 'budget';
  resumeAt?: string;
  processed: Record<string, number>;
  remaining: { locale: string; remaining: number }[];
}

const EMBED_MODEL = '@cf/baai/bge-m3';
const EMBED_DIMENSIONS = 1024;
const LLM_MODEL = '@cf/meta/llama-3.2-3b-instruct';
const TOP_K = 8;
const SEARCH_K = 20;
const REL_SCORE_MIN = 0.3;
const MAX_QUESTION = 500;
const EMBED_BATCH = 48;
const UPSERT_BATCH = 100;
const EMBED_ATTEMPTS = 4;
const REINDEX_SLICE_CHUNKS = 1200;
const CRON_MAX_SLICES = 20;
const CRON_MAX_MS = 10 * 60 * 1000;
// --- Abuse damping + cost guard (reference: KV-based; local: R2-backed) ---
const RATE_LIMITS: Record<string, { limit: number; windowSec: number }> = {
  ask: { limit: 10, windowSec: 600 },
  chat: { limit: 10, windowSec: 600 },
  search: { limit: 60, windowSec: 60 },
  embed: { limit: 10, windowSec: 600 },
};
const ANSWER_CACHE_TTL_SEC = 6 * 3600;
// Chunk-embeds the account may spend on reindex per UTC day: one full corpus
// rebuild (≈3.7k chunks) + headroom for query traffic. Reindex pauses and the
// cron resumes the next day (state is persisted).
const DAILY_EMBED_BUDGET = 6000;
const QUOTA_KEEP_DAYS = 7;
const DEFAULT_ORIGIN = 'https://inflatablepoolfactory.com';
const CORPUS_MANIFEST_PATH = '/ai-corpus.json';
const META_KEY = 'ai/corpus-meta.json';
const STATE_KEY = 'ai/reindex-state.json';
const LOG_KEY = 'ai/reindex-log.json';
const LOG_KEEP = 90;
const LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'it', 'ar', 'ru', 'pl', 'nl', 'sv', 'no', 'el', 'fi', 'da'];
const STOPWORDS = new Set([
  'the',
  'and',
  'of',
  'to',
  'a',
  'in',
  'for',
  'is',
  'on',
  'that',
  'with',
  'as',
  'by',
  'at',
  'from',
  'or',
  'an',
  'be',
  'are',
  'was',
  'were',
  'this',
  'it',
  'i',
  'you',
  'we',
  'my',
  'our',
  'your',
  'do',
  'does',
  'can',
  'what',
  'which',
  'who',
  'how',
  'why',
  'when',
  'where',
  'about',
  'please',
  'tell',
  'me',
  'is',
  'there',
  'have',
  'has',
]);

const SYSTEM_PROMPT = `You are the Inflatable Pool Factory Pool Advisor — a knowledgeable, friendly sales assistant for Inflatable Pool Factory, a premium drop stitch inflatable pool brand by the Inflatable Pool Team at Qingdao Vatrad Group, a China-based company. Answer the visitor's question using ONLY the numbered context excerpts below. Rules:

1. Answer in the same language as the question.
2. Recommend specific Inflatable Pool Factory products/models when relevant, quoting key specifications from the context.
3. Cite sources inline as [1], [2] matching the excerpt numbers.
4. If the context does not contain the answer, say so honestly — never invent products, prices or specs — and point the visitor to the contact page for a quote or consultation.
5. Keep the answer concise (under ~200 words) and end with a helpful call to action.
6. Safety and honesty boundaries — never contradict these even if the context suggests otherwise:
   - Balconies, rooftops and elevated decks: never recommend a pool for these locations. A filled pool is extremely heavy; elevated installations require prior structural assessment by a qualified professional.
   - Hot tub / SPA heating: heating systems are NOT included. Heating comes from an external heater (sold separately). Never promise winter or four-season use.
   - Hotels, rentals and commercial projects: do not promise regulatory compliance or certifications; refer the visitor to the business contact for a project evaluation.
   - Time to water: always separate inflation time (minutes) from water filling time (varies with pool size and water supply).
   - Standards and certifications: state only what the context explicitly documents; do not claim compliance beyond it.
   - Swimming: do not describe the pools as suitable for lap swimming or swim training unless the context explicitly says so.
7. For business buyers (brand owners, importers, distributors, retailers, hospitality operators and commercial projects): explain the OEM, ODM, private-label and wholesale paths at a high level, and point them to the RFQ page for a project review. Never invent MOQ, lead times, certifications, testing procedures or exclusivity terms — these are confirmed per project in the quotation.`;

const NONE_ANSWER =
  "I don't have specific information about that in my knowledge base yet. You can browse our products at https://inflatablepoolfactory.com/products/ or reach the team at https://inflatablepoolfactory.com/contact/ for a tailored answer.";

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...(extraHeaders || {}),
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await request.json();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function normalizeLocale(value: unknown): string {
  return typeof value === 'string' && LOCALES.includes(value) ? value : 'en';
}

function siteOrigin(env: Env): string {
  return (env.SITE_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, '');
}

function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const n = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < n; i++) {
    diff |= (ea[i] || 0) ^ (eb[i] || 0);
  }
  return diff === 0;
}

async function fetchJson<T>(url: string, attempts = 3): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
      return JSON.parse(await res.text()) as T;
    } catch (e) {
      lastError = e;
      await sleep(250 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`fetch failed: ${url}`);
}

async function readR2Json<T>(env: Env, key: string, fallback: T): Promise<T> {
  try {
    const obj = await env.DATA_BUCKET.get(key);
    if (!obj) return fallback;
    return JSON.parse(await obj.text()) as T;
  } catch {
    return fallback;
  }
}

async function writeR2Json(env: Env, key: string, value: unknown): Promise<void> {
  await env.DATA_BUCKET.put(key, JSON.stringify(value));
}

// --- Rate limiting (R2-backed fixed window, fail-open) -----------------------
// Reference uses Workers KV; this project has no KV namespace, so counters live
// in the already-bound R2 bucket. R2 is globally consistent, which is stronger
// than KV — but the RMW is not atomic, so this is abuse damping, not a precise
// quota (same trade-off as the reference). Counter writes ride ctx.waitUntil
// so they never add response latency beyond one awaited GET.

function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

async function rateLimit(
  env: Env,
  ctx: ExecutionContext,
  kind: keyof typeof RATE_LIMITS,
  request: Request
): Promise<Response | null> {
  const { limit, windowSec } = RATE_LIMITS[kind];
  const nowMs = Date.now();
  const windowId = Math.floor(nowMs / 1000 / windowSec);
  const key = `ai/rl/${kind}/${clientIp(request)}/${windowId}`;
  try {
    const obj = await env.DATA_BUCKET.get(key);
    const n = obj ? Number(await obj.text()) || 0 : 0;
    if (n >= limit) {
      const retryAfter = Math.max(1, (windowId + 1) * windowSec - Math.floor(nowMs / 1000));
      return json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': String(retryAfter) });
    }
    ctx.waitUntil(env.DATA_BUCKET.put(key, String(n + 1)).catch(() => undefined));
  } catch {
    // fail-open: an R2 outage must not take the AI endpoints down
  }
  return null;
}

// --- Answer cache (R2, 6h TTL, day-bucketed keys) ----------------------------
// Only first-turn AI-mode answers are cached (history would change the answer).
// Keys carry the UTC day so the scheduled cleanup can drop whole stale day
// prefixes without reading object bodies.

async function sha256hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function cacheKey(endpoint: string, locale: string, day: string, hash: string): string {
  return `ai/cache/${day}/${endpoint}/${locale}/${hash}`;
}

async function cacheGet(env: Env, endpoint: string, locale: string, question: string): Promise<AskResponse | null> {
  try {
    const day = todayUtc();
    const hash = await sha256hex(`${endpoint}:${locale}:${question.trim().toLowerCase()}`);
    const obj = await env.DATA_BUCKET.get(cacheKey(endpoint, locale, day, hash));
    if (!obj) return null;
    const entry: unknown = JSON.parse(await obj.text());
    if (!entry || typeof entry !== 'object') return null;
    const { expiresAt, payload } = entry as { expiresAt?: number; payload?: AskResponse };
    if (typeof expiresAt !== 'number' || Date.now() > expiresAt || !payload || !payload.answer) return null;
    return payload;
  } catch {
    return null;
  }
}

function cachePut(
  env: Env,
  ctx: ExecutionContext,
  endpoint: string,
  locale: string,
  question: string,
  payload: AskResponse
): void {
  const day = todayUtc();
  ctx.waitUntil(
    sha256hex(`${endpoint}:${locale}:${question.trim().toLowerCase()}`)
      .then((hash) =>
        env.DATA_BUCKET.put(
          cacheKey(endpoint, locale, day, hash),
          JSON.stringify({ expiresAt: Date.now() + ANSWER_CACHE_TTL_SEC * 1000, payload })
        )
      )
      .catch(() => undefined)
  );
}

// --- Daily neuron bookkeeping (R2 counters) ----------------------------------
// Best-effort usage counters behind the reindex budget guard and /quota. The
// RMW races under concurrency (last write wins) — acceptable for damping.

interface QuotaState {
  asks: number;
  embeds: number;
}

function quotaKey(day: string): string {
  return `ai/quota/${day}.json`;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function quotaRead(env: Env): Promise<QuotaState> {
  const state = await readR2Json<Partial<QuotaState>>(env, quotaKey(todayUtc()), {});
  return {
    asks: typeof state.asks === 'number' ? state.asks : 0,
    embeds: typeof state.embeds === 'number' ? state.embeds : 0,
  };
}

function quotaAdd(env: Env, ctx: ExecutionContext, patch: { asks?: number; embeds?: number }): void {
  // Fresh read inside the task minimizes lost updates from concurrent asks.
  ctx.waitUntil(
    (async () => {
      const current = await quotaRead(env);
      const next: QuotaState = {
        asks: current.asks + (patch.asks || 0),
        embeds: current.embeds + (patch.embeds || 0),
      };
      await env.DATA_BUCKET.put(quotaKey(todayUtc()), JSON.stringify(next));
    })().catch(() => undefined)
  );
}

// --- Scheduled R2 housekeeping ------------------------------------------------
// - ai/rl/*: counter windows older than 48h (any window size)
// - ai/cache/<day>/*: whole day prefixes older than the current day (TTL is 6h,
//   so a past-day object is always expired)
// - ai/quota/<day>.json: counters older than QUOTA_KEEP_DAYS

async function cleanupR2(env: Env): Promise<{ rateLimits: number; cache: number; quota: number }> {
  const bucket = env.DATA_BUCKET;
  const nowMs = Date.now();
  const deleted = { rateLimits: 0, cache: 0, quota: 0 };

  // Rate-limit windows
  for (const kind of Object.keys(RATE_LIMITS)) {
    const windowSec = RATE_LIMITS[kind].windowSec;
    const listed = await bucket.list({ prefix: `ai/rl/${kind}/`, limit: 1000 });
    const stale: string[] = [];
    for (const obj of listed.objects || []) {
      const windowId = Number(obj.key.split('/').pop());
      if (Number.isFinite(windowId) && windowId * windowSec * 1000 < nowMs - 48 * 3600 * 1000) {
        stale.push(obj.key);
      }
    }
    for (const key of stale) await bucket.delete(key);
    deleted.rateLimits += stale.length;
  }

  // Answer-cache day buckets
  const today = todayUtc();
  const cacheListed = await bucket.list({ prefix: 'ai/cache/', limit: 1000 });
  const staleDays = new Set<string>();
  for (const obj of cacheListed.objects || []) {
    const day = obj.key.split('/')[2];
    if (day && day !== today) staleDays.add(day);
  }
  for (const day of staleDays) {
    const dayListed = await bucket.list({ prefix: `ai/cache/${day}/`, limit: 1000 });
    for (const obj of dayListed.objects || []) await bucket.delete(obj.key);
    deleted.cache += (dayListed.objects || []).length;
  }

  // Quota counters
  const quotaCutoff = new Date(nowMs - QUOTA_KEEP_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const quotaListed = await bucket.list({ prefix: 'ai/quota/', limit: 100 });
  for (const obj of quotaListed.objects || []) {
    const day = (obj.key.split('/').pop() || '').replace('.json', '');
    if (day && day < quotaCutoff) {
      await bucket.delete(obj.key);
      deleted.quota += 1;
    }
  }

  return deleted;
}

function toEmbeddings(result: unknown): number[][] {
  if (result && typeof result === 'object') {
    const data: unknown = (result as { data?: unknown }).data;
    if (Array.isArray(data)) return data.filter((v): v is number[] => Array.isArray(v));
  }
  if (Array.isArray(result)) return result.filter((v): v is number[] => Array.isArray(v));
  return [];
}

async function embedBatch(texts: string[], env: Env): Promise<number[][]> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < EMBED_ATTEMPTS; attempt++) {
    try {
      const result = await env.AI.run(EMBED_MODEL, { text: texts });
      const vectors = toEmbeddings(result);
      if (vectors.length === texts.length && vectors.every((v) => v.length === EMBED_DIMENSIONS)) {
        return vectors;
      }
      lastError = new Error(`embedding shape mismatch: got ${vectors.length}/${texts.length}`);
    } catch (e) {
      lastError = e;
    }
    await sleep(300 * 2 ** attempt);
  }
  throw lastError instanceof Error ? lastError : new Error('embedding failed');
}

async function embedOne(text: string, env: Env): Promise<number[]> {
  const vectors = await embedBatch([text], env);
  return vectors[0];
}

function chunkMetadata(chunk: CorpusChunk): ChunkMetadata {
  return {
    text: chunk.text.slice(0, 3000),
    url: chunk.url,
    title: chunk.title,
    locale: chunk.locale,
    type: chunk.type,
  };
}

async function retrieve(
  query: string,
  locale: string,
  env: Env,
  topK: number,
  minScore: number
): Promise<RetrievedChunk[]> {
  const vector = await embedOne(query, env);
  const result = await env.VECTORIZE.query(vector, { topK, returnVectors: false, returnMetadata: 'all' });
  const matches = (result?.matches || []).filter(
    (m): m is VectorizeMatch & { metadata: ChunkMetadata } =>
      typeof m.score === 'number' && m.score >= minScore && m.metadata !== undefined
  );
  matches.sort((a, b) => {
    const la = a.metadata.locale === locale ? 0 : 1;
    const lb = b.metadata.locale === locale ? 0 : 1;
    if (la !== lb) return la - lb;
    return b.score - a.score;
  });
  return matches.map((m) => ({ score: m.score, metadata: m.metadata }));
}

function toMatches(retrieved: RetrievedChunk[]): { score: number; text: string; url: string; title: string }[] {
  return retrieved.map((r) => ({
    score: r.score,
    text: r.metadata.text.slice(0, 500),
    url: r.metadata.url,
    title: r.metadata.title,
  }));
}

function toSources(retrieved: RetrievedChunk[]): { title: string; url: string }[] {
  const seen = new Set<string>();
  const sources: { title: string; url: string }[] = [];
  for (const r of retrieved) {
    if (seen.has(r.metadata.url)) continue;
    seen.add(r.metadata.url);
    sources.push({ title: r.metadata.title, url: r.metadata.url });
    if (sources.length >= 6) break;
  }
  return sources;
}

interface ChatMessage {
  role: string;
  content: string;
}

function sanitizeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === 'object' &&
        ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
        typeof (m as ChatMessage).content === 'string'
    )
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
}

async function generateAnswer(
  question: string,
  history: ChatMessage[],
  retrieved: RetrievedChunk[],
  env: Env
): Promise<string> {
  const context = retrieved
    .map((r, i) => `[${i + 1}] ${r.metadata.title} (${r.metadata.url})\n${r.metadata.text}`)
    .join('\n\n');
  const messages: ChatMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nContext:\n${context}` },
    ...history,
    { role: 'user', content: question },
  ];
  const result = await env.AI.run(LLM_MODEL, { messages, stream: false, max_tokens: 500 });
  const answer: unknown = (result as { response?: unknown }).response;
  return typeof answer === 'string' ? answer.trim() : '';
}

interface AskResponse {
  answer: string;
  matches: { score: number; text: string; url: string; title: string }[];
  sources: { title: string; url: string }[];
  mode: string;
  context?: string;
}

const corpusCache = new Map<string, { hash: string; chunks: CorpusChunk[] }>();

async function getCorpusChunks(env: Env, locale: string): Promise<CorpusChunk[]> {
  const origin = siteOrigin(env);
  const manifest = await fetchJson<CorpusManifest>(`${origin}${CORPUS_MANIFEST_PATH}`);
  const entry = manifest.locales.find((l) => l.locale === locale) || manifest.locales.find((l) => l.locale === 'en');
  if (!entry) return [];
  const cached = corpusCache.get(entry.locale);
  if (cached && cached.hash === entry.hash) return cached.chunks;
  const file = await fetchJson<CorpusFile>(`${origin}${entry.file}`);
  const chunks = Array.isArray(file.chunks) ? file.chunks : [];
  corpusCache.set(entry.locale, { hash: entry.hash, chunks });
  return chunks;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function keywordScore(chunk: CorpusChunk, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const title = chunk.title.toLowerCase();
  const body = chunk.text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (body.includes(token)) score += 1;
  }
  return score;
}

async function keywordFallback(question: string, locale: string, env: Env): Promise<AskResponse> {
  let chunks: CorpusChunk[];
  try {
    chunks = await getCorpusChunks(env, locale);
  } catch {
    chunks = [];
  }
  const tokens = tokenize(question);
  const scored: { chunk: CorpusChunk; score: number }[] = [];
  for (const chunk of chunks) {
    const score = keywordScore(chunk, tokens);
    if (score > 0) scored.push({ chunk, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  if (top.length === 0) {
    return { answer: NONE_ANSWER, matches: [], sources: [], mode: 'none' };
  }
  const answer =
    'Here is what I found on our site:\n\n' +
    top.map((t) => `${t.chunk.title}: ${t.chunk.text.slice(0, 350)}…\nRead more: ${t.chunk.url}`).join('\n\n');
  return {
    answer,
    matches: [],
    sources: top.map((t) => ({ title: t.chunk.title, url: t.chunk.url })),
    mode: 'keyword',
  };
}

async function handleAsk(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const limited = await rateLimit(env, ctx, 'ask', request);
  if (limited) return limited;

  const body = await readBody(request);
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  if (!question) return json({ error: 'Question required' }, 400);
  const locale = normalizeLocale(body.locale);
  const history = sanitizeHistory(body.history);

  // Cache hit only for first-turn questions (history changes the answer).
  if (history.length === 0) {
    const cached = await cacheGet(env, 'ask', locale, question);
    if (cached) return json(cached);
  }

  const retrieved = await retrieve(question, locale, env, TOP_K, REL_SCORE_MIN);
  if (retrieved.length > 0) {
    const answer = await generateAnswer(question, history, retrieved, env);
    const payload: AskResponse = {
      answer,
      matches: toMatches(retrieved),
      sources: toSources(retrieved),
      mode: 'ai',
    };
    if (history.length === 0) cachePut(env, ctx, 'ask', locale, question, payload);
    quotaAdd(env, ctx, { asks: 1 });
    return json(payload);
  }
  return json(await keywordFallback(question, locale, env));
}

async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const limited = await rateLimit(env, ctx, 'chat', request);
  if (limited) return limited;

  const body = await readBody(request);
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  if (!question) return json({ error: 'Question required' }, 400);
  const locale = normalizeLocale(body.locale);
  const history = sanitizeHistory(body.history);

  if (history.length === 0) {
    const cached = await cacheGet(env, 'chat', locale, question);
    if (cached) return json({ ...cached, context: cached.context || cached.answer });
  }

  const retrieved = await retrieve(question, locale, env, TOP_K, REL_SCORE_MIN);
  if (retrieved.length > 0) {
    const answer = await generateAnswer(question, history, retrieved, env);
    const context = retrieved.map((r) => `[${r.metadata.title}](${r.metadata.url}): ${r.metadata.text}`).join('\n\n');
    const payload: AskResponse = {
      answer,
      context,
      matches: toMatches(retrieved),
      sources: toSources(retrieved),
      mode: 'ai',
    };
    if (history.length === 0) cachePut(env, ctx, 'chat', locale, question, payload);
    quotaAdd(env, ctx, { asks: 1 });
    return json(payload);
  }
  const fallback = await keywordFallback(question, locale, env);
  return json({ ...fallback, context: fallback.answer });
}

async function handleSearch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const limited = await rateLimit(env, ctx, 'search', request);
  if (limited) return limited;

  const body = await readBody(request);
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return json({ error: 'Query required' }, 400);
  const vector = await embedOne(query, env);
  const result = await env.VECTORIZE.query(vector, { topK: SEARCH_K, returnVectors: false, returnMetadata: 'all' });
  const results = (result?.matches || []).map((m) => ({
    score: m.score,
    title: m.metadata?.title || '',
    url: m.metadata?.url || '',
    snippet: m.metadata?.text?.slice(0, 300) || '',
  }));
  return json({ results });
}

async function handleEmbed(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const limited = await rateLimit(env, ctx, 'embed', request);
  if (limited) return limited;

  const body = await readBody(request);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return json({ error: 'Text required' }, 400);
  const vectors = await embedOne(text, env);
  return json({ vectors, dimensions: vectors.length });
}

async function handleQuota(env: Env): Promise<Response> {
  const usage = await quotaRead(env);
  return json({
    status: 'ok',
    provider: 'workers-ai',
    quota: 'usage-based',
    daily: {
      date: todayUtc(),
      aiAnswers: usage.asks,
      reindexEmbeds: usage.embeds,
      embedBudget: DAILY_EMBED_BUDGET,
    },
    limits: RATE_LIMITS,
  });
}

function handleSitemap(env: Env): Response {
  const baseUrl = siteOrigin(env);
  return json({
    pages: [`${baseUrl}/`, ...LOCALES.filter((l) => l !== 'en').map((l) => `${baseUrl}/${l}/`)],
  });
}

async function appendReindexLog(env: Env, entry: Record<string, unknown>): Promise<void> {
  const log = await readR2Json<{ runs?: Record<string, unknown>[] }>(env, LOG_KEY, { runs: [] });
  const runs = Array.isArray(log.runs) ? log.runs : [];
  runs.push(entry);
  await writeR2Json(env, LOG_KEY, { runs: runs.slice(-LOG_KEEP) });
}

async function runReindexSlice(env: Env, opts: { force?: boolean; reset?: boolean }): Promise<ReindexProgress> {
  const origin = siteOrigin(env);
  const manifest = await fetchJson<CorpusManifest>(`${origin}${CORPUS_MANIFEST_PATH}`);
  if (manifest.model !== EMBED_MODEL || manifest.dimensions !== EMBED_DIMENSIONS) {
    throw new Error(
      `corpus mismatch: manifest has ${manifest.model}/${manifest.dimensions}, worker expects ${EMBED_MODEL}/${EMBED_DIMENSIONS}`
    );
  }
  const [state, meta] = await Promise.all([
    readR2Json<ReindexState>(env, STATE_KEY, { status: 'idle', queue: [] }),
    readR2Json<Record<string, LocaleMeta>>(env, META_KEY, {}),
  ]);

  let queue: QueueItem[] = Array.isArray(state.queue) ? state.queue : [];
  const rebuildQueue = opts.force === true || opts.reset === true || state.status !== 'running';
  if (rebuildQueue) {
    queue = manifest.locales
      .filter((l) => opts.force === true || meta[l.locale]?.hash !== l.hash)
      .map((l) => ({ locale: l.locale, file: l.file, hash: l.hash, total: l.chunks, cursor: 0 }));
  }

  if (queue.length === 0) {
    if (state.status === 'running') {
      await appendReindexLog(env, {
        at: new Date().toISOString(),
        startedAt: state.startedAt,
        processed: state.processed || {},
        note: 'queue drained',
      });
    }
    await writeR2Json(env, STATE_KEY, { status: 'idle', queue: [] });
    return { done: true, status: 'up-to-date', processed: state.processed || {}, remaining: [] };
  }

  const startedAt = state.startedAt || new Date().toISOString();
  // Daily embed budget: pause (resumable) instead of burning past the cap.
  const quota = await quotaRead(env);
  let budget = Math.min(REINDEX_SLICE_CHUNKS, DAILY_EMBED_BUDGET - quota.embeds);
  if (budget <= 0) {
    const remaining = queue.map((q) => ({ locale: q.locale, remaining: Math.max(0, q.total - q.cursor) }));
    return {
      done: false,
      status: 'paused-budget',
      paused: 'budget',
      resumeAt: `${new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}T00:05:00Z`,
      processed: {},
      remaining,
    };
  }
  const processed: Record<string, number> = {};
  let deletes = 0;

  while (queue.length > 0 && budget > 0) {
    const head = queue[0];
    const corpus = await fetchJson<CorpusFile>(`${origin}${head.file}`);
    const slice = corpus.chunks.slice(head.cursor, head.cursor + budget);
    if (slice.length > 0) {
      for (let i = 0; i < slice.length; i += EMBED_BATCH) {
        const part = slice.slice(i, i + EMBED_BATCH);
        const vectors = await embedBatch(
          part.map((c) => c.text),
          env
        );
        const toUpsert: VectorizeVector[] = part.map((c, j) => ({
          id: c.id,
          values: vectors[j],
          metadata: chunkMetadata(c),
        }));
        for (let u = 0; u < toUpsert.length; u += UPSERT_BATCH) {
          await env.VECTORIZE.upsert(toUpsert.slice(u, u + UPSERT_BATCH));
        }
      }
      head.cursor += slice.length;
      budget -= slice.length;
      processed[head.locale] = (processed[head.locale] || 0) + slice.length;
    }
    if (head.cursor >= head.total || head.cursor >= corpus.chunks.length) {
      const newIds = corpus.chunks.map((c) => c.id);
      const newIdSet = new Set(newIds);
      const staleIds = (meta[head.locale]?.ids || []).filter((id) => !newIdSet.has(id));
      for (let d = 0; d < staleIds.length; d += UPSERT_BATCH) {
        await env.VECTORIZE.deleteByIds(staleIds.slice(d, d + UPSERT_BATCH));
        deletes += staleIds.slice(d, d + UPSERT_BATCH).length;
      }
      meta[head.locale] = { hash: head.hash, count: newIds.length, ids: newIds };
      queue.shift();
    }
  }

  const done = queue.length === 0;
  const mergedProcessed: Record<string, number> = { ...(state.processed || {}) };
  for (const [k, v] of Object.entries(processed)) {
    mergedProcessed[k] = (mergedProcessed[k] || 0) + v;
  }
  const processedTotal = Object.values(processed).reduce((acc, n) => acc + n, 0);
  if (processedTotal > 0) {
    try {
      await env.DATA_BUCKET.put(
        quotaKey(todayUtc()),
        JSON.stringify({ asks: quota.asks, embeds: quota.embeds + processedTotal })
      );
    } catch {
      // bookkeeping only — the rebuild itself already succeeded
    }
  }

  if (done) {
    await appendReindexLog(env, {
      at: new Date().toISOString(),
      startedAt,
      processed: mergedProcessed,
      staleDeleted: deletes,
    });
  }
  await writeR2Json(env, META_KEY, meta);
  await writeR2Json(env, STATE_KEY, {
    status: done ? 'idle' : 'running',
    queue,
    startedAt,
    updatedAt: new Date().toISOString(),
    processed: mergedProcessed,
  });
  return {
    done,
    status: done ? 'done' : 'running',
    processed,
    remaining: queue.map((q) => ({ locale: q.locale, remaining: Math.max(0, q.total - q.cursor) })),
  };
}

async function handleReindex(request: Request, env: Env): Promise<Response> {
  if (!env.REINDEX_TOKEN) return json({ error: 'Not found' }, 404);
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !safeEqual(token, env.REINDEX_TOKEN)) return json({ error: 'Unauthorized' }, 401);
  const body = await readBody(request);
  const progress = await runReindexSlice(env, {
    force: body.force === true,
    reset: body.reset === true,
  });
  // 503 + paused: callers (CI/cron) should stop retrying for the day — the
  // rebuild resumes automatically at the next daily cron.
  if (progress.status === 'paused-budget') return json(progress, 503);
  return json(progress);
}

async function runCronSweep(env: Env): Promise<void> {
  const started = Date.now();
  try {
    const cleaned = await cleanupR2(env);
    console.log('[cron] r2 cleanup:', JSON.stringify(cleaned));
  } catch (e) {
    console.error('[cron] r2 cleanup failed:', e);
  }
  for (let slices = 0; slices < CRON_MAX_SLICES; slices++) {
    const progress = await runReindexSlice(env, {});
    if (progress.done) return;
    // Budget pause → resume at the next daily cron, don't spin the loop.
    if (progress.status === 'paused-budget') {
      console.log('[cron] reindex paused (daily embed budget) — resuming next run');
      return;
    }
    if (Date.now() - started > CRON_MAX_MS) return;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      switch (path) {
        case '/chat':
          return await handleChat(request, env, ctx);
        case '/ask':
          return await handleAsk(request, env, ctx);
        case '/search':
          return await handleSearch(request, env, ctx);
        case '/embed':
          return await handleEmbed(request, env, ctx);
        case '/reindex':
        case '/ai/reindex':
          return await handleReindex(request, env);
        case '/quota':
        case '/ai/quota':
          return await handleQuota(env);
        case '/sitemap':
        case '/ai/sitemap':
          return handleSitemap(env);
        default:
          return json({ error: 'Not found' }, 404);
      }
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCronSweep(env));
  },
};
