import { config, singleton, fields } from '@keystatic/core';

const AVAILABLE_LOCALES = {
  en: '🇺🇸 English',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  es: '🇪🇸 Español',
  pt: '🇵🇹 Português',
  it: '🇮🇹 Italiano',
  ru: '🇷🇺 Русский',
  pl: '🇵🇱 Polski',
  ar: '🇸🇦 العربية',
};

const createMultilingualSchema = (fieldSchema: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [code, label] of Object.entries(AVAILABLE_LOCALES)) {
    result[code] = fields.object(fieldSchema, { label });
  }
  return result;
};

const heroText = {
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  content: fields.text({ label: 'Content (HTML)', multiline: true }),
};

export default config({
  storage: {
    kind: 'github',
    repo: 'inflatablepool/web',
  },
  singletons: {
    news: singleton({
      label: '📰 News',
      path: 'src/content/news/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero_text: fields.object(heroText, { label: 'Page Header' }),
      }),
    }),

    apiKeys: singleton({
      label: '🔑 API Keys & Services',
      path: 'src/data/site/secrets',
      format: { data: 'yaml' },
      schema: {
        contact_email_provider: fields.select({
          label: 'Email Provider',
          options: [
            { label: 'Resend', value: 'resend' },
            { label: 'None (disabled)', value: 'none' },
          ],
          defaultValue: 'resend',
        }),
        contact_from_email: fields.text({ label: 'From Email Address' }),
        contact_from_name: fields.text({ label: 'From Name' }),
        contact_resend_api_key: fields.text({
          label: 'Resend API Key (re_...)',
          description: 'Get from https://resend.com/api-keys. Or set as Cloudflare secret: CONTACT_RESEND_API_KEY',
        }),
        contact_submissions_pat: fields.text({
          label: 'GitHub PAT for Submissions',
          description:
            'Optional. Scoped GitHub token for encrypted contact form storage. Or set as Cloudflare secret: CONTACT_SUBMISSIONS_PAT',
        }),
        gmap_api_key: fields.text({
          label: 'Google Maps API Key',
          description: 'Optional. For interactive maps. Or set as Cloudflare secret: GMAP_API_KEY',
        }),
      },
    }),
  },
});
