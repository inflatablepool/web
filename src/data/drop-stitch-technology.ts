/**
 * Shared content for the drop-stitch technology centre, material guide and
 * water-capacity calculator.
 *
 * Every number published here is either:
 *  - a published catalog / pressure fact already used on the site, or
 *  - a measured result from the FB-DSP-400 destructive-test campaign
 *    (RPT-FB-QC-20261113), or
 *  - a standard mathematical conversion.
 *
 * Do not add denier-only performance rankings, per-SKU pressure figures,
 * packaging data or MOQ values without factory-confirmed evidence.
 */

export interface TechFaq {
  q: string;
  a: string;
}

export interface TechDocument {
  label: string;
  href: string;
  description: string;
}

export interface ShapeComparisonRow {
  feature: string;
  round: string;
  square: string;
  rectangular: string;
}

export interface DestructiveTestRow {
  stage: string;
  test: string;
  measured: string;
}

export const TECH_FAQS: TechFaq[] = [
  {
    q: 'What is a drop stitch inflatable pool?',
    a: 'A drop stitch inflatable pool uses a coated fabric in which thousands of internal threads connect the two surfaces. When the wall is inflated, the threads hold the surfaces at a controlled distance instead of letting the chamber balloon into a round tube. The result is a flatter, more rigid wall that can support the pool shape while still deflating and folding for storage. Performance depends on the laminate, wall design, welding, valve system and the pressure confirmed for the specific model.',
  },
  {
    q: 'Is drop stitch fabric the same as PVC?',
    a: 'No. Drop stitch describes the internal thread structure that spaces two fabric surfaces. The surfaces are usually PVC-coated, and the finished wall is a laminate: base fabric, coating layers and the thread array. "PVC" alone does not tell you whether a product is drop stitch, how thick the laminate is, or how the wall is welded. Ask for both the construction type and the material datasheet.',
  },
  {
    q: 'Does a higher denier mean a thicker pool wall?',
    a: 'No. Denier describes the reinforcing yarn, not the finished laminate thickness. A 1500D yarn is heavier than a 1000D yarn at the same yarn count, but the finished wall thickness also depends on coating weight, base fabric, lamination and the drop-stitch core. A higher denier is not automatically better for every application. Compare the complete laminate specification and the test results for the model.',
  },
  {
    q: 'Is the "15 cm wall" the thickness of the PVC sheet?',
    a: 'No. In our catalog, 10, 15, 20 and 50 cm refer to the inflated drop-stitch wall or chamber thickness, not the thickness of the PVC sheet. The sheet or laminate thickness is a separate material specification. Wall height is also different: it is the overall height of the pool wall, while water depth is the level you actually fill to.',
  },
  {
    q: 'What inflation pressure should I use?',
    a: 'Use the pressure stated on the model\'s nameplate or approved specification. For our standard pool models, the published baseline is 4-5 PSI recommended operating pressure, with a pressure-relief valve that releases above 6 PSI — never force inflation past this threshold. Custom models, SPA tubs and project-specific designs can differ. Inflate gradually, check with a gauge, and do not use a higher pressure to make the wall "harder".',
  },
  {
    q: 'Why do different drop stitch pools list different pressures?',
    a: 'Pressure is a design output, not a universal badge of quality. Chamber thickness, wall geometry, laminate, seam construction, valve rating and the test basis all affect the approved pressure. A product rated at a different pressure may use a different construction or a different definition of operating and maximum pressure. Compare the nameplate definitions and the test reports, not a single PSI number from another website.',
  },
  {
    q: 'Is a round pool stronger than a rectangular pool?',
    a: 'The shapes carry water pressure differently. A round pool uses a continuous circular wall; a rectangular pool has straight walls and 90-degree corners where bending and seam loads concentrate. Neither shape is universally stronger. The materials, wall design, welding, reinforcement, pressure control, ground conditions and testing determine real performance. Choose the shape for the space and use case, then verify the engineering.',
  },
  {
    q: 'How much water does an inflatable pool hold?',
    a: 'It depends on the internal dimensions and the actual water depth, not the nominal outside size. Use internal diameter or internal length and width, then multiply by the fill depth. Our water capacity calculator applies the standard formulas and reports cubic metres, litres and US gallons. The result is a theoretical volume estimate, not a safe bather load or a structural rating.',
  },
  {
    q: 'Can drop stitch pools be customized?',
    a: 'Yes, within the capabilities confirmed for the project. Standard programs cover multiple shapes, sizes and wall options; OEM/ODM projects can review custom dimensions, colors, branding, valve placement, covers, accessories and packaging. MOQ, tooling, sample timing, lead time and the applicable material specification are confirmed in the quotation. Custom work is reviewed against the approved drawing and test plan.',
  },
  {
    q: 'What test evidence should I ask for?',
    a: 'Ask for the test method, the model and batch tested, the measured values, the acceptance criteria and the signed report. A useful package includes material peel and puncture checks, seam and valve checks, pressure and leak testing, and structural tests such as overload or burst where applicable. Our published campaign on the FB-DSP-400 tested eight destructive items and passed 8/8; the four signed reports are downloadable. Do not assume one model\'s results apply to every SKU.',
  },
];

export const MATERIAL_FAQS: TechFaq[] = [
  {
    q: 'What does 1000D or 1500D mean in drop stitch fabric?',
    a: 'D is denier, the mass in grams of 9,000 metres of yarn. 1000D means the yarn has a linear mass density of 1,000 g per 9,000 m; 1500D is 1,500 g per 9,000 m. It describes the reinforcing yarn, not the finished PVC sheet thickness. The same denier can be coated or laminated differently, producing different finished thickness, weight, adhesion and strength.',
  },
  {
    q: 'Is 1500D always better than 1000D?',
    a: 'No. A heavier yarn can improve some properties, but it can also add weight and cost. The finished laminate\'s performance depends on the base fabric, coating weight, adhesion, stabilizers, lamination process and the wall design. A well-engineered 1000D laminate can outperform a poorly made 1500D laminate. Compare complete datasheets and model test results.',
  },
  {
    q: 'How is the PVC coating measured?',
    a: 'Suppliers typically report coating weight in g/m2, total laminate thickness in mm or microns, and sometimes the base-fabric weight. Ask for the test method and whether the value is nominal or measured. Do not compare a coating weight from one supplier with a total laminate weight from another; confirm the units and what is included.',
  },
  {
    q: 'Which material tests matter for a pool wall?',
    a: 'Useful checks include coating peel adhesion, tensile strength and elongation in both warp and weft, tear strength, cold-fold resistance, and UV or weathering exposure where the market requires it. For the finished product, pressure and leak testing and structural tests matter as much as the material datasheet. Ask for the test standard, specimen orientation, conditioning and measured values.',
  },
  {
    q: 'Can you supply 1000D or 1500D?',
    a: 'The available laminate is confirmed for the specific model and project. Our published product specification identifies the wall material as double-layer PVC drop stitch fabric; the detailed fabric denier, coating weight and test data are confirmed in the approved material specification before production. Share your target market, use case and performance requirements so the applicable option can be reviewed.',
  },
  {
    q: 'Do you publish a single 1000D vs 1500D comparison winner?',
    a: 'No. Publishing a winner based only on the denier label would be misleading. We ask buyers to compare the complete laminate specification, the wall construction and the test results for the model they are buying. If a project requires a specific denier or test threshold, state it in the RFQ and we will confirm whether it can be supported.',
  },
];

export const CAPACITY_FAQS: TechFaq[] = [
  {
    q: 'Should I use internal or external pool dimensions?',
    a: 'Use internal dimensions. The outside size includes the wall and any rail or fitting projection, so it overstates the water volume. For a round pool, use the internal diameter; for a square or rectangular pool, use the internal length and width. If you only have the outside size, ask for the internal dimension on the approved drawing rather than guessing.',
  },
  {
    q: 'Why can\'t I just fill the pool to the top?',
    a: 'A pool needs freeboard: the wall above the waterline helps contain splash and wave movement. The safe fill level depends on the model, the use and the manufacturer\'s instructions. Enter the water depth you actually plan to use, not the full wall height. The calculator will not add freeboard for you.',
  },
  {
    q: 'Does the calculator tell me how many people can use the pool?',
    a: 'No. Water volume is not a bather-load rating. Bather capacity depends on the pool\'s design, water depth, supervision, local rules and the manufacturer\'s instructions. The calculator only estimates water volume and weight. It does not certify structural safety, bather load or compliance.',
  },
  {
    q: 'How do I convert the result to gallons?',
    a: 'The calculator reports cubic metres, litres and US gallons. One cubic metre equals 1,000 litres or approximately 264.172 US gallons. If you need imperial gallons, multiply litres by 0.219969. Do not mix US and imperial gallons in the same comparison.',
  },
  {
    q: 'Why is the water weight important?',
    a: 'Fresh water weighs approximately 1,000 kg per cubic metre, so a 10 m3 pool holds about 10 tonnes of water before adding the pool, people or equipment. The ground or deck must be able to support the filled load. The calculator gives an estimate only; a structural engineer should confirm the support requirement for your site.',
  },
  {
    q: 'Can I use the calculator for a custom pool?',
    a: 'Yes, if you know the internal dimensions and planned water depth. For a custom project, use the dimensions from the approved drawing, not the nominal marketing size. If the drawing is not available yet, ask for it before comparing options.',
  },
];

export const SHAPE_COMPARISON: ShapeComparisonRow[] = [
  {
    feature: 'Footprint',
    round: 'Circular; needs a square area that contains the circle.',
    square: 'Square; efficient in square courtyards and patios.',
    rectangular: 'Rectangular; fits long decks and lap-style layouts.',
  },
  {
    feature: 'Wall geometry',
    round: 'One continuous circular wall.',
    square: 'Four straight walls of equal length.',
    rectangular: 'Four straight walls; two long and two short.',
  },
  {
    feature: 'Corners',
    round: 'No 90-degree corners.',
    square: 'Four 90-degree corners.',
    rectangular: 'Four 90-degree corners.',
  },
  {
    feature: 'Space use',
    round: 'Even swimming radius; curved clearance around the pool.',
    square: 'Good usable area for a compact footprint.',
    rectangular: 'Most efficient for a long, defined swim or play area.',
  },
  {
    feature: 'Typical use',
    round: 'Family leisure, resorts, events, rental properties.',
    square: 'Patios, compact commercial spaces, plunge pools.',
    rectangular: 'Hotels, vacation rentals, larger families, commercial projects.',
  },
  {
    feature: 'Engineering focus',
    round: 'Circular wall load path and floor-to-wall seam.',
    square: 'Corner reinforcement, straight-wall stiffness, seam loads.',
    rectangular: 'Corner and seam loads, long-wall bending, bottom-to-wall connection.',
  },
  {
    feature: 'Customization',
    round: 'Diameter, height, wall, color, branding.',
    square: 'Side length, height, wall, color, branding.',
    rectangular: 'Length, width, height, wall, color, branding.',
  },
];

export const PRESSURE_DEFINITIONS = [
  {
    term: 'Recommended operating pressure',
    value: '4-5 PSI',
    meaning: 'The normal inflation target for our standard pool models. Confirm the nameplate for your specific model.',
  },
  {
    term: 'Maximum inflation pressure',
    value: '6 PSI',
    meaning: 'The practical inflation cap for standard models: the relief valve auto-releases above this threshold. It is a limit, not an operating target.',
  },
  {
    term: 'Pressure-relief valve',
    value: 'Releases above 6 PSI',
    meaning: 'Protects standard models against over-inflation and heat expansion. Do not rely on the valve as a fill gauge.',
  },
  {
    term: 'Rated working pressure (Pw)',
    value: 'Model-specific',
    meaning: 'The reference pressure used in destructive-test reports. The FB-DSP-400 campaign used Pw = 8.0 PSI.',
  },
];

export const DESTRUCTIVE_TEST_MATRIX: DestructiveTestRow[] = [
  {
    stage: 'Material',
    test: 'Coating 180-degree peel and base-fabric tear',
    measured: 'Mean 136.5-149.4 N/5 cm; minimum 115.4 N/5 cm; 100% cohesive fiber tear.',
  },
  {
    stage: 'Material',
    test: 'Pressurized single-point puncture',
    measured: 'Force 406.2-425.0 N; tear 8.2 mm; no burst.',
  },
  {
    stage: 'Material',
    test: '-18 C cold folding and leak check',
    measured: '0 bubbles on all 6 panel and seam cuts; no whitening.',
  },
  {
    stage: 'Process',
    test: '55 C / 1.5x Pw 48-hour creep',
    measured: 'Maximum expansion 5.2%; maximum slip 0.42 mm; pressure drop 3.3%.',
  },
  {
    stage: 'Process',
    test: 'Step-up overpressure burst',
    measured: 'Burst at 25.4 PSI = 3.18x Pw; parent-panel rupture; all seams intact.',
  },
  {
    stage: 'Structure',
    test: '110% overload water fill, 72 hours',
    measured: 'Maximum tilt 5.6 degrees; seams and triangular gusset intact.',
  },
  {
    stage: 'Structure',
    test: '150 kg rim load and 500 pendulum impacts',
    measured: '11.8 mm depression, no buckling; 0.0 PSI drop and 0 bubbles after impact.',
  },
  {
    stage: 'Structure',
    test: 'Valve torque and drain pull-out',
    measured: 'Valve torque 31.9-36.4 N m; drain pull-out 1,185 N (+48% over the requirement).',
  },
];

export const MATERIAL_DOCUMENT_CHECKLIST = [
  'Yarn denier and base-fabric construction',
  'PVC coating weight (g/m2) and total laminate thickness',
  'Coating peel adhesion (N/5 cm) and the test method',
  'Tensile strength and elongation, warp and weft',
  'Tear strength and the test method',
  'Cold-fold or low-temperature performance',
  'UV or weathering exposure, if required by the target market',
  'REACH, RoHS or phthalate statement, if required',
  'Colorfastness or migration data for printed or colored surfaces',
  'Model and batch traceability plus a signed report',
];

export const TECH_DOCUMENTS: TechDocument[] = [
  {
    label: 'Pool specification and FOB price list',
    href: '/products/specs',
    description: 'Sizes, wall options, packed weights and indicative FOB Qingdao prices for the standard catalog.',
  },
  {
    label: 'Product comparison chart (PDF)',
    href: '/spec-sheets/product-comparison.pdf',
    description: 'A print-ready side-by-side sheet generated from the published product data.',
  },
  {
    label: 'Destructive test results and reports',
    href: '/quality-control/destructive-testing/results',
    description: 'The 8/8 campaign on the FB-DSP-400, with measured values and four signed PDF reports.',
  },
  {
    label: 'Manufacturing process',
    href: '/manufacturing',
    description: 'The five production steps from fabric preparation to pressure and leak testing.',
  },
  {
    label: 'Quality control framework',
    href: '/quality-control',
    description: 'Inspection checkpoints, test criteria and the destructive-testing SOP.',
  },
  {
    label: 'Water capacity calculator',
    href: '/inflatable-pool-water-capacity',
    description: 'Estimate volume and water weight from internal dimensions and planned fill depth.',
  },
];
