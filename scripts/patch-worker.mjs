import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const wranglerJson = path.resolve('dist/server/wrangler.json');

try {
  execSync('npx wrangler vectorize create ai-index --dimensions=768 --metric=cosine 2>&1', {
    encoding: 'utf-8',
    timeout: 30000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  console.log('Ensured Vectorize index ai-index exists');
} catch {
  console.log('Vectorize index ai-index already exists or wrangler unavailable');
}

try {
  const output = execSync('npx wrangler kv namespace list 2>&1', {
    encoding: 'utf-8',
    timeout: 20000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const list = JSON.parse(output);
  const ns =
    list.find((n) => n.title === 'multi-session') || list.find((n) => n.title === 'inflatable-pool-factory-session');
  if (ns && existsSync(wranglerJson)) {
    const config = JSON.parse(readFileSync(wranglerJson, 'utf-8'));
    config.kv_namespaces = [{ binding: 'SESSION', id: ns.id }];
    writeFileSync(wranglerJson, JSON.stringify(config, null, 2));
    console.log('Injected SESSION KV binding (id=' + ns.id + ') into wrangler.json');
  } else if (!ns) {
    console.log('No matching KV namespace found; skipping injection');
  }
} catch {
  console.log('KV namespace injection skipped (wrangler unavailable)');
}
