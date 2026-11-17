import * as yaml from 'js-yaml';

export const REVIEW_STATUSES = ['draft', 'published', 'rejected'] as const;
export const CHECK_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const TRANSLATION_STATUSES = ['pending', 'approved', 'rejected', 'not_required'] as const;
export const CLAIM_STATUSES = ['verified', 'unverified', 'rejected'] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface ContentSource {
  label: string;
  url: string;
  accessedAt: string;
}

export interface ContentClaim {
  statement: string;
  evidence: string;
  status: ClaimStatus;
}

export interface TranslationReview {
  lang: string;
  status: TranslationStatus;
  reviewedBy: string;
  reviewedAt: string;
}

export interface ReviewHistoryEntry {
  at: string;
  by: string;
  action: string;
}

export interface ContentReview {
  id: string;
  title: string;
  status: ReviewStatus;
  model: string;
  generatedBy: string;
  generatedAt: string;
  files: string[];
  sources: ContentSource[];
  claims: ContentClaim[];
  factCheckStatus: CheckStatus;
  humanReviewStatus: CheckStatus;
  translationReviewStatus: TranslationStatus;
  translations: TranslationReview[];
  notes: string;
  publishedBy: string;
  publishedAt: string;
  history: ReviewHistoryEntry[];
}

export interface ContentReviewLedger {
  version: number;
  updated: string;
  publishers: string[];
  reviews: ContentReview[];
}

export interface GithubContext {
  token: string;
  owner: string;
  repo: string;
  api: string;
}

export interface AdminIdentity {
  email: string;
}

const LEDGER_PATH = 'src/data/site/ai-content-reviews.yaml';
const DEFAULT_PUBLISHERS = ['info@inflatablepoolfactory.com'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function decodeBase64(content: string): string {
  const binary = atob(content.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function ghHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'User-Agent': 'inflatable-pool-factory-admin' };
}

async function readRepoFileStatus(
  ctx: GithubContext,
  filePath: string,
  branch: string
): Promise<{ status: number; file: { sha: string; content: string } | null }> {
  const res = await fetch(`${ctx.api}/contents/${filePath}?ref=${branch}`, { headers: ghHeaders(ctx.token) });
  if (!res.ok) return { status: res.status, file: null };
  const data = (await res.json()) as any;
  if (!data?.content || data.encoding !== 'base64') return { status: 200, file: null };
  return { status: 200, file: { sha: data.sha, content: decodeBase64(data.content) } };
}

async function readRepoFile(
  ctx: GithubContext,
  filePath: string,
  branch: string
): Promise<{ sha: string; content: string } | null> {
  const result = await readRepoFileStatus(ctx, filePath, branch);
  return result.file;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T): T[number] | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function languageForPath(filePath: string): string {
  const match = /^src\/data\/pages\/([a-z]{2})\//.exec(filePath);
  return match ? match[1] : 'en';
}

function sanitizeReview(raw: any, seen: Set<string>): ContentReview {
  const id = text(raw?.id, 90).toLowerCase();
  if (!/^ai-[a-z0-9][a-z0-9-]{2,80}$/.test(id)) throw new Error(`invalid review id: ${id || '(empty)'}`);
  if (seen.has(id)) throw new Error(`duplicate review id: ${id}`);
  seen.add(id);

  const status = enumValue(raw?.status, REVIEW_STATUSES);
  if (!status) throw new Error(`${id}: invalid status`);

  const factCheckStatus = enumValue(raw?.factCheckStatus, CHECK_STATUSES);
  if (!factCheckStatus) throw new Error(`${id}: invalid factCheckStatus`);
  const humanReviewStatus = enumValue(raw?.humanReviewStatus, CHECK_STATUSES);
  if (!humanReviewStatus) throw new Error(`${id}: invalid humanReviewStatus`);
  const translationReviewStatus = enumValue(raw?.translationReviewStatus, TRANSLATION_STATUSES);
  if (!translationReviewStatus) throw new Error(`${id}: invalid translationReviewStatus`);

  const files = (Array.isArray(raw?.files) ? raw.files : []).map((file: unknown) => text(file, 300)).filter(Boolean);
  if (files.length === 0) throw new Error(`${id}: files[] is required`);
  if (files.length > 60) throw new Error(`${id}: too many files`);
  for (const file of files) {
    if (!file.startsWith('src/') || !/\.(md|mdx|ya?ml)$/i.test(file) || file.includes('..')) {
      throw new Error(`${id}: invalid content file "${file}"`);
    }
  }

  const sources: ContentSource[] = (Array.isArray(raw?.sources) ? raw.sources : []).map((source: any) => ({
    label: text(source?.label, 300),
    url: text(source?.url, 1000),
    accessedAt: text(source?.accessedAt, 10),
  }));
  if (sources.length > 50) throw new Error(`${id}: too many sources`);
  for (const source of sources) {
    if (!source.label) throw new Error(`${id}: every source needs a label`);
    if (source.accessedAt && !isDate(source.accessedAt)) {
      throw new Error(`${id}: source accessedAt must be YYYY-MM-DD`);
    }
  }

  const claims: ContentClaim[] = (Array.isArray(raw?.claims) ? raw.claims : []).map((claim: any) => {
    const claimStatus = enumValue(claim?.status, CLAIM_STATUSES);
    if (!claimStatus) throw new Error(`${id}: invalid claim status`);
    return {
      statement: text(claim?.statement, 1000),
      evidence: text(claim?.evidence, 1000),
      status: claimStatus,
    };
  });
  if (claims.length > 50) throw new Error(`${id}: too many claims`);
  for (const claim of claims) {
    if (!claim.statement) throw new Error(`${id}: every claim needs a statement`);
    if (claim.status === 'verified' && !claim.evidence) {
      throw new Error(`${id}: verified claims need evidence`);
    }
  }

  const translations: TranslationReview[] = (Array.isArray(raw?.translations) ? raw.translations : []).map(
    (translation: any) => {
      const lang = text(translation?.lang, 2).toLowerCase();
      if (!/^[a-z]{2}$/.test(lang)) throw new Error(`${id}: invalid translation lang`);
      const translationStatus = enumValue(translation?.status, TRANSLATION_STATUSES);
      if (!translationStatus) throw new Error(`${id}: invalid translation status`);
      return {
        lang,
        status: translationStatus,
        reviewedBy: text(translation?.reviewedBy, 200),
        reviewedAt: text(translation?.reviewedAt, 10),
      };
    }
  );
  if (translations.length > 60) throw new Error(`${id}: too many translations`);
  for (const translation of translations) {
    if (translation.status === 'approved' && (!translation.reviewedBy || !isDate(translation.reviewedAt))) {
      throw new Error(`${id}: approved translation ${translation.lang} needs reviewedBy and reviewedAt`);
    }
  }

  const generatedAt = text(raw?.generatedAt, 10);
  if (generatedAt && !isDate(generatedAt)) throw new Error(`${id}: generatedAt must be YYYY-MM-DD`);

  const history: ReviewHistoryEntry[] = (Array.isArray(raw?.history) ? raw.history : [])
    .slice(-100)
    .map((entry: any) => ({
      at: text(entry?.at, 40),
      by: text(entry?.by, 200),
      action: text(entry?.action, 100),
    }))
    .filter((entry: ReviewHistoryEntry) => entry.at && entry.by && entry.action);

  return {
    id,
    title: text(raw?.title, 300) || id,
    status,
    model: text(raw?.model, 200),
    generatedBy: text(raw?.generatedBy, 200),
    generatedAt,
    files,
    sources,
    claims,
    factCheckStatus,
    humanReviewStatus,
    translationReviewStatus,
    translations,
    notes: text(raw?.notes, 4000),
    publishedBy: '',
    publishedAt: '',
    history,
  };
}

export function sanitizeContentLedger(input: unknown): ContentReviewLedger {
  const raw = input as any;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.reviews)) {
    throw new Error('ledger.reviews must be an array');
  }
  if (raw.reviews.length > 200) throw new Error('ledger has too many reviews');

  const publishers = (Array.isArray(raw.publishers) ? raw.publishers : [])
    .map((publisher: unknown) => text(publisher, 200))
    .filter(Boolean);
  for (const publisher of publishers) {
    if (!isEmail(publisher)) throw new Error(`invalid publisher email: ${publisher}`);
  }

  const seen = new Set<string>();
  const reviews = raw.reviews.map((review: unknown) => sanitizeReview(review, seen));

  return {
    version: 1,
    updated: new Date().toISOString().split('T')[0],
    publishers: publishers.length > 0 ? publishers : [...DEFAULT_PUBLISHERS],
    reviews,
  };
}

export function parseContentLedger(content: string): ContentReviewLedger {
  const parsed = yaml.load(content) as any;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.reviews)) {
    throw new Error('invalid ledger shape');
  }
  return {
    version: Number(parsed.version) || 1,
    updated: typeof parsed.updated === 'string' ? parsed.updated : '',
    publishers: Array.isArray(parsed.publishers)
      ? parsed.publishers.map((publisher: unknown) => String(publisher || '').trim()).filter(Boolean)
      : [],
    reviews: parsed.reviews as ContentReview[],
  };
}

export function validatePublishable(review: ContentReview, publishers: string[]): void {
  if (!publishers.includes(review.publishedBy)) {
    throw new Error(`${review.id}: ${review.publishedBy || 'publisher'} is not in publishers[]`);
  }
  if (review.factCheckStatus !== 'approved') {
    throw new Error(`${review.id}: factCheckStatus must be approved`);
  }
  if (review.humanReviewStatus !== 'approved') {
    throw new Error(`${review.id}: humanReviewStatus must be approved`);
  }
  if (review.sources.length === 0) throw new Error(`${review.id}: at least one source is required`);
  if (review.claims.length === 0 || review.claims.some((claim) => claim.status !== 'verified' || !claim.evidence)) {
    throw new Error(`${review.id}: every claim must be verified with evidence`);
  }

  const nonEnglish = [...new Set(review.files.map(languageForPath))].filter((lang) => lang !== 'en');
  if (nonEnglish.length === 0) {
    if (!['approved', 'not_required'].includes(review.translationReviewStatus)) {
      throw new Error(`${review.id}: translationReviewStatus must be approved or not_required`);
    }
  } else {
    if (review.translationReviewStatus !== 'approved') {
      throw new Error(`${review.id}: translationReviewStatus must be approved for multilingual content`);
    }
    for (const lang of nonEnglish) {
      const translation = review.translations.find((item) => item.lang === lang);
      if (
        !translation ||
        translation.status !== 'approved' ||
        !translation.reviewedBy ||
        !isDate(translation.reviewedAt)
      ) {
        throw new Error(`${review.id}: translation ${lang} needs an approved human review`);
      }
    }
  }

  if (!isDate(review.publishedAt)) throw new Error(`${review.id}: publishedAt is required`);
  if (review.history.length === 0) throw new Error(`${review.id}: history[] is required`);
}

export function applyPublishState(
  ledger: ContentReviewLedger,
  previous: ContentReviewLedger | null,
  adminEmail: string
): ContentReviewLedger {
  const publishers = previous?.publishers?.length ? previous.publishers : ledger.publishers;
  if (publishers.length === 0) throw new Error('publishers[] must list at least one human publisher email');

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const previousById = new Map((previous?.reviews || []).map((review) => [review.id, review]));

  const signature = (review: ContentReview): string =>
    JSON.stringify({
      status: review.status,
      title: review.title,
      model: review.model,
      generatedBy: review.generatedBy,
      generatedAt: review.generatedAt,
      files: review.files,
      sources: review.sources,
      claims: review.claims,
      factCheckStatus: review.factCheckStatus,
      humanReviewStatus: review.humanReviewStatus,
      translationReviewStatus: review.translationReviewStatus,
      translations: review.translations,
      notes: review.notes,
    });

  for (const review of ledger.reviews) {
    const prior = previousById.get(review.id);

    if (review.status === 'published') {
      if (!publishers.includes(adminEmail)) {
        throw new Error(`${adminEmail || 'current user'} is not in the publishers whitelist`);
      }
      if (prior?.status === 'published') {
        review.publishedBy = prior.publishedBy || adminEmail;
        review.publishedAt = prior.publishedAt || today;
      } else {
        review.publishedBy = adminEmail;
        review.publishedAt = today;
      }
    } else {
      review.publishedBy = prior?.publishedBy || '';
      review.publishedAt = prior?.publishedAt || '';
    }

    const history = prior?.history ? [...prior.history] : [];
    if (!prior) {
      history.push({ at: now, by: adminEmail, action: 'created' });
    } else if (prior.status !== review.status) {
      history.push({ at: now, by: adminEmail, action: `status:${review.status}` });
    } else if (signature(prior) !== signature(review)) {
      history.push({ at: now, by: adminEmail, action: 'edited' });
    }
    review.history = history.slice(-100);
  }

  return { ...ledger, publishers };
}

export async function getContentReview(
  ctx: GithubContext,
  admin: AdminIdentity,
  request: Request
): Promise<Response> {
  const requested = new URL(request.url).searchParams.get('branch');
  const branch = requested === 'main' ? 'main' : 'draft';

  let file = await readRepoFile(ctx, LEDGER_PATH, branch);
  let sourceBranch = branch;
  if (!file) {
    file = await readRepoFile(ctx, LEDGER_PATH, 'main');
    sourceBranch = 'main';
  }
  if (!file) return json({ success: false, error: 'ai-content-reviews.yaml not found in draft or main' }, 404);

  let ledger: ContentReviewLedger;
  try {
    ledger = parseContentLedger(file.content);
  } catch (error) {
    return json({ success: false, error: `Invalid ledger YAML: ${error instanceof Error ? error.message : String(error)}` }, 500);
  }

  return json({
    success: true,
    branch: sourceBranch,
    sha: file.sha,
    ledger,
    adminEmail: admin.email,
    canPublish: ledger.publishers.includes(admin.email),
  });
}

export async function saveContentReview(
  ctx: GithubContext,
  request: Request,
  admin: AdminIdentity,
  ensureBranch: (token: string, owner: string, repo: string, branch: string) => Promise<{ ok: boolean; error?: string }>
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  let ledger: ContentReviewLedger;
  try {
    ledger = sanitizeContentLedger(body?.ledger);
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }

  // Reviewers always write to the draft branch; publishing merges draft → main.
  const branch = 'draft';
  const ensured = await ensureBranch(ctx.token, ctx.owner, ctx.repo, branch);
  if (!ensured.ok) return json({ success: false, error: ensured.error || 'Branch error' }, 500);

  const currentFile = await readRepoFile(ctx, LEDGER_PATH, branch);
  if (currentFile && typeof body?.sha === 'string' && body.sha && body.sha !== currentFile.sha) {
    return json({ success: false, error: 'Draft changed since this page loaded. Reload before saving.' }, 409);
  }

  let previous: ContentReviewLedger | null = null;
  if (currentFile) {
    try {
      previous = parseContentLedger(currentFile.content);
    } catch (error) {
      return json(
        { success: false, error: `Draft AI review ledger is invalid: ${error instanceof Error ? error.message : String(error)}` },
        500
      );
    }
  } else {
    const mainFile = await readRepoFile(ctx, LEDGER_PATH, 'main');
    if (mainFile) {
      try {
        previous = parseContentLedger(mainFile.content);
      } catch {
        previous = null;
      }
    }
  }

  try {
    ledger = applyPublishState(ledger, previous, admin.email);
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 403);
  }

  try {
    for (const review of ledger.reviews) {
      if (review.status === 'published') validatePublishable(review, ledger.publishers);
    }
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }

  const content = yaml.dump(ledger, { lineWidth: -1, noRefs: true, sortKeys: false });
  const res = await fetch(`${ctx.api}/contents/${LEDGER_PATH}`, {
    method: 'PUT',
    headers: { ...ghHeaders(ctx.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text(body?.commitMessage, 200) || 'Update AI content review ledger',
      content: encodeBase64(content),
      sha: currentFile?.sha || undefined,
      branch,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    return json({ success: false, error: `GitHub update failed: ${data?.message || res.status}` }, res.status);
  }

  return json({
    success: true,
    branch,
    sha: data?.content?.sha || '',
    canPublish: ledger.publishers.includes(admin.email),
  });
}

/**
 * Guard for /api/admin/publish. The generic Publish button merges the whole
 * draft branch; it must not carry unpublished AI content or a self-edited
 * publisher whitelist.
 */
export async function checkContentReviewPublishGuard(ctx: GithubContext): Promise<string | null> {
  const draftRead = await readRepoFileStatus(ctx, LEDGER_PATH, 'draft');
  if (draftRead.status === 404) return null;
  if (draftRead.status !== 200 || !draftRead.file) {
    return `Cannot read draft AI review ledger (GitHub ${draftRead.status}); refusing to merge.`;
  }

  let draft: ContentReviewLedger;
  try {
    draft = parseContentLedger(draftRead.file.content);
  } catch {
    return 'Draft AI review ledger is invalid; fix it before publishing.';
  }

  const mainRead = await readRepoFileStatus(ctx, LEDGER_PATH, 'main');
  if (mainRead.status !== 200 && mainRead.status !== 404) {
    return `Cannot read main AI review ledger (GitHub ${mainRead.status}); refusing to merge.`;
  }
  let main: ContentReviewLedger | null = null;
  if (mainRead.file) {
    try {
      main = parseContentLedger(mainRead.file.content);
    } catch {
      return 'Main AI review ledger is invalid; fix it before publishing.';
    }
  }

  const mainPublishers = JSON.stringify([...(main?.publishers || [])].sort());
  const draftPublishers = JSON.stringify([...draft.publishers].sort());
  if (mainPublishers !== draftPublishers) {
    return 'publishers[] changed on draft. The admin Publish button cannot change the publisher whitelist — open a pull request instead.';
  }

  for (const review of draft.reviews) {
    if (review.status === 'published') continue;
    for (const file of review.files || []) {
      const res = await fetch(`${ctx.api}/contents/${file}?ref=draft`, { headers: ghHeaders(ctx.token) });
      if (res.ok) {
        return `AI content "${review.id}" is still ${review.status}; ${file} is on draft. Publish the review or remove the file before merging.`;
      }
      if (res.status !== 404) {
        return `Cannot verify AI content draft "${review.id}" (GitHub ${res.status}); refusing to merge.`;
      }
    }
  }

  return null;
}
