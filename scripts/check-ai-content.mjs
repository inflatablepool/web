// AI content review gate.
//
// AI-assisted content must declare its provenance in the file itself:
//
//   aiGenerated: true
//   aiReview: ai-2026-11-17-example
//
// The marker points at a record in src/data/site/ai-content-reviews.yaml.
// A record only becomes deployable when it is `published` and carries verified
// sources, fact-checked claims, human review, translation review and a
// publisher from the whitelist. AI must never invent product specs,
// certifications or production capacity: every high-risk token in a published
// file must be covered by a verified claim.
//
// Modes:
//   (default)  structural validation; unpublished AI content in the tree warns
//   --strict   deploy gate; unpublished AI content and stale records fail
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load as yamlLoad } from 'js-yaml';
import matter from 'gray-matter';
import { globSync } from 'glob';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LEDGER_PATH = path.join(ROOT, 'src', 'data', 'site', 'ai-content-reviews.yaml');

export const REVIEW_STATUSES = ['draft', 'published', 'rejected'];
export const CHECK_STATUSES = ['pending', 'approved', 'rejected'];
export const TRANSLATION_STATUSES = ['pending', 'approved', 'rejected', 'not_required'];
export const CLAIM_STATUSES = ['verified', 'unverified', 'rejected'];

const SCAN_EXCLUDES = new Set(['src/data/site/ai-content-reviews.yaml', 'src/data/site/asset-ledger.yaml']);

// Tokens that represent commercial facts an AI must never invent. Published
// AI content must cover each token with a verified claim (statement/evidence).
const RISK_PATTERNS = [
  /\bISO\s?\d{4,5}(?::\d{4})?\b/gi,
  /\bASTM\s?[A-Z]\d{2,5}\b/gi,
  /\bEN\s?\d{3,5}(?:-\d+)?\b/gi,
  /\b(?:CE|RoHS|REACH|SGS|TÜV|TUV|BSCI|FDA|UL|ETL|CSA)\b/g,
  /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|kg|MPa|kPa|PSI|bar|kW|W|L|mL|pcs|pieces|units|inch|in|ft|feet|°C)\b/g,
  /\b\d[\d,]*\s*(?:pcs|pieces|units|containers?|m²|m2)\s*(?:\/|per)\s*(?:day|week|month|year)\b/gi,
];

export function languageFor(filePath) {
  const match = /^src\/data\/pages\/([a-z]{2})\//.exec(filePath);
  return match ? match[1] : 'en';
}

function walkMarkers(node, depth, markers) {
  if (!node || typeof node !== 'object' || depth > 8) return;
  if (Array.isArray(node)) {
    for (const item of node) walkMarkers(item, depth + 1, markers);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'aiReview' && typeof value === 'string' && value.trim()) markers.reviews.add(value.trim());
    if (key === 'aiGenerated' && value === true) markers.aiGenerated = true;
    walkMarkers(value, depth + 1, markers);
  }
}

export function collectMarkers(data) {
  const markers = { reviews: new Set(), aiGenerated: false };
  walkMarkers(data, 0, markers);
  return markers;
}

/**
 * Scan content files for aiReview / aiGenerated markers. Only marked files are
 * returned; all other files are implicitly human-authored.
 */
export function scanContentFiles(root = ROOT) {
  const files = globSync('src/{content,data}/**/*.{md,mdx,yaml,yml}', { cwd: root, nodir: true });
  const entries = [];
  for (const rel of files.sort()) {
    const normalized = rel.split(path.sep).join('/');
    if (SCAN_EXCLUDES.has(normalized)) continue;
    const extension = path.extname(normalized).toLowerCase();
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    let data;
    try {
      data = extension === '.md' || extension === '.mdx' ? matter(text).data : yamlLoad(text);
    } catch {
      // Invalid YAML is also a build failure; do not crash the provenance gate.
      // If the file claims AI provenance we still fail loudly instead of
      // silently skipping the marker.
      if (/\baiReview\b|\baiGenerated\b/.test(text)) {
        entries.push({
          path: normalized,
          text,
          markers: new Set(),
          aiGenerated: false,
          lang: languageFor(normalized),
          parseError: true,
        });
      }
      continue;
    }
    const markers = collectMarkers(data);
    if (markers.reviews.size === 0 && !markers.aiGenerated) continue;
    entries.push({
      path: normalized,
      text,
      markers: markers.reviews,
      aiGenerated: markers.aiGenerated,
      lang: languageFor(normalized),
    });
  }
  return entries;
}

export function extractRiskTokens(text) {
  const stripped = String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\]\([^)]*\)/g, ']');
  const tokens = new Set();
  for (const pattern of RISK_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(stripped))) {
      const token = match[0].replace(/\s+/g, ' ').trim();
      if (token) tokens.add(token);
    }
  }
  return [...tokens];
}

export function normalizeRiskToken(token) {
  return String(token).toLowerCase().replace(/[\s,]/g, '').replace(/²/g, '2');
}

export function findUncoveredRiskTokens(tokens, claims) {
  const verified = (Array.isArray(claims) ? claims : []).filter((claim) => claim?.status === 'verified');
  const corpus = normalizeRiskToken(
    verified.map((claim) => `${claim.statement || ''} ${claim.evidence || ''}`).join(' ')
  );
  return tokens.filter((token) => {
    const normalized = normalizeRiskToken(token);
    return normalized.length > 0 && !corpus.includes(normalized);
  });
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isEmail(value) {
  return typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function loadLedger() {
  if (!fs.existsSync(LEDGER_PATH)) return { version: 1, updated: '', publishers: [], reviews: [] };
  const parsed = yamlLoad(fs.readFileSync(LEDGER_PATH, 'utf8'));
  if (!parsed || typeof parsed !== 'object') return { version: 1, updated: '', publishers: [], reviews: [] };
  return {
    version: parsed.version || 1,
    updated: parsed.updated || '',
    publishers: Array.isArray(parsed.publishers) ? parsed.publishers : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
  };
}

export function validateContentReviews(ledger, entries, options = {}) {
  const { strict = false, fileExists = () => true } = options;
  const errors = [];
  const warnings = [];
  const reviews = Array.isArray(ledger?.reviews) ? ledger.reviews : [];
  const publishers = Array.isArray(ledger?.publishers)
    ? ledger.publishers.filter((publisher) => typeof publisher === 'string' && publisher.trim())
    : [];
  const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const markedByFile = new Map();

  for (const entry of entries) {
    for (const id of entry.markers || []) {
      if (!markedByFile.has(entry.path)) markedByFile.set(entry.path, new Set());
      markedByFile.get(entry.path).add(id);
    }
  }

  const stats = {
    files: entries.length,
    markers: 0,
    reviews: reviews.length,
    published: 0,
    draft: 0,
    rejected: 0,
  };
  for (const entry of entries) stats.markers += entry.markers?.size || 0;

  for (const entry of entries) {
    if (entry.parseError) errors.push(`${entry.path}: cannot parse a content file that declares AI provenance`);
  }

  if (publishers.length === 0) errors.push('publishers[] must list at least one human publisher email');
  for (const publisher of publishers) {
    if (!isEmail(publisher)) errors.push(`publishers[]: invalid email "${publisher}"`);
  }

  const byId = new Map();
  for (const review of reviews) {
    const id = typeof review?.id === 'string' ? review.id.trim() : '';
    if (!/^ai-[a-z0-9][a-z0-9-]{2,80}$/.test(id)) {
      errors.push(`${id || '(missing id)'}: review id must match ai-<lowercase-slug>`);
    }
    if (id && byId.has(id)) {
      errors.push(`${id}: duplicate review id`);
      continue;
    }
    if (id) byId.set(id, review);

    if (!REVIEW_STATUSES.includes(review?.status)) {
      errors.push(`${id}: invalid status "${review?.status}"`);
    } else if (review.status === 'published') {
      stats.published += 1;
    } else if (review.status === 'draft') {
      stats.draft += 1;
    } else {
      stats.rejected += 1;
    }

    if (!CHECK_STATUSES.includes(review?.factCheckStatus)) {
      errors.push(`${id}: invalid factCheckStatus "${review?.factCheckStatus}"`);
    }
    if (!CHECK_STATUSES.includes(review?.humanReviewStatus)) {
      errors.push(`${id}: invalid humanReviewStatus "${review?.humanReviewStatus}"`);
    }
    if (!TRANSLATION_STATUSES.includes(review?.translationReviewStatus)) {
      errors.push(`${id}: invalid translationReviewStatus "${review?.translationReviewStatus}"`);
    }

    const files = Array.isArray(review?.files)
      ? review.files.map((file) => String(file || '').trim()).filter(Boolean)
      : [];
    if (files.length === 0) errors.push(`${id}: files[] must list at least one content file`);
    for (const file of files) {
      if (!file.startsWith('src/') || !/\.(md|mdx|ya?ml)$/i.test(file) || file.includes('..')) {
        errors.push(`${id}: invalid content file "${file}"`);
        continue;
      }
      if (!fileExists(file)) {
        errors.push(`${id}: content file does not exist: ${file}`);
        continue;
      }
      if (!markedByFile.get(file)?.has(id)) {
        errors.push(`${id}: ${file} does not declare "aiReview: ${id}"`);
      }
    }

    const sources = Array.isArray(review?.sources) ? review.sources : [];
    const claims = Array.isArray(review?.claims) ? review.claims : [];
    const translations = Array.isArray(review?.translations) ? review.translations : [];

    for (const source of sources) {
      if (!String(source?.label || '').trim()) errors.push(`${id}: every source needs a label`);
      if (source?.accessedAt && !isDate(source.accessedAt)) {
        errors.push(`${id}: source accessedAt must be YYYY-MM-DD`);
      }
    }
    for (const claim of claims) {
      if (!String(claim?.statement || '').trim()) errors.push(`${id}: every claim needs a statement`);
      if (!CLAIM_STATUSES.includes(claim?.status)) {
        errors.push(`${id}: invalid claim status "${claim?.status}"`);
      }
      if (claim?.status === 'verified' && !String(claim?.evidence || '').trim()) {
        errors.push(`${id}: verified claim needs evidence`);
      }
    }
    for (const translation of translations) {
      if (!/^[a-z]{2}$/.test(String(translation?.lang || ''))) {
        errors.push(`${id}: invalid translation lang "${translation?.lang}"`);
      }
      if (!TRANSLATION_STATUSES.includes(translation?.status)) {
        errors.push(`${id}: invalid translation status "${translation?.status}"`);
      }
      if (translation?.status === 'approved') {
        if (!String(translation?.reviewedBy || '').trim()) {
          errors.push(`${id}: translation ${translation?.lang} needs reviewedBy`);
        }
        if (!isDate(translation?.reviewedAt)) {
          errors.push(`${id}: translation ${translation?.lang} needs reviewedAt`);
        }
      }
    }

    if (review?.status === 'published') {
      if (review.factCheckStatus !== 'approved') {
        errors.push(`${id}: published content requires factCheckStatus: approved`);
      }
      if (review.humanReviewStatus !== 'approved') {
        errors.push(`${id}: published content requires humanReviewStatus: approved`);
      }
      const nonEnglish = [...new Set(files.map(languageFor))].filter((lang) => lang !== 'en');
      if (nonEnglish.length === 0) {
        if (!['approved', 'not_required'].includes(review.translationReviewStatus)) {
          errors.push(`${id}: published English content requires translationReviewStatus approved or not_required`);
        }
      } else if (review.translationReviewStatus !== 'approved') {
        errors.push(`${id}: published multilingual content requires translationReviewStatus: approved`);
      }
      if (sources.length === 0) errors.push(`${id}: published content requires at least one source`);
      if (claims.length === 0) errors.push(`${id}: published content requires at least one verified claim`);
      if (claims.some((claim) => claim?.status !== 'verified' || !String(claim?.evidence || '').trim())) {
        errors.push(`${id}: published content requires every claim to be verified with evidence`);
      }
      if (!publishers.includes(review.publishedBy)) {
        errors.push(`${id}: publishedBy must be a publisher in publishers[]`);
      }
      if (!isDate(review.publishedAt)) errors.push(`${id}: publishedAt must be YYYY-MM-DD`);
      if (!Array.isArray(review.history) || review.history.length === 0) {
        errors.push(`${id}: published content requires a non-empty history[]`);
      }

      for (const lang of nonEnglish) {
        const translation = translations.find((item) => item?.lang === lang);
        if (
          !translation ||
          translation.status !== 'approved' ||
          !String(translation.reviewedBy || '').trim() ||
          !isDate(translation.reviewedAt)
        ) {
          errors.push(`${id}: missing approved translation review for "${lang}"`);
        }
      }

      for (const file of files) {
        const entry = entryByPath.get(file);
        if (!entry?.text) continue;
        const tokens = entry.riskTokens || extractRiskTokens(entry.text);
        const uncovered = findUncoveredRiskTokens(tokens, claims);
        if (uncovered.length > 0) {
          errors.push(
            `${id}: ${file} contains specs/certifications/capacity not covered by verified claims: ${uncovered
              .slice(0, 8)
              .join(', ')}${uncovered.length > 8 ? '…' : ''}`
          );
        }
      }
    } else {
      for (const file of files) {
        if (!markedByFile.get(file)?.has(id)) continue;
        const message = `${id}: ${review.status} AI content is present in the tree (${file}); it must be published before deploy`;
        if (strict) errors.push(message);
        else warnings.push(message);
      }
    }
  }

  for (const [file, ids] of markedByFile) {
    for (const id of ids) {
      if (!byId.has(id)) errors.push(`${file}: aiReview references unknown review "${id}"`);
    }
  }

  for (const entry of entries) {
    if (entry.aiGenerated && (!entry.markers || entry.markers.size === 0)) {
      errors.push(`${entry.path}: aiGenerated: true requires an aiReview marker`);
    }
  }

  for (const review of reviews) {
    const id = typeof review?.id === 'string' ? review.id.trim() : '';
    const files = Array.isArray(review?.files) ? review.files : [];
    const referenced = files.some((file) => markedByFile.get(String(file || '').trim())?.has(id));
    if (!referenced) {
      const message = `${id || '(missing id)'}: review is not referenced by any content file`;
      if (strict) errors.push(message);
      else warnings.push(message);
    }
  }

  return { errors, warnings, stats };
}

function main() {
  const strict = new Set(process.argv.slice(2)).has('--strict');
  const ledger = loadLedger();
  const entries = scanContentFiles();
  const { errors, warnings, stats } = validateContentReviews(ledger, entries, {
    strict,
    fileExists: (file) => fs.existsSync(path.join(ROOT, file)),
  });

  console.log(
    `[ai-content] files=${stats.files} markers=${stats.markers} reviews=${stats.reviews} published=${stats.published} draft=${stats.draft} rejected=${stats.rejected}`
  );
  for (const warning of warnings) console.log(`[ai-content] WARN ${warning}`);
  for (const error of errors) console.log(`[ai-content] ERROR ${error}`);
  console.log(
    `[ai-content] RESULT: ${errors.length === 0 ? 'PASS' : 'FAIL'} (${errors.length} error(s), ${warnings.length} warning(s))`
  );
  process.exitCode = errors.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
