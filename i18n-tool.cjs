#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = path.resolve(__dirname, 'src/i18n/config.ts');
const LANGS = ['en', 'fr', 'de', 'es', 'pt', 'ar', 'it', 'ru', 'pl', 'nl', 'sv', 'no', 'el', 'fi', 'da'];

function readFile() {
  return fs.readFileSync(CONFIG, 'utf8').replace(/\r\n/g, '\n');
}
function writeFile(c) {
  fs.writeFileSync(CONFIG, c.replace(/\r\n/g, '\n'), 'utf8');
}

function findSection(lines, lang) {
  const pat = new RegExp('^\\s+' + lang + ': \\{');
  const start = lines.findIndex((l, i) => i > 10 && pat.test(l));
  if (start === -1) return null;
  let d = 0;
  for (let i = start; i < lines.length; i++) {
    for (const c of lines[i]) {
      if (c === '{') d++;
      if (c === '}') d--;
    }
    if (d === 0) return { start, end: i };
  }
  return null;
}

function getKeys(lines, start, end) {
  const map = new Map();
  for (let i = start; i <= end; i++) {
    const m = lines[i].match(/^\s+'([^']+)':\s+(.+),?$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function syntaxCheck() {
  try {
    execSync(`node -c "${CONFIG}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ─── COMMANDS ───────────────────────────────────────────────

const commands = {
  // List key counts per language
  count() {
    const lines = readFile().split('\n');
    const en = findSection(lines, 'en');
    const enKeys = getKeys(lines, en.start, en.end);
    console.log(`EN keys: ${enKeys.size}`);
    console.log('---');
    for (const lang of LANGS) {
      const sec = findSection(lines, lang);
      if (!sec) {
        console.log(`${lang}: NOT FOUND`);
        continue;
      }
      const keys = getKeys(lines, sec.start, sec.end);
      const pct = ((keys.size / enKeys.size) * 100).toFixed(1);
      console.log(`${lang}: ${keys.size} (${pct}%)`);
    }
  },

  // Audit a language: show missing + untranslated keys
  audit(lang) {
    const lines = readFile().split('\n');
    const en = findSection(lines, 'en');
    const enKeys = getKeys(lines, en.start, en.end);
    const sec = findSection(lines, lang);
    if (!sec) {
      console.log(`${lang}: section not found`);
      return;
    }
    const langKeys = getKeys(lines, sec.start, sec.end);

    const missing = [...enKeys.keys()].filter((k) => !langKeys.has(k));
    const untranslated = [];
    for (const [k, v] of langKeys) {
      const enVal = enKeys.get(k);
      if (enVal && v === enVal && v.length > 15) untranslated.push(k);
    }

    console.log(`=== ${lang.toUpperCase()} Audit ===`);
    console.log(`EN keys: ${enKeys.size}, ${lang} keys: ${langKeys.size}`);
    console.log(`Translated: ${langKeys.size - untranslated.length}`);
    console.log(`Untranslated (still English): ${untranslated.length}`);
    console.log(`Missing EN keys: ${missing.length}`);

    if (missing.length > 0) {
      console.log(`\nMissing keys (${missing.length}):`);
      missing.slice(0, 50).forEach((k) => console.log(`  ${k}`));
      if (missing.length > 50) console.log(`  ... and ${missing.length - 50} more`);
    }
    if (untranslated.length > 0) {
      console.log(`\nUntranslated keys (${untranslated.length}):`);
      untranslated.slice(0, 50).forEach((k) => console.log(`  ${k}`));
      if (untranslated.length > 50) console.log(`  ... and ${untranslated.length - 50} more`);
    }
  },

  // Show missing keys for ALL languages
  missing() {
    const lines = readFile().split('\n');
    const en = findSection(lines, 'en');
    const enKeys = getKeys(lines, en.start, en.end);
    for (const lang of LANGS) {
      if (lang === 'en') continue;
      const sec = findSection(lines, lang);
      if (!sec) {
        console.log(`${lang}: NOT FOUND`);
        continue;
      }
      const langKeys = getKeys(lines, sec.start, sec.end);
      const diff = [...enKeys.keys()].filter((k) => !langKeys.has(k));
      if (diff.length > 0) console.log(`${lang}: missing ${diff.length}`);
    }
  },

  // Insert translations from a JSON file (key → value)
  insert(lang, jsonFile) {
    const trans = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const lines = readFile().split('\n');
    const sec = findSection(lines, lang);
    if (!sec) {
      console.log(`${lang}: section not found`);
      return;
    }

    const existing = getKeys(lines, sec.start, sec.end);
    const insertLines = [];
    for (const [key, value] of Object.entries(trans)) {
      if (existing.has(key)) continue;
      const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      insertLines.push(`    '${key}': '${escaped}',`);
    }

    if (insertLines.length === 0) {
      console.log(`${lang}: all keys present`);
      return;
    }
    lines.splice(sec.end, 0, ...insertLines);
    writeFile(lines.join('\n'));
    console.log(`${lang}: inserted ${insertLines.length} keys`);
    console.log(`Syntax: ${syntaxCheck() ? 'OK' : 'ERROR'}`);
  },

  // Update existing keys with new values (replaces untranslated entries)
  update(lang, jsonFile) {
    const trans = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const lines = readFile().split('\n');
    const sec = findSection(lines, lang);
    if (!sec) {
      console.log(`${lang}: section not found`);
      return;
    }

    let updated = 0;

    for (const [key, value] of Object.entries(trans)) {
      for (let i = sec.start; i <= sec.end; i++) {
        const m = lines[i].match(/^(\s+)'([^']+)':\s+(.+),?$/);
        if (m && m[2] === key) {
          const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          const indent = m[1];
          lines[i] = `${indent}'${key}': '${escaped}',`;
          updated++;
          break;
        }
      }
    }

    writeFile(lines.join('\n'));
    console.log(`${lang}: updated ${updated} keys`);
    console.log(`Syntax: ${syntaxCheck() ? 'OK' : 'ERROR'}`);
  },

  // Extract EN values for missing keys → JSON file
  extract(lang, outFile) {
    const lines = readFile().split('\n');
    const en = findSection(lines, 'en');
    const enMap = getKeys(lines, en.start, en.end);
    const sec = findSection(lines, lang);
    if (!sec) {
      console.log(`${lang}: section not found`);
      return;
    }
    const langKeys = getKeys(lines, sec.start, sec.end);
    const result = {};
    for (const [k, v] of enMap) {
      if (!langKeys.has(k)) result[k] = v;
    }
    const out = outFile || `missing-en-${lang}.json`;
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(`${lang}: ${Object.keys(result).length} missing keys → ${out}`);
  },

  // Fix malformed key patterns: 'key: 'val' → 'key': 'val'
  fix() {
    let content = readFile();
    const before = (content.match(/'([a-zA-Z0-9._]+): '/g) || []).length;
    content = content.replace(/'([a-zA-Z0-9._]+): '/g, "'$1': '");
    writeFile(content);
    console.log(`Fixed ${before} malformed key-value pairs`);
    console.log(`Syntax: ${syntaxCheck() ? 'OK' : 'ERROR'}`);
  },

  // Verify section integrity
  verify(lang) {
    const lines = readFile().split('\n');
    const sec = findSection(lines, lang);
    if (!sec) {
      console.log(`${lang}: section not found`);
      return;
    }
    const block = lines.slice(sec.start, sec.end + 1).join('\n');
    let open = 0,
      close = 0;
    for (const ch of block) {
      if (ch === '{') open++;
      if (ch === '}') close++;
    }
    const keys = getKeys(lines, sec.start, sec.end);
    console.log(
      `${lang}: lines ${sec.start + 1}-${sec.end + 1}, ${keys.size} keys, braces: ${open}/${close} ${open === close ? 'OK' : 'MISMATCH'}`
    );
  },

  // Pre-commit validation: checks what esbuild checks
  check() {
    const content = readFile();
    const lines = content.split('\n');
    let errors = 0;

    // 1. Node syntax check
    const nodeOK = syntaxCheck();
    if (!nodeOK) {
      console.log('FAIL: node -c syntax error');
      errors++;
    }

    // 2. U+FFFD corruption check
    const fffdLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('\uFFFD')) fffdLines.push(i + 1);
    }
    if (fffdLines.length > 0) {
      console.log(`FAIL: ${fffdLines.length} lines with U+FFFD corruption`);
      fffdLines.slice(0, 5).forEach((l) => console.log(`  line ${l}: ${lines[l - 1].trim().slice(0, 80)}`));
      if (fffdLines.length > 5) console.log(`  ... and ${fffdLines.length - 5} more`);
      errors++;
    }

    // 3. Unescaped single quotes inside single-quoted values
    const badQuotes = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const kvMatch = line.match(/^(\s+'[^']+'[^:]*:\s+)'/);
      if (!kvMatch) continue;
      const valuePart = line.slice(kvMatch[1].length);
      if (!valuePart.startsWith("'")) continue;

      // Find matching close quote
      let closeIdx = -1;
      for (let j = 1; j < valuePart.length; j++) {
        if (valuePart[j] === '\\') {
          j++;
          continue;
        }
        if (valuePart[j] === "'") {
          const after = valuePart.slice(j + 1).trim();
          if (after === '' || after.startsWith(',') || after.startsWith('}') || after.startsWith(']')) {
            closeIdx = j;
            break;
          }
        }
      }
      if (closeIdx === -1) {
        badQuotes.push(i + 1);
      } else {
        const inner = valuePart.slice(1, closeIdx);
        const unescaped = inner.replace(/\\'/g, '');
        if (unescaped.includes("'")) badQuotes.push(i + 1);
      }
    }
    if (badQuotes.length > 0) {
      console.log(`FAIL: ${badQuotes.length} lines with broken quotes in values`);
      badQuotes.slice(0, 5).forEach((l) => console.log(`  line ${l}: ${lines[l - 1].trim().slice(0, 80)}`));
      if (badQuotes.length > 5) console.log(`  ... and ${badQuotes.length - 5} more`);
      errors++;
    }

    // 4. Brace matching per section
    for (const lang of LANGS) {
      const sec = findSection(lines, lang);
      if (!sec) continue;
      const block = lines.slice(sec.start, sec.end + 1).join('\n');
      let open = 0,
        close = 0;
      for (const ch of block) {
        if (ch === '{') open++;
        if (ch === '}') close++;
      }
      if (open !== close) {
        console.log(`FAIL: ${lang} braces mismatch ({ = ${open}, } = ${close})`);
        errors++;
      }
    }

    // 5. Empty key check
    const emptyKeys = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s+'([^']*)':\s+/);
      if (m && m[1] === '') emptyKeys.push(i + 1);
    }
    if (emptyKeys.length > 0) {
      console.log(`FAIL: ${emptyKeys.length} lines with empty keys`);
      errors++;
    }

    // 6. Duplicate key check (within same language section)
    for (const lang of LANGS) {
      const sec = findSection(lines, lang);
      if (!sec) continue;
      const seen = new Map();
      for (let i = sec.start; i <= sec.end; i++) {
        const m = lines[i].match(/^\s+'([^']+)':\s+/);
        if (m) {
          if (seen.has(m[1])) {
            console.log(`FAIL: duplicate key '${m[1]}' in ${lang} at lines ${seen.get(m[1]) + 1} and ${i + 1}`);
            errors++;
          }
          seen.set(m[1], i);
        }
      }
    }

    if (errors === 0) {
      console.log('ALL CHECKS PASSED');
    } else {
      console.log(`${errors} check(s) failed`);
    }
    process.exit(errors > 0 ? 1 : 0);
  },

  // Show usage
  help() {
    console.log(`
i18n-tool — Inflatable Pool Factory i18n management

Usage: node i18n-tool.cjs <command> [args]

Commands:
  count                     Show key counts per language
  audit <lang>              Audit a language (missing + untranslated)
  missing                   Show missing key counts for all languages
  insert <lang> <json>      Insert translations from JSON file
  extract <lang> [out]      Extract missing EN values to JSON
  fix                       Fix malformed 'key: ' patterns
  verify <lang>             Verify section integrity
  check                     Pre-commit validation (esbuild, U+FFFD, quotes, braces, dupes)
  help                      Show this help

Examples:
  node i18n-tool.cjs count
  node i18n-tool.cjs audit cs
  node i18n-tool.cjs missing
  node i18n-tool.cjs insert cs translations-cs.json
  node i18n-tool.cjs extract ar
  node i18n-tool.cjs fix
  node i18n-tool.cjs verify en
`);
  },
};

const [cmd, ...args] = process.argv.slice(2);
if (!cmd || !commands[cmd]) {
  commands.help();
  process.exit(cmd ? 1 : 0);
}
commands[cmd](...args);
