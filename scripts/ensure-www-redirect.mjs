#!/usr/bin/env node
/**
 * Ensure www.inflatablepoolfactory.com redirects to the apex domain with a
 * single, path-preserving 301. Idempotent: existing rules are updated instead
 * of duplicated.
 *
 * Required in CI: CLOUDFLARE_API_TOKEN
 * Optional: CLOUDFLARE_ZONE_ID (resolved by name when omitted)
 *
 * This script only manages the zone's dynamic-redirect entrypoint. It does not
 * touch DNS, Pages, Workers, or any other zone rules.
 */

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'inflatablepoolfactory.com';
const WWW_HOST = `www.${ZONE_NAME}`;
const APEX_URL = `https://${ZONE_NAME}`;
const PHASE = 'http_request_dynamic_redirect';

const token = process.env.CLOUDFLARE_API_TOKEN;
const rawZoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();

if (!token) {
  console.log('::warning::CLOUDFLARE_API_TOKEN is not set; skipping the www redirect rule.');
  process.exit(0);
}

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok || body.success === false) {
    const error = new Error(`Cloudflare API ${res.status} ${path}: ${text.slice(0, 500)}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function resolveZoneId() {
  if (/^[0-9a-f]{32}$/i.test(rawZoneId)) return rawZoneId.toLowerCase();

  const data = await api(`/zones?name=${encodeURIComponent(ZONE_NAME)}`);
  const id = data.result?.[0]?.id;
  if (!id) throw new Error(`Could not resolve the ${ZONE_NAME} zone.`);
  return id;
}

function redirectRule() {
  return {
    action: 'redirect',
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: {
          expression: `concat("${APEX_URL}", http.request.uri.path)`,
        },
        preserve_query_string: true,
      },
    },
    expression: `(http.host eq "${WWW_HOST}")`,
    description: '301 www to apex',
    enabled: true,
  };
}

async function main() {
  const zoneId = await resolveZoneId();
  let entrypoint = null;

  try {
    const data = await api(`/zones/${zoneId}/rulesets/phases/${PHASE}/entrypoint`);
    entrypoint = data.result;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const desired = redirectRule();
  const rules = Array.isArray(entrypoint?.rules) ? [...entrypoint.rules] : [];
  const existingIndex = rules.findIndex(
    (rule) => typeof rule?.expression === 'string' && rule.expression.includes(WWW_HOST)
  );

  if (existingIndex >= 0) {
    rules[existingIndex] = desired;
  } else {
    rules.push(desired);
  }

  if (entrypoint) {
    await api(`/zones/${zoneId}/rulesets/phases/${PHASE}/entrypoint`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    });
    console.log(`[www-redirect] updated the redirect entrypoint (${rules.length} rule(s)).`);
  } else {
    await api(`/zones/${zoneId}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'default',
        description: 'Zone-level redirect rules',
        kind: 'zone',
        phase: PHASE,
        rules,
      }),
    });
    console.log('[www-redirect] created the redirect entrypoint.');
  }
}

main().catch((error) => {
  if (error.status === 401 || error.status === 403) {
    console.log(
      `::warning::The Cloudflare token cannot edit zone redirect rules (${error.status}); the www rule was not changed.`
    );
    console.log(String(error.message).slice(0, 500));
    process.exit(0);
  }

  console.error(`[www-redirect] ${error.message}`);
  process.exit(1);
});
