export const OEM_PROJECT_PATHS = ['OEM', 'ODM', 'Not sure yet'] as const;

export const OEM_PRODUCT_TYPES = [
  'Rectangular Drop-Stitch Pool',
  'Round Pool (Blue)',
  'Round Pool (Grey)',
  'SPA / Hot Tub',
  'Custom OEM / ODM',
  'Not Sure Yet',
] as const;

export const OEM_CUSTOMIZATION_LEVELS = [
  'Standard Product',
  'Logo / Branding Only',
  'Custom Sizes, Colors or Packaging',
  'ODM / Product Development',
  'Not Sure Yet',
] as const;

export interface OemBriefInput {
  projectPath?: string;
  productType?: string;
  targetSize?: string;
  quantity?: string;
  customizationLevel?: string;
  targetMarket?: string;
  targetDelivery?: string;
  requirements?: string;
}

export const OEM_BRIEF_MAX_FIELD_LENGTH = 500;
export const OEM_BRIEF_MAX_LENGTH = 2000;

const BRIEF_FIELDS: Array<[keyof OemBriefInput, string]> = [
  ['projectPath', 'Project path'],
  ['productType', 'Product type'],
  ['targetSize', 'Target size'],
  ['quantity', 'Estimated quantity'],
  ['customizationLevel', 'Customization level'],
  ['targetMarket', 'Target market'],
  ['targetDelivery', 'Target delivery'],
  ['requirements', 'Additional requirements'],
];

function cleanValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, OEM_BRIEF_MAX_FIELD_LENGTH).trim();
}

/**
 * Builds the plain-text project brief shown in the builder and passed to the
 * RFQ form. Only values entered by the buyer are included; nothing is inferred.
 */
export function buildOemBrief(input: OemBriefInput): string {
  const lines = BRIEF_FIELDS.map(([key, label]) => {
    const value = cleanValue(input[key]);
    return value ? `${label}: ${value}` : '';
  }).filter(Boolean);

  const brief = lines.join('\n');
  if (brief.length <= OEM_BRIEF_MAX_LENGTH) return brief;
  return `${brief.slice(0, OEM_BRIEF_MAX_LENGTH - 3).trimEnd()}...`;
}

/**
 * Maps the brief to the existing RFQ form query parameters. The form only
 * reads these values client-side; this helper never submits anything.
 */
export function buildRfqPrefillUrl(input: OemBriefInput, basePath = '/request-quotation'): string {
  const params = new URLSearchParams();

  const setParam = (key: string, value: unknown) => {
    const clean = cleanValue(value);
    if (clean) params.set(key, clean);
  };

  setParam('product', input.productType);
  setParam('quantity', input.quantity);
  setParam('customization', input.customizationLevel);
  setParam('country', input.targetMarket);
  setParam('delivery', input.targetDelivery);

  const brief = buildOemBrief(input);
  if (brief) params.set('brief', brief);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
