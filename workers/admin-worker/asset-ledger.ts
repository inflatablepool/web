import * as yaml from 'js-yaml';

export const ASSET_TYPES = ['product_photo', 'company_photo', 'brand_asset', 'ai_illustration', 'reference', 'unconfirmed'] as const;
export const ASSET_LICENSES = [
  'company_owned',
  'supplier_authorized',
  'licensed_stock',
  'ai_generated',
  'public_domain',
  'unverified',
] as const;
export const REVIEW_STATUSES = ['approved', 'pending', 'rejected'] as const;

export interface AssetLedgerEntry {
  path: string;
  storage: 'repo' | 'r2';
  type: (typeof ASSET_TYPES)[number];
  source: string;
  license: (typeof ASSET_LICENSES)[number];
  reviewStatus: (typeof REVIEW_STATUSES)[number];
  legacyBaseline: boolean;
  approvedBy: string;
  approvedAt: string;
  notes: string;
}

export interface AssetLedger {
  version: number;
  updated: string;
  assets: AssetLedgerEntry[];
}

export interface GithubContext {
  token: string;
  owner: string;
  repo: string;
  api: string;
}

const LEDGER_PATH = 'src/data/site/asset-ledger.yaml';
const USAGE_PATH = 'src/data/site/asset-usage.json';

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

async function readRepoFile(
  ctx: GithubContext,
  filePath: string,
  branch: string
): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(`${ctx.api}/contents/${filePath}?ref=${branch}`, { headers: ghHeaders(ctx.token) });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  if (!data?.content || data.encoding !== 'base64') return null;
  return { sha: data.sha, content: decodeBase64(data.content) };
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

export function sanitizeLedger(input: unknown): AssetLedger {
  const raw = input as any;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.assets)) {
    throw new Error('ledger.assets must be an array');
  }
  if (raw.assets.length > 500) throw new Error('ledger has too many entries');

  const seen = new Set<string>();
  const assets: AssetLedgerEntry[] = [];

  for (const item of raw.assets) {
    const assetPath = text(item?.path, 500);
    if (!assetPath.startsWith('/images/')) throw new Error(`invalid asset path: ${assetPath || '(empty)'}`);
    if (seen.has(assetPath)) throw new Error(`duplicate asset path: ${assetPath}`);
    seen.add(assetPath);

    const storage = item?.storage === 'r2' ? 'r2' : 'repo';
    const type = enumValue(item?.type, ASSET_TYPES);
    if (!type) throw new Error(`${assetPath}: invalid type`);
    const license = enumValue(item?.license, ASSET_LICENSES);
    if (!license) throw new Error(`${assetPath}: invalid license`);
    const reviewStatus = enumValue(item?.reviewStatus, REVIEW_STATUSES);
    if (!reviewStatus) throw new Error(`${assetPath}: invalid reviewStatus`);

    const source = text(item?.source, 2000);
    const approvedBy = text(item?.approvedBy, 200);
    const approvedAt = text(item?.approvedAt, 10);
    const notes = text(item?.notes, 4000);

    if (reviewStatus === 'approved') {
      if (license === 'unverified') throw new Error(`${assetPath}: approved asset needs a concrete license`);
      if (!source) throw new Error(`${assetPath}: approved asset needs a source`);
      if (!approvedBy) throw new Error(`${assetPath}: approved asset needs approvedBy`);
      if (!isDate(approvedAt)) throw new Error(`${assetPath}: approved asset needs approvedAt (YYYY-MM-DD)`);
    }

    assets.push({
      path: assetPath,
      storage,
      type,
      source,
      license,
      reviewStatus,
      legacyBaseline: item?.legacyBaseline === true,
      approvedBy,
      approvedAt,
      notes,
    });
  }

  return { version: 1, updated: new Date().toISOString().split('T')[0], assets };
}

export async function getAssetLedger(ctx: GithubContext, request: Request): Promise<Response> {
  const requested = new URL(request.url).searchParams.get('branch');
  const branch = requested === 'main' ? 'main' : 'draft';

  let file = await readRepoFile(ctx, LEDGER_PATH, branch);
  let sourceBranch = branch;
  if (!file) {
    file = await readRepoFile(ctx, LEDGER_PATH, 'main');
    sourceBranch = 'main';
  }
  if (!file) return json({ success: false, error: 'asset-ledger.yaml not found in draft or main' }, 404);

  let ledger: AssetLedger;
  try {
    const parsed = yaml.load(file.content) as any;
    if (!parsed || !Array.isArray(parsed.assets)) throw new Error('invalid ledger shape');
    ledger = parsed as AssetLedger;
  } catch (error) {
    return json({ success: false, error: `Invalid ledger YAML: ${String(error)}` }, 500);
  }

  let usage: { assets: Record<string, string[]> } = { assets: {} };
  const usageFile = (await readRepoFile(ctx, USAGE_PATH, sourceBranch)) || (await readRepoFile(ctx, USAGE_PATH, 'main'));
  if (usageFile) {
    try {
      const parsed = JSON.parse(usageFile.content);
      if (parsed && typeof parsed === 'object' && parsed.assets && typeof parsed.assets === 'object') {
        usage = parsed;
      }
    } catch {
      /* keep empty usage */
    }
  }

  return json({ success: true, branch: sourceBranch, sha: file.sha, ledger, usage });
}

export async function saveAssetLedger(
  ctx: GithubContext,
  request: Request,
  ensureBranch: (token: string, owner: string, repo: string, branch: string) => Promise<{ ok: boolean; error?: string }>
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  // Reviewers always write to the draft branch; publishing merges draft → main.
  const branch = 'draft';
  let ledger: AssetLedger;
  try {
    ledger = sanitizeLedger(body?.ledger);
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }

  const ensured = await ensureBranch(ctx.token, ctx.owner, ctx.repo, branch);
  if (!ensured.ok) return json({ success: false, error: ensured.error || 'Branch error' }, 500);

  let sha = '';
  const current = await readRepoFile(ctx, LEDGER_PATH, branch);
  if (current) {
    if (typeof body?.sha === 'string' && body.sha && body.sha !== current.sha) {
      return json({ success: false, error: 'Draft changed since this page loaded. Reload before saving.' }, 409);
    }
    sha = current.sha;
  }

  const content = yaml.dump(ledger, { lineWidth: -1, noRefs: true, sortKeys: false });
  const res = await fetch(`${ctx.api}/contents/${LEDGER_PATH}`, {
    method: 'PUT',
    headers: { ...ghHeaders(ctx.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text(body?.commitMessage, 200) || 'Update asset licence ledger',
      content: encodeBase64(content),
      sha: sha || undefined,
      branch,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    return json({ success: false, error: `GitHub update failed: ${data?.message || res.status}` }, res.status);
  }

  return json({ success: true, branch, sha: data?.content?.sha || '' });
}
