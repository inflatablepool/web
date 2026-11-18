/**
 * SKU engineering parameter SSOT (single source of truth).
 *
 * Purpose (gap-analysis 2026-11, section 七): keep engineering parameters in a
 * dedicated, typed module instead of mixing them into product marketing copy.
 *
 * Catalog identity fields (item, size, wall, packed weight, FOB price) are NOT
 * duplicated here — they come from `pool-catalog.ts`. This module layers the
 * engineering baseline over that catalog and models the factory-unconfirmed
 * fields explicitly as `null` (= "on request / to be confirmed by the factory"),
 * never as estimated or invented values.
 *
 * Pending per-SKU fields (carton dimensions, N.W./G.W., MOQ, 20GP/40HQ unit
 * counts, per-SKU measured pressure) stay null until the engineering
 * department publishes confirmed values. Pages must render null as
 * "On request" — never as an estimate.
 */

import {
  poolSeries,
  POOL_OPERATING_PRESSURE,
  POOL_MAX_PRESSURE,
  POOL_RELIEF_VALVE_PRESSURE,
} from './pool-catalog';

// ---------------------------------------------------------------------------
// Pressure definitions (platform baseline)
// ---------------------------------------------------------------------------

export interface PressureDefinition {
  parameter: string;
  publishedValue: string;
  dataNature: string;
  note: string;
}

/**
 * The published pressure baseline, including the explicit distinction between
 * the recommended operating pressure, the maximum inflation pressure, the
 * relief-valve threshold and the rated working pressure (Pw) used as the
 * reference in destructive type-test reports. Pw = 8.0 PSI on the FB-DSP-400
 * nameplate equals the 8 PSI maximum inflation pressure for that model — it is
 * the structural verification reference, NOT a recommended operating pressure.
 */
export const PRESSURE_DEFINITIONS: PressureDefinition[] = [
  {
    parameter: 'Recommended operating pressure',
    publishedValue: POOL_OPERATING_PRESSURE,
    dataNature: 'Standard platform reference',
    note: 'The everyday inflation target for standard pool models. Confirm the nameplate for the exact SKU.',
  },
  {
    parameter: 'Maximum inflation pressure',
    publishedValue: POOL_MAX_PRESSURE,
    dataNature: 'Standard platform reference',
    note: 'The structural limit the design must survive. Do not inflate beyond the model rating.',
  },
  {
    parameter: 'Pressure-relief valve auto-release',
    publishedValue: `Above ${POOL_RELIEF_VALVE_PRESSURE}`,
    dataNature: 'Standard platform reference',
    note: 'Protects against over-inflation and heat expansion; the actual opening tolerance is confirmed per model.',
  },
  {
    parameter: 'Rated working pressure (Pw) in type-test reports',
    publishedValue: '8.0 PSI (FB-DSP-400 nameplate)',
    dataNature: 'Type-test reference for the tested model',
    note: 'The reference pressure used in destructive-test reports. For FB-DSP-400 it equals the 8 PSI maximum inflation pressure — it is not the 4–5 PSI recommended operating pressure.',
  },
  {
    parameter: 'Per-SKU measured pressure',
    publishedValue: 'Not published per SKU',
    dataNature: 'Pending engineering confirmation',
    note: 'Per-SKU nameplate values, relief-valve tolerances and QC test pressures are confirmed in the approved model specification.',
  },
];

// ---------------------------------------------------------------------------
// Container reference (planning baseline)
// ---------------------------------------------------------------------------

export interface ContainerReference {
  code: string;
  name: string;
  /** Usable cubic capacity in m³ (approximate planning figure) */
  capacityM3: number;
  /** Typical maximum payload in kg (approximate planning figure) */
  payloadKg: number;
}

export const CONTAINER_REFERENCE: ContainerReference[] = [
  { code: '20GP', name: '20 ft General Purpose', capacityM3: 33, payloadKg: 21500 },
  { code: '40HQ', name: '40 ft High Cube', capacityM3: 76, payloadKg: 21500 },
];

/**
 * Published packed weights are single "Packed weight" figures from the
 * quotation sheet. They are not split into net weight (N.W.) and gross
 * weight (G.W.) and must not be presented as certified G.W. values.
 */
export const PACKED_WEIGHT_CAVEAT =
  'The published "Packed weight" is the weight of the packed product from the factory quotation sheet. It is not separately published as net weight (N.W.) or gross weight (G.W.); confirm both, the carton dimensions and the pallet/loading plan in your quotation.';

// ---------------------------------------------------------------------------
// Published type-test evidence (FB-DSP-400 campaign)
// ---------------------------------------------------------------------------

export interface TypeTestItem {
  test: string;
  result: string;
}

export interface TypeTestCampaign {
  model: string;
  campaignId: string;
  lot: string;
  units: string;
  dates: string;
  specimen: string;
  items: TypeTestItem[];
  scopeNote: string;
}

/**
 * The published destructive type-test campaign. Scope: one model
 * (FB-DSP-400, 4 x 3 x 1.2 m, 20 cm drop-stitch wall), one lot, three
 * finished units. These results do NOT cover all 48 catalog SKUs and must
 * never be presented as a certification of the whole catalog.
 */
export const TYPE_TEST_CAMPAIGN: TypeTestCampaign = {
  model: 'FB-DSP-400',
  campaignId: 'RPT-FB-QC-20261113',
  lot: 'LOT-202611-A08',
  units: '3 finished units',
  dates: '2026-11-09 to 2026-11-13',
  specimen: '4 × 3 × 1.2 m, 20 cm drop-stitch wall',
  items: [
    { test: 'PVC coating 180° peel', result: '136.5–149.4 N/5 cm average, minimum 115.4 N/5 cm, 100% cohesive fiber tear' },
    { test: 'Pressurized single-point puncture', result: '406.2–425.0 N at 8.0 PSI, no leak' },
    { test: 'Low-temperature folding', result: '-18 °C, 6 specimens, no cracks, no whitening' },
    { test: '55 °C / 1.5× Pw creep (48 h)', result: 'Max wall-thickness growth 5.2% (spec ≤10%), max witness-line slip 0.42 mm (spec ≤1.0 mm)' },
    { test: 'Step-up burst', result: 'Burst at 25.4 PSI = 3.18× Pw (spec ≥2.5× Pw); parent-panel rupture, all seams intact' },
    { test: '110% water overload', result: '72 hours, 5.6° tilt, no failure' },
    { test: 'Pendulum impact', result: '500 impacts, zero pressure drop, zero bubbles on the post-impact 1.5× Pw hold' },
    { test: 'Valve torque / drain pull-out', result: '31.9–36.4 N·m / 1,185 N' },
  ],
  scopeNote:
    'These results cover the tested model, lot and units only. They are published type-test evidence for FB-DSP-400, not a certification covering all 48 catalog SKUs.',
};

// ---------------------------------------------------------------------------
// Per-SKU engineering records
// ---------------------------------------------------------------------------

export interface SkuEngineeringRecord {
  /** Factory item number, e.g. "S3012" */
  sku: string;
  /** Catalog series id, e.g. "round" */
  seriesId: string;
  /** Catalog series display name */
  seriesName: string;
  /** Nominal size in metres (diameter × height for round pools) */
  size: string;
  /** Inflated drop-stitch wall / chamber thickness */
  wall: string;
  /** Published "Packed weight" in kg, or null when not published */
  packedWeightKg: number | null;
  /** Carton length in mm — null until the factory publishes carton data */
  cartonLengthMm: number | null;
  /** Carton width in mm — null until the factory publishes carton data */
  cartonWidthMm: number | null;
  /** Carton height in mm — null until the factory publishes carton data */
  cartonHeightMm: number | null;
  /** Net weight in kg — null until the factory publishes N.W./G.W. splits */
  netWeightKg: number | null;
  /** Gross weight in kg — null until the factory publishes N.W./G.W. splits */
  grossWeightKg: number | null;
  /** MOQ for the SKU — confirmed per SKU and order in the quotation */
  moq: number | null;
  /** Confirmed units per 20GP — null until a real loading plan exists */
  unitsPer20gp: number | null;
  /** Confirmed units per 40HQ — null until a real loading plan exists */
  unitsPer40hq: number | null;
}

/**
 * Engineering records for all standard catalog SKUs, derived from the catalog
 * series in `pool-catalog.ts`. Logistics fields are null (pending) by design:
 * the factory has not yet published carton dimensions, N.W./G.W. splits, MOQs
 * or per-SKU container loading counts, and this module must not invent them.
 */
export const skuEngineeringRecords: SkuEngineeringRecord[] = poolSeries.flatMap((series) =>
  series.items.map(
    (item): SkuEngineeringRecord => ({
      sku: item.item,
      seriesId: series.id,
      seriesName: series.name,
      size: item.size,
      wall: item.wall,
      packedWeightKg: item.weightKg,
      cartonLengthMm: null,
      cartonWidthMm: null,
      cartonHeightMm: null,
      netWeightKg: null,
      grossWeightKg: null,
      moq: null,
      unitsPer20gp: null,
      unitsPer40hq: null,
    })
  )
);

/** SKUs with a published packed weight (usable for weight-based planning). */
export const skusWithPublishedWeight: SkuEngineeringRecord[] = skuEngineeringRecords.filter(
  (record) => record.packedWeightKg !== null
);
