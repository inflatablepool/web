#!/usr/bin/env node
/**
 * SEO opportunity pipeline — real Search Console data only.
 *
 * Usage:
 *   npm run seo:pipeline -- --input path/to/gsc-export.csv
 *   npm run seo:pipeline -- --input path/to/gsc-export.json [--out output]
 *
 * The script never invents sample queries, metrics, GEO copy or social posts.
 * If no input is supplied it exits with an error instead of emitting fixtures.
 *
 * Accepted input:
 *   - CSV exported from Search Console (Queries / Pages report). Required
 *     columns: query (or "Top queries"), impressions, clicks, ctr, position.
 *     "page" / "top pages" is optional but enables per-page tasks.
 *   - JSON array of objects with the same field names.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const USAGE = `Usage: node scripts/seo-pipeline.mjs --input <gsc-export.csv|.json> [--out <dir>]

Export the data from Google Search Console:
  Performance -> Search results -> Export -> CSV (Queries or Pages tab)
or provide a JSON array with: query, page, impressions, clicks, ctr, position.`;

function fail(message, code = 2) {
  console.error(`\n[seo-pipeline] ${message}\n`);
  console.error(USAGE);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { input: '', out: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') args.input = argv[++i] || '';
    else if (arg === '--out' || arg === '-o') args.out = argv[++i] || '';
    else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith('--input=')) args.input = arg.slice('--input='.length);
    else if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length);
    else fail(`Unknown argument: ${arg}`);
  }
  return args;
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(header) {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const HEADER_ALIASES = {
  query: ['query', 'top queries', 'queries', 'search query'],
  page: ['page', 'top pages', 'pages', 'landing page', 'url'],
  clicks: ['clicks'],
  impressions: ['impressions'],
  ctr: ['ctr'],
  position: ['position', 'average position'],
};

function pick(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && String(row[alias]).trim() !== '') return row[alias];
  }
  return '';
}

function parsePercent(value) {
  if (typeof value === 'number') return value > 1 ? value / 100 : value;
  const text = String(value).trim().replace(/\s/g, '');
  if (!text) return 0;
  const numeric = Number(text.replace('%', '').replace(',', '.'));
  if (!Number.isFinite(numeric)) return 0;
  return text.includes('%') || numeric > 1 ? numeric / 100 : numeric;
}

function parseNumber(value) {
  const numeric = Number(String(value).replace(/[,\s]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeRows(rawRows) {
  return rawRows
    .map((row) => ({
      query: String(pick(row, HEADER_ALIASES.query) || '').trim(),
      page: String(pick(row, HEADER_ALIASES.page) || '').trim(),
      clicks: parseNumber(pick(row, HEADER_ALIASES.clicks)),
      impressions: parseNumber(pick(row, HEADER_ALIASES.impressions)),
      ctr: parsePercent(pick(row, HEADER_ALIASES.ctr)),
      position: parseNumber(pick(row, HEADER_ALIASES.position)),
    }))
    .filter((row) => row.query || row.page)
    .filter((row) => row.impressions > 0 || row.clicks > 0);
}

function loadInput(file) {
  if (!file) fail('No --input file supplied. Refusing to emit sample data.');
  if (!existsSync(file)) fail(`Input file not found: ${file}`);
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const ext = path.extname(file).toLowerCase();

  if (ext === '.json') {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      fail(`Invalid JSON in ${file}: ${e.message}`);
    }
    const rows = Array.isArray(parsed) ? parsed : parsed.rows || parsed.queries || parsed.data;
    if (!Array.isArray(rows)) fail('JSON input must be an array of rows (or { rows: [...] }).');
    const normalized = normalizeRows(rows);
    if (normalized.length === 0) fail('JSON input contained no rows with impressions or clicks.');
    return normalized;
  }

  const table = parseCsv(text);
  if (table.length < 2) fail('CSV input must contain a header row and at least one data row.');
  const headers = table[0].map(normalizeHeader);
  const rows = table.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
  const normalized = normalizeRows(rows);
  if (normalized.length === 0) {
    fail(
      'CSV input contained no usable rows. Expected columns: query, page (optional), impressions, clicks, ctr, position.'
    );
  }
  return normalized;
}

function runRules(data) {
  const high = [];
  const medium = [];
  for (const d of data) {
    const where = d.page || '(page not provided)';
    if (d.impressions >= 100 && d.ctr < 0.02) {
      high.push({
        type: 'CTR_FIX',
        page: where,
        query: d.query,
        priority: 3,
        impressions: d.impressions,
        position: d.position,
        reason: `${d.impressions} impressions but CTR only ${(d.ctr * 100).toFixed(1)}%.`,
        action: 'Rewrite the title tag and meta description around the query intent.',
      });
    }
    if (d.position >= 4 && d.position <= 20) {
      high.push({
        type: 'RANK_BOOST',
        page: where,
        query: d.query,
        priority: 3,
        impressions: d.impressions,
        position: d.position,
        reason: `Average position ${d.position.toFixed(1)} — within striking distance of the top 3.`,
        action: 'Add internal links and expand the matching section with first-hand detail.',
      });
    }
    if (d.position > 0 && d.position <= 3 && d.ctr < 0.05) {
      high.push({
        type: 'PAGE_CTR_FIX',
        page: where,
        query: d.query,
        priority: 3,
        impressions: d.impressions,
        position: d.position,
        reason: `Ranks in the top 3 but CTR is only ${(d.ctr * 100).toFixed(1)}%.`,
        action: 'Update the meta title/description and check the SERP snippet against competitors.',
      });
    }
    if (d.impressions < 50 && d.query.split(/\s+/).length >= 3) {
      medium.push({
        type: 'CONTENT_GAP',
        page: where,
        query: d.query,
        priority: 2,
        impressions: d.impressions,
        position: d.position,
        reason: `Only ${d.impressions} impressions for a long-tail query.`,
        action: 'Add a dedicated section or FAQ entry that answers this query directly.',
      });
    }
  }
  high.sort((a, b) => b.impressions - a.impressions);
  medium.sort((a, b) => b.impressions - a.impressions);
  return { high, medium };
}

function summarizePages(data) {
  const byPage = new Map();
  for (const d of data) {
    if (!d.page) continue;
    const entry = byPage.get(d.page) || { page: d.page, queries: 0, clicks: 0, impressions: 0, positionSum: 0 };
    entry.queries += 1;
    entry.clicks += d.clicks;
    entry.impressions += d.impressions;
    entry.positionSum += d.position;
    byPage.set(d.page, entry);
  }
  return [...byPage.values()]
    .map((entry) => ({
      page: entry.page,
      queries: entry.queries,
      clicks: entry.clicks,
      impressions: entry.impressions,
      ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
      position: entry.queries > 0 ? entry.positionSum / entry.queries : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

function toMarkdown(tasks) {
  const lines = ['# SEO opportunity tasks', '', `Generated: ${new Date().toISOString()}`, ''];
  for (const [heading, list] of [
    ['High priority', tasks.high],
    ['Medium priority', tasks.medium],
  ]) {
    lines.push(`## ${heading}`, '');
    if (!list.length) {
      lines.push('_No tasks matched the current rules._', '');
      continue;
    }
    for (const task of list) {
      lines.push(
        `- **[${task.type}]** ${task.page} — "${task.query}"`,
        `  - ${task.reason}`,
        `  - Action: ${task.action}`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toCsv(tasks) {
  const rows = [['type', 'priority', 'page', 'query', 'impressions', 'position', 'reason', 'action']];
  for (const task of [...tasks.high, ...tasks.medium]) {
    rows.push([
      task.type,
      String(task.priority),
      task.page,
      task.query,
      String(task.impressions),
      task.position.toFixed(1),
      task.reason,
      task.action,
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

const args = parseArgs(process.argv.slice(2));
const data = loadInput(args.input);
const outDir = path.resolve(args.out || path.join(import.meta.dirname, '..', 'output'));
const tasks = runRules(data);
const pages = summarizePages(data);

mkdirSync(outDir, { recursive: true });
const generatedAt = new Date().toISOString();
writeFileSync(
  path.join(outDir, 'tasks.json'),
  JSON.stringify({ generatedAt, source: path.basename(args.input), rowCount: data.length, tasks, pages }, null, 2)
);
writeFileSync(path.join(outDir, 'tasks.md'), toMarkdown(tasks));
writeFileSync(path.join(outDir, 'tasks.csv'), toCsv(tasks));

console.log('=== Inflatable Pool Factory SEO pipeline ===');
console.log(`Source: ${args.input}`);
console.log(`Rows: ${data.length}`);
console.log(`High priority tasks: ${tasks.high.length}`);
console.log(`Medium priority tasks: ${tasks.medium.length}`);
console.log(`Pages summarised: ${pages.length}`);
console.log(`Output: ${outDir}`);
console.log('  - tasks.json');
console.log('  - tasks.md');
console.log('  - tasks.csv');
