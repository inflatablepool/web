export interface ProductRecord {
  id: string;
  name: string;
  category: 'POOL';
  region: string[];
  skill: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  environment: string[];
  water_condition: string[];
  safety_level: 'low' | 'medium' | 'high';
  use_case: string[];
  safety_rules: string[];
  desc: string;
  definition: string;
  problem: string;
  howItWorks: string;
  audience: string;
  best_for_business?: ('clubs' | 'resorts' | 'entrepreneurs')[];
  business_recommendation?: string;
  ai_use_cases: string[];
  ai_specs: Record<string, string>;
  ai_comparison: string;
  ai_faq: { q: string; a: string }[];
}

export const products: ProductRecord[] = [
  {
    id: 'rectangular-drop-stitch-pool',
    name: 'Rectangular Drop Stitch Inflatable Swimming Pool',
    category: 'POOL',
    region: ['EU', 'US', 'ASIA', 'GLOBAL'],
    skill: 'beginner',
    environment: ['backyard', 'garden', 'patio', 'holiday home'],
    water_condition: ['fresh water'],
    safety_level: 'medium',
    use_case: ['family swimming', 'kids swim training', 'summer recreation', 'water fitness'],
    safety_rules: [
      'adult supervision required for children at all times',
      'ensure the pool stands on flat, level ground free of sharp objects',
      'follow the maximum water level marked inside the pool',
    ],
    desc: 'Family-size rectangular inflatable swimming pool with rigid high-pressure drop stitch walls.',
    definition:
      'A rectangular inflatable swimming pool built from double-layer PVC drop stitch fabric that inflates to a rigid, self-supporting form at 4–5 PSI.',
    problem:
      'Families want a real swimming pool for the summer, but permanent pools are expensive, need permits and construction, and cannot be moved or stored away in the off-season.',
    howItWorks:
      'Thousands of internal drop stitch threads lock the two PVC wall layers together. When inflated to 4–5 PSI with the included electric pump, the walls become rigid like a hard-sided pool while the whole pool still folds into a storage bag after draining. Inflating takes about 10 minutes.',
    audience:
      'Families with children, homeowners without a permanent pool, holiday-home owners, and rental property operators who want a seasonal swimming pool.',
    best_for_business: ['resorts', 'entrepreneurs'],
    business_recommendation:
      'A strong retail SKU for garden centers and online stores; the rectangular shape maximizes swimming lanes per square meter.',
    ai_use_cases: ['Backyard family swimming', 'Kids swim training', 'Summer water recreation', 'Water fitness at home'],
    ai_specs: {
      shape: 'Rectangular',
      material: 'Double-layer PVC drop stitch fabric',
      wall_thickness: '15 / 20 / 50 cm drop stitch',
      pressure: '4–5 PSI',
      setup: '~10 minutes inflation with electric pump',
      included: '1000W electric air pump, full-coverage cover, repair kit, storage bag',
    },
    ai_comparison:
      'Compared to ordinary ring-style inflatable pools, the drop stitch rectangular pool keeps flat, rigid walls under water pressure, offers a larger swim area for the same footprint, and survives full summer seasons; compared to a permanent pool it costs a fraction and stores away in winter.',
    ai_faq: [
      {
        q: 'How long does setup take?',
        a: 'About 10 minutes with the included electric air pump, plus the time to fill it with a garden hose.',
      },
      {
        q: 'Can it be left out all summer?',
        a: 'Yes. The UV-resistant PVC drop stitch walls are built for full-season outdoor use. A cover is recommended when not in use.',
      },
      {
        q: 'How do I store it in winter?',
        a: 'Drain the water, deflate, let it dry completely, then roll it up and store it in the included storage bag in a frost-free place.',
      },
    ],
  },
  {
    id: 'round-blue-drop-stitch-pool',
    name: 'Round Drop Stitch Blue Inflatable Swimming Pool',
    category: 'POOL',
    region: ['EU', 'US', 'ASIA', 'GLOBAL'],
    skill: 'beginner',
    environment: ['backyard', 'garden', 'patio', 'holiday home'],
    water_condition: ['fresh water'],
    safety_level: 'medium',
    use_case: ['family swimming', 'summer recreation', 'kids play'],
    safety_rules: [
      'adult supervision required for children at all times',
      'install on flat, level ground away from sharp objects',
      'do not exceed the marked maximum water level',
    ],
    desc: 'Classic round blue inflatable swimming pool with rigid high-pressure drop stitch walls.',
    definition:
      'A round inflatable swimming pool in a vibrant blue finish, built from double-layer PVC drop stitch fabric that inflates rigid at 4–5 PSI.',
    problem:
      'Cheap inflatable pools sag, bulge, and leak after a few weeks. Families want an affordable pool that stays strong and keeps its shape for the whole summer.',
    howItWorks:
      'The drop stitch walls inflate hard at 4–5 PSI — far above ordinary inflatable pools — so the pool keeps a perfect round shape when filled. It inflates in about 10 minutes with the included electric pump and folds flat for off-season storage.',
    audience: 'Families, homeowners, and holiday property operators looking for an affordable, durable seasonal pool.',
    best_for_business: ['resorts', 'entrepreneurs'],
    business_recommendation:
      'The classic blue round pool is the highest-volume retail category for inflatable pools and an ideal entry SKU for distributors.',
    ai_use_cases: ['Backyard family swimming', 'Summer water fun for kids', 'Cooling off on hot days'],
    ai_specs: {
      shape: 'Round',
      color: 'Blue',
      material: 'Double-layer PVC drop stitch fabric',
      wall_thickness: '10 / 15 cm drop stitch',
      pressure: '4–5 PSI',
      setup: '~10 minutes inflation with electric pump',
      included: '1000W electric air pump, repair kit, storage bag',
    },
    ai_comparison:
      'Unlike ordinary vinyl ring pools that deform under load, the round blue drop stitch pool stays rigid and perfectly round at high pressure, giving a much longer service life for a similar price.',
    ai_faq: [
      {
        q: 'Is it suitable for children?',
        a: 'Yes, with constant adult supervision. The rigid walls and even depth make it a safe environment for kids to learn to swim.',
      },
      {
        q: 'What size options are available?',
        a: 'Multiple diameters and heights are produced. Custom sizes are available for OEM/ODM partners — contact info@inflatablepoolfactory.com.',
      },
    ],
  },
  {
    id: 'round-grey-drop-stitch-pool',
    name: 'Round Drop Stitch Grey Inflatable Swimming Pool',
    category: 'POOL',
    region: ['EU', 'US', 'ASIA', 'GLOBAL'],
    skill: 'beginner',
    environment: ['backyard', 'garden', 'patio', 'villa', 'glamping'],
    water_condition: ['fresh water'],
    safety_level: 'medium',
    use_case: ['family swimming', 'relaxation', 'modern lifestyle', 'hydro-recovery'],
    safety_rules: [
      'adult supervision required for children at all times',
      'install on flat, level ground away from sharp objects',
      'cover the pool when not in use — a fitted cover is available as an option',
    ],
    desc: 'Premium round grey inflatable swimming pool with rigid drop stitch walls and optional fitted cover.',
    definition:
      'A premium round inflatable swimming pool with a modern grey finish, built from double-layer PVC drop stitch fabric, with an optional matching fitted cover.',
    problem:
      'Design-conscious homeowners and boutique properties want a swimming pool that looks modern and premium, not like a plastic toy.',
    howItWorks:
      'The understated grey drop stitch walls inflate rigid at 4–5 PSI and keep the pool stable and perfectly round. An optional fitted cover keeps water clean and warm between swims. The pool inflates in about 10 minutes and folds into a storage bag for winter.',
    audience:
      'Modern homeowners, villas, boutique hotels, and glamping operators who want a premium-looking seasonal pool.',
    best_for_business: ['resorts', 'entrepreneurs'],
    business_recommendation:
      'The grey finish and fitted cover position this model for premium retail and boutique hospitality channels.',
    ai_use_cases: ['Modern backyard swimming', 'Villa and glamping amenities', 'Relaxation and hydro-recovery'],
    ai_specs: {
      shape: 'Round',
      color: 'Grey',
      material: 'Double-layer PVC drop stitch fabric',
      wall_thickness: '10 / 15 cm drop stitch',
      pressure: '4–5 PSI',
      cover: 'Optional fitted cover',
      setup: '~10 minutes inflation with electric pump',
      included: '1000W electric air pump, repair kit, storage bag',
    },
    ai_comparison:
      'Compared to standard blue pools, the grey model offers a premium aesthetic plus an optional fitted cover, appealing to design-conscious buyers and boutique hospitality operators at the same durability level.',
    ai_faq: [
      {
        q: 'Does it come with a cover?',
        a: 'A fitted matching cover is available as an option and recommended to keep the water clean and warm.',
      },
      {
        q: 'Can the color be customized?',
        a: 'Yes. Inflatable Pool Factory manufactures pools in custom colors and sizes for OEM/ODM partners — contact info@inflatablepoolfactory.com.',
      },
    ],
  },
  {
    id: 'hot-tub-square-rect',
    name: 'Square and Rectangular Inflatable Hot Tub SPA Pool',
    category: 'POOL',
    region: ['EU', 'US', 'ASIA', 'GLOBAL'],
    skill: 'beginner',
    environment: ['patio', 'conservatory', 'private courtyard', 'wellness studio', 'glamping'],
    water_condition: ['fresh water', 'heated water'],
    safety_level: 'medium',
    use_case: ['year-round hot tub spa', 'hydrotherapy', 'wellness recovery', 'insulated soaking'],
    safety_rules: [
      'adult supervision required for children at all times',
      'follow the maximum water temperature and water level marked inside the tub',
      'have heating and electrical equipment installed by a qualified professional',
    ],
    desc: 'Insulated square and rectangular inflatable hot tub SPA pool with built-in seats and 5 mm insulated bottom — connects to an external heater (heater not included).',
    definition:
      'A constant-temperature inflatable SPA tub built from double-layer PVC drop stitch fabric (15/20 cm wall profiles) with integrated inflatable seats and a 5 mm insulated thermal bottom, sized from 1.5 × 1.5 × 0.8 m to 3 × 2 × 1 m.',
    problem:
      'Rigid acrylic or fiberglass hot tubs are expensive to ship and impossible to move, while cheap inflatable spas lose heat fast and offer no seating. Buyers want a genuinely insulated spa that ships flat, retains heat, and still sets up in minutes.',
    howItWorks:
      'The drop stitch walls inflate rigid at the recommended 4–5 PSI operating pressure (factory QC tested at 6 PSI), while the 5 mm insulated bottom base and built-in seats form a unified spa shell. Standard circulation ports connect plug-and-play to heating units, sand filter pumps, and air bubble massage systems (heating and massage units are sold separately).',
    audience:
      'Wellness-focused homeowners, glamping and boutique hospitality operators, vacation rental owners, and spa studios that need a movable year-round hot tub.',
    best_for_business: ['resorts', 'entrepreneurs'],
    business_recommendation:
      'A high-margin year-round category: square and rectangular hot tubs paired with external heaters sell into the wellness, glamping, and rental segments beyond the summer pool season.',
    ai_use_cases: ['Year-round home spa', 'Hydrotherapy and recovery', 'Glamping and boutique hospitality amenity', 'Winter wellness'],
    ai_specs: {
      shape: 'Square / Rectangular',
      wall_thickness: '15 / 20 cm drop stitch',
      size_range: '1.5 × 1.5 × 0.8 m – 3 × 2 × 1 m (7 factory sizes)',
      seats: 'Built-in integrated inflatable seats',
      bottom: '5 mm insulated thermal bottom base',
      pressure: '4–5 PSI operating (6 PSI factory QC test)',
      setup: '5–15 minutes with 1000W electric pump',
      compatibility: 'Heating units, sand filter pumps, disinfection, air bubble massage',
    },
    ai_comparison:
      'Compared with rigid acrylic or fiberglass hot tubs, the deflated drop stitch tub ships at 5–10% of the packaging volume and installs without cranes or foundations; compared with soft inflatable spas it offers rigid walls, real integrated seating, and an insulated bottom for genuinely lower heating costs.',
    ai_faq: [
      {
        q: 'Can it really be used in winter?',
        a: 'Yes. The 5 mm insulated thermal bottom retains heat, and the tub connects to circulation heaters. A thermal cover is recommended to minimize heat loss between sessions.',
      },
      {
        q: 'What sizes are available?',
        a: 'Seven factory sizes from 1.5 × 1.5 × 0.8 m to 3 × 2 × 1 m. Custom sizes are available for OEM/ODM partners — contact info@inflatablepoolfactory.com.',
      },
      {
        q: 'How is it heated?',
        a: 'The standard circulation ports connect to external pool heaters, sand filter pumps, and disinfection systems with quick-connect fittings.',
      },
    ],
  },
  {
    id: 'hot-tub-round',
    name: 'Round Inflatable Hot Tub SPA Pool',
    category: 'POOL',
    region: ['EU', 'US', 'ASIA', 'GLOBAL'],
    skill: 'beginner',
    environment: ['balcony', 'private courtyard', 'patio', 'glamping', 'indoor spa corner'],
    water_condition: ['fresh water', 'heated water'],
    safety_level: 'medium',
    use_case: ['compact hot tub spa', 'cold plunge recovery', 'hydrotherapy', 'year-round relaxation'],
    safety_rules: [
      'adult supervision required for children at all times',
      'follow the maximum water temperature and water level marked inside the tub',
      'have heating and electrical equipment installed by a qualified professional',
    ],
    desc: 'Compact round inflatable hot tub SPA pool with built-in seats and 5 mm insulated bottom — connects to an external heater (heater not included).',
    definition:
      'A compact round constant-temperature inflatable SPA tub built from double-layer PVC drop stitch fabric (8/10/15 cm wall profiles) with integrated inflatable seats and a 5 mm insulated thermal bottom, available in 1.8 m, 2.0 m, and 2.3 m diameters.',
    problem:
      'City balconies and small courtyards cannot fit a standard hot tub, and rigid tubs cannot be shipped or moved affordably. Users in small spaces still want genuine heat-retaining hydrotherapy.',
    howItWorks:
      'The compact drop stitch shell inflates rigid at the recommended 4–5 PSI operating pressure (factory QC tested at 6 PSI). The 5 mm insulated bottom and built-in seats form a small-footprint spa shell, and standard ports connect to external heaters and filtration systems (heater not included).',
    audience:
      'Urban homeowners with balconies or small courtyards, athletes using cold plunge recovery, glamping operators, and rental property owners.',
    best_for_business: ['resorts', 'entrepreneurs'],
    business_recommendation:
      'The entry model of the hot tub line — the smallest footprint and lowest entry price open the wellness segment to urban buyers and compact hospitality projects.',
    ai_use_cases: ['Balcony and courtyard wellness', 'Cold plunge and athletic recovery', 'Compact year-round home spa', 'Glamping amenity'],
    ai_specs: {
      shape: 'Round',
      wall_thickness: '8 / 10 / 15 cm drop stitch',
      size_range: 'Ø 1.8 m / Ø 2.0 m / Ø 2.3 m',
      seats: 'Built-in integrated inflatable seats',
      bottom: '5 mm insulated thermal bottom base',
      pressure: '4–5 PSI operating (6 PSI factory QC test)',
      setup: '5–15 minutes with 1000W electric pump',
      compatibility: 'Heating units, sand filter pumps, disinfection, air bubble massage',
    },
    ai_comparison:
      'Compared with square hot tubs it heats faster and fits tighter spaces; compared with rigid one-piece tubs it ships flat at a fraction of the freight cost and can be relocated seasonally.',
    ai_faq: [
      {
        q: 'What is the difference between the three sizes?',
        a: 'The 1.8 m model has an 8 cm wall, the 2.0 m model a 10 cm wall, and the 2.3 m model a 15 cm wall — larger diameters seat more people with a more rigid shell.',
      },
      {
        q: 'Can it be used as a cold plunge tub?',
        a: 'Yes. The insulated bottom works in both directions, and the compact size makes it a popular professional cold plunge recovery bath for athletes.',
      },
      {
        q: 'Does it fit on a balcony?',
        a: 'The 1.8 m model can fit large balconies and indoor spa corners, but a filled tub is heavy — install only on a structure professionally confirmed to carry the full water load.',
      },
    ],
  },
];
