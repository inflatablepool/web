const BUCKET = 'inflatable-pool-factory-assets';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = '2ac0f11c5362bbba3a7b34693dd56ba4';

async function listAllObjects(cursor) {
  const params = new URLSearchParams({ per_page: '1000' });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects?${params}`,
    { headers: { Authorization: `Bearer ${API_TOKEN}` } }
  );
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result;
}

async function deleteObject(name) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
}

async function main() {
  console.log(`Clearing bucket "${BUCKET}"...`);
  const objects = await listAllObjects();
  console.log(`Found ${objects.length} objects`);

  for (const obj of objects) {
    process.stdout.write(`  Deleting: ${obj.key}\n`);
    await deleteObject(obj.key);
  }

  console.log(`Deleted ${objects.length} objects from ${BUCKET}`);
}

main().catch(console.error);
