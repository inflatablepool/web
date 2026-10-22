interface Env {
  DATA_BUCKET: R2Bucket;
}

interface GeoScore {
  url: string;
  llmsTxt: boolean;
  llmsFullTxt: boolean;
  entityJson: boolean;
  schemaOrg: boolean;
  faqPresent: boolean;
  manufacturerInfo: boolean;
  score: number;
  maxScore: number;
  checkedAt: string;
}

export async function geoScore(env: Env): Promise<Response> {
  try {
    const paths = [
      '/',
      '/about/',
      '/products/',
      '/factory/',
      '/contact/',
      '/llms.txt',
      '/llms-full.txt',
      '/.well-known/entity.json',
    ];

    const results: GeoScore[] = paths.map((url) => {
      const hasLlmsTxt = url === '/llms.txt';
      const hasLlmsFullTxt = url === '/llms-full.txt';
      const hasEntityJson = url === '/.well-known/entity.json';

      let schemaOrg = false;
      let faqPresent = false;
      let manufacturerInfo = false;

      if (url === '/' || url === '/about/') manufacturerInfo = true;
      if (url === '/products/' || url.startsWith('/en/')) schemaOrg = true;
      if (url.startsWith('/en/')) faqPresent = true;

      const items = [hasLlmsTxt, hasLlmsFullTxt, hasEntityJson, schemaOrg, faqPresent, manufacturerInfo];
      const score = items.filter(Boolean).length;
      const maxScore = items.length;

      return {
        url: `https://inflatablepoolfactory.com${url}`,
        llmsTxt: hasLlmsTxt,
        llmsFullTxt: hasLlmsFullTxt,
        entityJson: hasEntityJson,
        schemaOrg,
        faqPresent,
        manufacturerInfo,
        score,
        maxScore,
        checkedAt: new Date().toISOString(),
      };
    });

    const report = {
      generated: new Date().toISOString(),
      totalPages: paths.length,
      averageScore: results.reduce((s, r) => s + r.score, 0) / results.length,
      maxPossible: 6,
      results,
    };

    await env.DATA_BUCKET.put('seo/scores/geo.json', JSON.stringify(report));

    return new Response(JSON.stringify(report), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Unknown',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
