export interface ProductCompliance {
  certs: { label: string; standard?: string; body?: string }[];
  materialCompliance: string[];
  testStandards: string[];
  warranty: string;
}

const poolCompliance: ProductCompliance = {
  certs: [
    {
      label: 'Compliance documentation',
      standard: 'Confirmed per project and target market',
    },
  ],
  materialCompliance: [
    'Material specifications and available compliance documents are confirmed per project and target market.',
  ],
  testStandards: [
    'Pressure and leak-test method, hold time and acceptance criteria are confirmed in the approved production specification.',
  ],
  warranty: '2 years against manufacturing defects',
};

const defaultCompliance: ProductCompliance = poolCompliance;

export function getProductCompliance(category?: string): ProductCompliance {
  if (!category) return defaultCompliance;
  const key = category.toLowerCase();
  if (key === 'pool' || key === 'swimming-pool') return poolCompliance;
  return defaultCompliance;
}
