export interface StandalonePage {
  slug: string;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
  features: { label: string; desc: string }[];
  pageType: 'service' | 'capability' | 'about';
}

export const standalonePages: StandalonePage[] = [
  {
    slug: 'drop-stitch-technology',
    title: 'Drop Stitch Pool Technology',
    description:
      "How Inflatable Pool Factory uses high-pressure drop stitch construction to build inflatable swimming pools with rigid, self-supporting walls that hold their shape all season and fold away for winter storage.",
    pageType: 'capability',
    sections: [
      {
        heading: 'What Is Drop Stitch?',
        body: 'Drop stitch fabric joins two layers of PVC with thousands of internal polyester threads. When the chamber inflates, the threads lock the layers a fixed distance apart, turning soft fabric into a panel as rigid as plywood. This is the same construction used in high-pressure inflatable stand-up paddleboards.',
      },
      {
        heading: 'Why It Makes a Better Pool',
        body: 'A traditional ring pool relies on a single air tube that buckles under water pressure — walls lean, the water line sags, and usable depth shrinks. A drop stitch pool carries the water load in tension through rigid walls, so it holds full depth and a level water line all season.',
      },
      {
        heading: 'Materials & Durability',
        body: 'Inflatable Pool Factory pools use multi-layer laminated PVC with UV stabilizers and puncture-resistant reinforcement. Every pool is inflation-tested at the factory before shipment, and with basic care — clean chemistry, careful ground prep, and dry storage — a pool can deliver seasons of reliable use.',
      },
      {
        heading: 'Setup and Storage',
        body: 'Inflating takes 5–15 minutes with the included pump; filling time varies with pool size and water supply. At season end, drain, clean, dry, deflate, and fold the pool into its carry bag for compact indoor storage.',
      },
    ],
    features: [
      { label: 'Rigid Walls', desc: 'Self-supporting drop stitch panels — no frame, no stakes, no tools' },
      { label: 'UV-Resistant PVC', desc: 'Laminated shell with UV stabilizers for seasons of outdoor use' },
      { label: 'Fast Setup', desc: '5–15 minutes from box to inflated' },
      { label: 'Compact Storage', desc: 'Folds into a carry bag the size of a large duffel' },
    ],
  },
  {
    slug: 'oem-odm-pools',
    title: 'OEM / ODM Pool Manufacturing',
    description:
      'Custom inflatable pool manufacturing from Inflatable Pool Factory: custom sizes, colors, logos, covers, and packaging, produced in our own factory and shipped factory-direct worldwide.',
    pageType: 'service',
    sections: [
      {
        heading: 'Custom Sizes and Shapes',
        body: 'We manufacture pools in custom diameters, wall heights, and rectangular footprints to fit your market. From compact patio pools to full-size family swim pools, dimensions are built to your specification.',
      },
      {
        heading: 'Branding and Packaging',
        body: 'Logo printing, custom color schemes, branded covers, and retail-ready packaging are all produced in-house. Send your artwork and requirements for a quote and lead time estimate.',
      },
      {
        heading: 'Quality You Can Sell',
        body: 'Every pool is inflation-tested before it leaves the factory. Materials comply with REACH and RoHS requirements, and documentation is available for retail compliance in your market.',
      },
      {
        heading: 'Factory-Direct Logistics',
        body: 'We ship directly from our factory to your warehouse or port. Wholesale pricing scales with volume, and repeat orders keep consistent quality across seasons.',
      },
    ],
    features: [
      { label: 'Custom Dimensions', desc: 'Any practical diameter, length, and wall height' },
      { label: 'Private Label', desc: 'Your logo, colors, and packaging' },
      { label: 'Compliance Docs', desc: 'REACH/RoHS material documentation available' },
      { label: 'Wholesale Pricing', desc: 'Factory-direct rates on bulk orders' },
    ],
  },
];
