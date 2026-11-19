import { SITE, METADATA, SITE_SETTINGS, ANALYTICS } from 'site:config';

export interface SeoSettings {
  siteUrl: string;
  googleAnalyticsId: string;
  defaultOgImage: { src?: string; alt?: string } | null;
  keywords: string[];
  robotsIndex: boolean;
  robotsFollow: boolean;
  socialLinks: Array<{ platform?: string; url?: string; ariaLabel?: string; icon?: string }>;
  organizationName: string;
  organizationLogo: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationAddress: string;
  twitterHandle: string;
  twitterSite: string;
  twitterCardType: string;
}

function getDefaults(): SeoSettings {
  return {
    siteUrl: SITE?.site || '',
    googleAnalyticsId: ANALYTICS?.vendors?.googleAnalytics?.id || '',
    defaultOgImage: METADATA?.openGraph?.images?.[0] ? { src: METADATA.openGraph.images[0].url } : null,
    keywords: METADATA?.keywords || [],
    robotsIndex: METADATA?.robots?.index ?? true,
    robotsFollow: METADATA?.robots?.follow ?? true,
    socialLinks: SITE_SETTINGS?.socialLinks || [],
    organizationName: SITE_SETTINGS?.organization?.name || SITE?.name || '',
    organizationLogo: SITE_SETTINGS?.organization?.logo || '',
    organizationEmail: SITE_SETTINGS?.organization?.contactEmail || '',
    organizationPhone: SITE_SETTINGS?.organization?.contactPhone || '',
    organizationAddress: SITE_SETTINGS?.organization?.address || '',
    twitterHandle: SITE_SETTINGS?.twitter?.handle || '',
    twitterSite: SITE_SETTINGS?.twitter?.site || '',
    twitterCardType: SITE_SETTINGS?.twitter?.cardType || 'summary_large_image',
  };
}

export function getSeoSettingsSync(): SeoSettings {
  return getDefaults();
}

export async function getSeoSettings(): Promise<SeoSettings> {
  return getDefaults();
}
