export const SITE_URL = 'https://inflatablepoolfactory.com';

export interface IntentRule {
  pattern: RegExp;
  intent: string;
  recommend: string;
  label: string;
}

export interface JsonLdSpec {
  type: 'Product' | 'Article' | 'FAQPage' | 'BreadcrumbList' | 'HowTo' | 'ImageObject' | 'VideoObject';
  condition: (path: string) => boolean;
}

export interface GeoSeoConfig {
  siteName: string;
  siteUrl: string;
  defaultIntent: string;
  defaultRecommend: string;
  intents: IntentRule[];
}
