/**
 * Drop-Stitch Pool catalog data — series, sizes, FOB Qingdao prices,
 * standard inclusions and optional accessories.
 *
 * Source of truth: Inflatable Pool Factory quotation sheet (indicative reference pricing,
 * FOB Qingdao, USD) and core product series & specifications sheet.
 */

export interface PoolCatalogItem {
  /** Factory item number, e.g. "S3012" */
  item: string;
  /** Size in meters, e.g. "3 × 1.2" (diameter × height for round pools) */
  size: string;
  /** Wall thickness, e.g. "15 cm" */
  wall: string;
  /** Packed weight in kg (when published on the quotation sheet) */
  weightKg: number | null;
  /** Indicative FOB Qingdao unit price in USD */
  fobUsd: number;
}

export interface PoolCatalogSeries {
  id: string;
  name: string;
  /** Short heading used in tables, e.g. "Round Pool — 10/15 cm Wall" */
  heading: string;
  wallOptions: string;
  sizeRange: string;
  highlights: string;
  /** Standard factory inclusions for the series */
  included: string[];
  /** Factory photo of the standard inclusions (quotation sheet) */
  includedImage?: string;
  items: PoolCatalogItem[];
}

export interface PoolAccessory {
  name: string;
  spec: string;
  fobUsd: number;
  /** Factory photo from the quotation sheet */
  image?: string;
}

/** Recommended daily operating pressure */
export const POOL_OPERATING_PRESSURE = '4–5 PSI';
/** Maximum pressure tolerance */
export const POOL_MAX_PRESSURE = '8 PSI';
/** Pressure-relief valve release threshold */
export const POOL_RELIEF_VALVE_PRESSURE = '6 PSI';

export const POOL_PRESSURE_SPECS = [
  { label: 'Recommended operating pressure', value: POOL_OPERATING_PRESSURE },
  { label: 'Maximum pressure tolerance', value: POOL_MAX_PRESSURE },
  { label: 'Pressure-relief valve auto-release', value: `Above ${POOL_RELIEF_VALVE_PRESSURE}` },
];

export const PRICE_BASIS_NOTE = 'FOB Qingdao, USD — indicative reference pricing. Quantity basis and final price are confirmed in your quotation.';

export interface PoolProductionStep {
  title: string;
  description: string;
}

/** Five-step factory production process (source: production process sheet) */
export const POOL_PRODUCTION_STEPS: PoolProductionStep[] = [
  {
    title: 'Material Preparation & CNC Cutting',
    description:
      'High-density double-layer drop-stitch fabric — the same premium material used for our SUP boards — is fed into CNC cutting machines that precisely cut pool floors, side walls, and reinforcement patches per engineering blueprints.',
  },
  {
    title: 'Valve & Fitting Installation',
    description:
      'Precise ports are punched in the designated wall panels, then 38 mm standard filter-pump ports, water shut-off valves, over-inflation safety valves, and drain valves are heat-sealed in place against internal air and water pressure.',
  },
  {
    title: 'Panel Assembly & Rail Bonding',
    description:
      'The main floor and perimeter walls are joined into a single air chamber with specialized heat-welding equipment, and all edges and seams receive double or triple-layer reinforced PVC rail bands to withstand high internal pressure without deformation.',
  },
  {
    title: 'Accessory Integration & Finishing',
    description:
      'Handles, repair-kit components, and optional covers (e.g. Oxford fabric lids) are fitted, followed by visual inspection of seams, valve seals and dimensions against the approved specification.',
  },
  {
    title: 'Pressure & Leak Testing',
    description:
      'Completed pools are inflated to the rated operating pressure and checked against the pressure and leak-test method and acceptance criteria in the approved production specification before final deflating, cleaning, and packaging.',
  },
];

export interface PoolFeature {
  icon: string;
  title: string;
  description: string;
}

/** Key product features (source: drop-stitch pool product brief) */
export const POOL_KEY_FEATURES: PoolFeature[] = [
  {
    icon: 'tabler:shield-check',
    title: 'Rock-Solid Rigidity',
    description:
      'At the standard 4–5 PSI operating pressure the drop-stitch walls form a flat, firm surface that resists collapsing or inward buckling — users can lean against or sit directly on the pool rim.',
  },
  {
    icon: 'tabler:box',
    title: 'Self-Supporting Integrated Shell',
    description:
      'Internal drop-stitch tensile geometry and precision patterning make the pool a stable, unified structure the moment it inflates — no rusted metal parts, loose fasteners, or frame scratches.',
  },
  {
    icon: 'tabler:ruler-2',
    title: 'Sizes for Every Scenario',
    description:
      'Round, square, and rectangular models from compact 1.5 m personal plunge pools to 10 m commercial pools — with options for built-in seats and 5 mm insulated bottoms that turn them into insulated soaking tubs for use with external heaters.',
  },
  {
    icon: 'tabler:bolt',
    title: '5–15 Minute Setup',
    description:
      'One person with the included 1000W electric pump inflates a pool to full rigidity in 5–15 minutes; deflated, it folds into carton packaging for minimal off-season storage.',
  },
];

/** Commercial advantages for wholesale buyers (source: drop-stitch pool product brief) */
export const POOL_BUSINESS_ADVANTAGES: PoolFeature[] = [
  {
    icon: 'tabler:ship',
    title: '5–10% of Rigid Pool Shipping Volume',
    description:
      'A deflated drop-stitch pool packs at just 5–10% of the volume of an equivalent acrylic or fiberglass (FRP) pool — dramatically higher 20GP/40HQ container load efficiency and lower overseas warehousing costs.',
  },
  {
    icon: 'tabler:trending-up',
    title: 'High-Margin Mid-to-High-End Positioning',
    description:
      'Rigidity, finish, and service life far above thin-gauge PVC inflatables, selling into residential patio, vacation rental (Airbnb), glamping, and wellness spa segments with strong retail margins.',
  },
  {
    icon: 'tabler:plug',
    title: 'Plug & Play — Low After-Sales Friction',
    description:
      'No excavation, concrete foundations, or frame assembly: end users unbox, inflate, and start filling within minutes, minimizing installation complaints and support costs.',
  },
  {
    icon: 'tabler:shopping-cart',
    title: 'Cross-Selling Accessory Ecosystem',
    description:
      'Boarding steps, safety ladders, thermal covers, rechargeable pumps, and sand filter systems turn a single pool order into a comprehensive turnkey package with a higher total transaction value.',
  },
];

export const poolSeries: PoolCatalogSeries[] = [
  {
    id: 'round',
    name: 'Classic Round Pool',
    heading: 'Round Pool — 10/15 cm Wall',
    wallOptions: '10 cm / 15 cm',
    sizeRange: 'Diameter 2.0 m – 10.0 m',
    highlights:
      'Dense size increments covering over 20 specifications; outstanding resistance to lateral water-pressure expansion; easy installation — ideal for residential backyard leisure and commercial events.',
    included: ['1000W high-power electric air pump', 'Repair kit'],
    includedImage: '/images/pools/accessories-kit.webp',
    items: [
      { item: 'S2005', size: 'Ø 2 × 0.5', wall: '10 cm', weightKg: 18.4, fobUsd: 137.96 },
      { item: 'S3010', size: 'Ø 3 × 1', wall: '15 cm', weightKg: 40, fobUsd: 325.03 },
      { item: 'S3012', size: 'Ø 3 × 1.2', wall: '15 cm', weightKg: 45, fobUsd: 377.64 },
      { item: 'S3015', size: 'Ø 3 × 1.5', wall: '15 cm', weightKg: 53, fobUsd: 399.85 },
      { item: 'S3712', size: 'Ø 3.7 × 1.2', wall: '15 cm', weightKg: 58, fobUsd: 434.93 },
      { item: 'S4010', size: 'Ø 4 × 1', wall: '15 cm', weightKg: null, fobUsd: 438.44 },
      { item: 'S4012', size: 'Ø 4 × 1.2', wall: '15 cm', weightKg: 65, fobUsd: 479.36 },
      { item: 'S4015', size: 'Ø 4 × 1.5', wall: '15 cm', weightKg: 74, fobUsd: 563.17 },
      { item: 'S4612', size: 'Ø 4.6 × 1.2', wall: '15 cm', weightKg: 78, fobUsd: 618.49 },
      { item: 'S5010', size: 'Ø 5 × 1', wall: '15 cm', weightKg: null, fobUsd: 634.85 },
      { item: 'S5012', size: 'Ø 5 × 1.2', wall: '15 cm', weightKg: 88, fobUsd: 671.1 },
      { item: 'S5015', size: 'Ø 5 × 1.5', wall: '15 cm', weightKg: 110, fobUsd: 733.06 },
      { item: 'S5512', size: 'Ø 5.5 × 1.2', wall: '15 cm', weightKg: 102, fobUsd: 727.22 },
      { item: 'S6010', size: 'Ø 6 × 1', wall: '15 cm', weightKg: null, fobUsd: 734.23 },
      { item: 'S6012', size: 'Ø 6 × 1.2', wall: '15 cm', weightKg: 115, fobUsd: 792.69 },
      { item: 'S6015', size: 'Ø 6 × 1.5', wall: '15 cm', weightKg: null, fobUsd: 860.5 },
      { item: 'S6016', size: 'Ø 6 × 1.6', wall: '15 cm', weightKg: 135, fobUsd: 879.21 },
      { item: 'S6413', size: 'Ø 6.4 × 1.3', wall: '15 cm', weightKg: 135, fobUsd: 830.1 },
      { item: 'S7010', size: 'Ø 7 × 1', wall: '15 cm', weightKg: null, fobUsd: 934.16 },
      { item: 'S7012', size: 'Ø 7 × 1.2', wall: '15 cm', weightKg: 130, fobUsd: 980.93 },
      { item: 'S7015', size: 'Ø 7 × 1.5', wall: '15 cm', weightKg: 140, fobUsd: 1094.34 },
      { item: 'S7313', size: 'Ø 7.3 × 1.3', wall: '15 cm', weightKg: 160, fobUsd: 1122.4 },
      { item: 'S10012', size: 'Ø 10 × 1.2', wall: '15 cm', weightKg: 250, fobUsd: 1600.58 },
    ],
  },
  {
    id: 'rect-square',
    name: 'Rectangular / Square Pool',
    heading: 'Rectangle/Square Pool — 15/20/50 cm Wall',
    wallOptions: '15 cm / 20 cm / 50 cm',
    sizeRange: '2 × 2 × 0.8 m – 6 × 5 × 1.5 m',
    highlights:
      'Large models feature 50 cm reinforced extra-thick side walls, supporting tens of tons of lateral water pressure without external metal frames; the pool rim allows comfortable sitting or lounging.',
    included: ['1000W high-power electric air pump', 'Full-coverage dustproof & waterproof cover', 'Repair kit'],
    includedImage: '/images/pools/accessories-set.webp',
    items: [
      { item: 'SR220815', size: '2 × 2 × 0.8', wall: '15 cm', weightKg: null, fobUsd: 285.7 },
      { item: 'SR230815', size: '3 × 2 × 0.8', wall: '15 cm', weightKg: null, fobUsd: 395.39 },
      { item: 'SR341220', size: '4 × 3 × 1.2', wall: '20 cm', weightKg: null, fobUsd: 529.31 },
      { item: 'SR341250', size: '4 × 3 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1002.5 },
      { item: 'SR341550', size: '4 × 3 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1079.03 },
      { item: 'SR441250', size: '4 × 4 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1057.35 },
      { item: 'SR441550', size: '4 × 4 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1133.87 },
      { item: 'SR351250', size: '5 × 3 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1045.87 },
      { item: 'SR351550', size: '5 × 3 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1135.15 },
      { item: 'SR361250', size: '6 × 3 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1167.04 },
      { item: 'SR361550', size: '6 × 3 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1290.75 },
      { item: 'SR461250', size: '6 × 4 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1473.14 },
      { item: 'SR461550', size: '6 × 4 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1587.93 },
      { item: 'SR561250', size: '6 × 5 × 1.2', wall: '50 cm', weightKg: null, fobUsd: 1562.43 },
      { item: 'SR561550', size: '6 × 5 × 1.5', wall: '50 cm', weightKg: null, fobUsd: 1753.74 },
    ],
  },
  {
    id: 'hot-tub-square-rect',
    name: 'Square / Rectangular Constant Temperature SPA Tub',
    heading: 'Hot Pool/Tub Square/Rectangle — 15/20 cm Wall',
    wallOptions: '15 cm / 20 cm',
    sizeRange: '1.5 × 1.5 × 0.8 m – 3 × 2 × 1 m',
    highlights:
      'Standard built-in integrated inflatable seats and a 5 mm insulated thermal bottom base for heat retention; compatible with various heating units and spa therapy equipment.',
    included: ['Built-in inflatable seats', '5 mm insulated thermal bottom'],
    items: [
      { item: 'SS151508', size: '1.5 × 1.5 × 0.8', wall: '15/20 cm', weightKg: null, fobUsd: 381.36 },
      { item: 'SS181808', size: '1.8 × 1.8 × 0.8', wall: '15/20 cm', weightKg: null, fobUsd: 447.68 },
      { item: 'SS202008', size: '2 × 2 × 0.8', wall: '15/20 cm', weightKg: null, fobUsd: 529.31 },
      { item: 'SS202010', size: '2 × 2 × 1', wall: '15/20 cm', weightKg: null, fobUsd: 558.65 },
      { item: 'SS242410', size: '2.4 × 2.4 × 1', wall: '15/20 cm', weightKg: null, fobUsd: 651.75 },
      { item: 'SS211608', size: '2.1 × 1.6 × 0.8', wall: '15/20 cm', weightKg: null, fobUsd: 478.29 },
      { item: 'SS302010', size: '3 × 2 × 1', wall: '15/20 cm', weightKg: null, fobUsd: 667.06 },
    ],
  },
  {
    id: 'hot-tub-round',
    name: 'Round Constant Temperature SPA Tub',
    heading: 'Hot Pool/Tub Round — 8/10/15 cm Wall',
    wallOptions: '8 cm / 10 cm / 15 cm',
    sizeRange: 'Diameter 1.8 m / 2.0 m / 2.3 m',
    highlights:
      'Compact hydrotherapy design, also equipped with built-in seats and a 5 mm insulated thermal bottom base; small footprint, quick warm-up with an external heater (not included) — for courtyards and balconies rated for the filled weight.',
    included: ['Built-in inflatable seats', '5 mm insulated thermal bottom'],
    items: [
      { item: 'RS1808', size: 'Ø 1.8 × 0.8', wall: '8 cm', weightKg: null, fobUsd: 390.29 },
      { item: 'RS2018', size: 'Ø 2 × 0.8', wall: '10 cm', weightKg: null, fobUsd: 441.31 },
      { item: 'RS2308', size: 'Ø 2.3 × 0.8', wall: '15 cm', weightKg: null, fobUsd: 487.22 },
    ],
  },
];

export const poolAccessories: PoolAccessory[] = [
  {
    name: 'Inflatable Stairs 1.2 M',
    spec: 'Inflatable boarding steps, 1.2 m',
    image: '/images/pools/inflatable-stairs.png',
    fobUsd: 419.62,
  },
  {
    name: 'Inflatable Stairs 1.5 M',
    spec: 'Inflatable boarding steps, 1.5 m',
    image: '/images/pools/inflatable-stairs.png',
    fobUsd: 550.99,
  },
  {
    name: '4-Step Ladder',
    spec: 'Safety ladder, 1.62 m',
    image: '/images/pools/ladder-4-step-1.png',
    fobUsd: 49.74,
  },
  {
    name: 'Rechargeable Air Pump',
    spec: 'DC 12–14.4 V, 11.1 V / 6000 mAh battery',
    image: '/images/pools/rechargeable-air-pump.webp',
    fobUsd: 87.84,
  },
  {
    name: 'FS-12C Sand Filter Pump',
    spec: '370 W, Ø300 tank + filter base + valve + valve clamp + gauge',
    image: '/images/pools/sand-filter-fs12c.webp',
    fobUsd: 174.79,
  },
];
