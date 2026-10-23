export interface GuideRecord {
  slug: string;
  category: string;
  title: string;
  description: string;
  tldr: string;
  problem: string;
  solution: string;
  audience: string;
  steps: string[];
  faq: { q: string; a: string }[];
  relatedProducts: string[];
  relatedGuides: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  waterType: string[];
}

export const guides: GuideRecord[] = [
  {
    slug: 'how-to-choose-inflatable-pool',
    category: 'buying-guide',
    title: 'How to Choose an Inflatable Swimming Pool',
    description:
      'A complete guide to selecting the right drop stitch inflatable pool based on your yard size, family needs, and budget.',
    tldr: 'Choose your pool based on yard space, number of users, and intended use. Round pools suit families and relaxation; rectangular pools fit lap swimming. Drop stitch construction gives rigid walls that fold away for winter storage.',
    problem:
      'Many buyers pick a pool based on price alone, then discover it is too small, too hard to maintain, or made from flimsy material that sags under water pressure.',
    solution:
      'Match pool size and shape to your available space and use case, and insist on drop stitch construction with UV-resistant PVC. A quality inflatable pool sets up in under 30 minutes and lasts many seasons.',
    audience: 'Families, homeowners, and first-time pool buyers.',
    steps: [
      'Measure your available ground area — allow 1 meter of clearance around the pool',
      'Choose a shape: round for family fun, rectangular for swimming laps',
      'Check the wall height: taller walls hold more water and suit adults',
      'Verify drop stitch construction for rigid, self-supporting walls',
      'Confirm what is included: pump, repair kit, cover, ground sheet',
      'Plan water care: filter pump, chemicals, and a test kit',
    ],
    faq: [
      {
        q: 'How big should a family pool be?',
        a: 'For a family of four, a round pool of 3–4 meters in diameter or a rectangular pool of 4 x 2 meters is comfortable. Larger groups should size up accordingly.',
      },
      {
        q: 'Are inflatable pools durable?',
        a: 'Yes. Drop stitch pools with multi-layer PVC hold their shape under full water pressure and resist punctures and UV damage. With basic care they provide seasons of reliable use — how many depends on climate, usage, and storage conditions.',
      },
    ],
    relatedProducts: [],
    relatedGuides: ['inflatable-pool-maintenance'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'inflatable-pool-setup',
    category: 'tutorial',
    title: 'Inflatable Pool Setup in 8 Steps',
    description: 'Everything you need to know to set up your Inflatable Pool Factory inflatable pool correctly the first time.',
    tldr: 'Pick level ground, clear it of debris, lay a ground sheet, inflate the walls to rated pressure, and fill. Total setup time is 15–30 minutes plus filling time.',
    problem:
      'Rushed setup on poor ground causes sagging walls, uneven water line, leaks from sharp objects, and a pool that never sits right.',
    solution:
      'Follow the full checklist: level ground, debris-free surface, ground sheet, even inflation, and a water fill that stops at the recommended line.',
    audience: 'New Inflatable Pool Factory pool owners.',
    steps: [
      'Choose a firm, level spot away from overhanging trees',
      'Remove all stones, sticks, and sharp objects from the area',
      'Lay the included or separate ground sheet',
      'Unroll the pool and position it — you cannot move it once filled',
      'Inflate the walls with the supplied pump to the rated PSI',
      'Check all valves are closed and secure',
      'Fill with water to the recommended fill line (usually 80–90%)',
      'Connect the filter pump if included and run it for an initial cycle',
    ],
    faq: [
      {
        q: 'Can I set up a pool on grass?',
        a: 'Yes, level grass works well. Mow it short, remove clippings and debris, and use a ground sheet underneath to protect the pool base.',
      },
      {
        q: 'How full should I fill the pool?',
        a: 'Fill to 80–90% of wall height. Overfilling stresses the walls; underfilling reduces stability and usable depth.',
      },
    ],
    relatedProducts: [],
    relatedGuides: ['inflatable-pool-maintenance'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'inflatable-pool-maintenance',
    category: 'maintenance',
    title: 'Inflatable Pool Water Care and Maintenance',
    description: 'How to keep your pool water clean, clear, and safe all season with minimal effort.',
    tldr: 'Run the filter daily, keep chlorine and pH in range, skim debris, and cover the pool when idle. Drain, dry, and fold for winter storage.',
    problem:
      'Without a care routine, pool water turns green within days, requiring full water changes, extra chemicals, and scrubbing.',
    solution:
      'A simple daily and weekly routine — filter, test, treat, skim, cover — keeps water healthy for weeks and extends the life of your pool.',
    audience: 'All inflatable pool owners.',
    steps: [
      'Run the filter pump 4–8 hours daily during the season',
      'Test pH and chlorine 2–3 times per week',
      'Keep pH between 7.2 and 7.6 and chlorine at 1–3 ppm',
      'Use a floating chemical dispenser for steady dosing',
      'Skim leaves and insects daily; vacuum sediment weekly',
      'Cover the pool when not in use to block debris and UV loss',
      'At season end: drain, clean, dry fully, deflate, fold, and store indoors',
    ],
    faq: [
      {
        q: 'How often should I change the water?',
        a: 'With proper filtration and chemical care, water can last 3–6 weeks. Change sooner if it turns cloudy or green despite treatment.',
      },
      {
        q: 'Can I use saltwater systems?',
        a: 'Small inflatable pools typically use chlorine tablets. Salt systems are possible with compatible equipment, but confirm compatibility before adding salt.',
      },
    ],
    relatedProducts: [],
    relatedGuides: ['inflatable-pool-setup'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'what-is-a-drop-stitch-inflatable-pool',
    category: 'buying-guide',
    title: 'What Is a Drop Stitch Inflatable Pool?',
    description:
      'A plain-English explanation of drop stitch construction — how thousands of internal threads make an inflatable pool wall rigid enough to swim against.',
    tldr: 'Drop stitch fabric joins two outer PVC layers with thousands of internal threads. Inflated to 4–5 PSI, those threads lock the walls flat and rigid — closer to a hard-sided pool than a toy ring pool — yet the pool still deflates and folds for storage.',
    problem:
      'Most people have only seen ring-style or soft-sided inflatable pools that sag, bulge, and collapse. That experience makes it hard to believe an inflatable pool can hold a firm, straight wall at 1.5 meters of water depth.',
    solution:
      'Drop stitch construction is the same technology used in high-pressure inflatable stand-up paddleboards. The threads limit how far the walls can expand, so pressure turns the fabric into a stiff panel instead of a balloon. Inflatable Pool Factory pools operate at 4–5 PSI with a pressure-relief valve that releases above 6 PSI; production units are pressure and leak tested against the approved model specification before shipment.',
    audience: 'First-time buyers comparing pool types.',
    steps: [
      'Outer layers: two sheets of reinforced, UV-stabilized PVC form the wall surfaces',
      'Internal threads: thousands of fine polyester threads connect the layers at fixed intervals',
      'Air chamber: inflating the chamber to 4–5 PSI pulls the layers taut against the threads, locking the wall flat',
      'Rigid result: the wall becomes stiff enough to lean on or sit on, like a hard-sided pool',
      'Safety margin: rated maximum pressure is 8 PSI, with a relief valve that auto-releases above 6 PSI',
      'Storage: open the valves, let the fabric relax, and the whole pool folds into a storage bag',
    ],
    faq: [
      {
        q: 'Is a drop stitch pool really rigid?',
        a: 'Yes. At the rated 4–5 PSI operating pressure the walls form a flat, firm surface that resists collapsing or inward buckling — users can lean against or sit on the pool rim.',
      },
      {
        q: 'Does drop stitch make the pool heavier?',
        a: 'It adds some weight versus ring pools, but packed weights start around 18 kg for the smallest round model and the pool still folds into a storage bag one person can move.',
      },
      {
        q: 'What happens if I over-inflate?',
        a: 'The pressure-relief valve automatically releases air above 6 PSI, well below the 8 PSI maximum tolerance, to protect the seams.',
      },
    ],
    relatedProducts: [
      'rectangular-drop-stitch-pool',
      'round-blue-drop-stitch-pool',
      'round-grey-drop-stitch-pool',
      'hot-tub-square-rect',
      'hot-tub-round',
    ],
    relatedGuides: ['drop-stitch-vs-traditional-inflatable-pools', 'inflatable-pool-setup'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'drop-stitch-vs-traditional-inflatable-pools',
    category: 'buying-guide',
    title: 'Drop Stitch Pools vs. Traditional Inflatable Pools',
    description:
      'The practical differences between drop stitch pools and ring-style or soft-sided inflatable pools — walls, depth, durability, setup, and storage.',
    tldr: 'Traditional inflatable pools have balloon-like walls that bulge under water pressure and limit depth. Drop stitch pools hold flat, rigid walls at real swimming depths, support proper pressure relief, and still deflate for winter storage. Neither type needs tools or construction.',
    problem:
      'Ring pools and soft-sided pools are cheap up front but often end in sagging walls, leaking seams, and one disappointing season. Buyers then assume every inflatable pool behaves the same way.',
    solution:
      'Compare the construction, not the category. Drop stitch walls inflate to 4–5 PSI and behave like hard panels; traditional inflatables operate at low pressure and depend on water pressure to hold their shape. That difference drives depth, wall stability, durability, and how the pool feels in daily use.',
    audience: 'Buyers deciding between pool types and price points.',
    steps: [
      'Wall construction: drop stitch = two PVC layers joined by internal threads; traditional = air-filled vinyl rings or unsupported soft walls',
      'Operating pressure: drop stitch runs at 4–5 PSI with a relief valve; ring pools run at low pressure with no meaningful pressure rating',
      'Wall behavior: drop stitch walls stay flat and rigid; ring walls bulge outward as water pushes on them',
      'Achievable depth: drop stitch supports 1.2–1.5 m walls for real swimming; ring pools rarely exceed 0.7–0.8 m reliably',
      'Rim usability: drop stitch rims are firm enough to sit on; ring rims deform under weight',
      'Durability: reinforced multi-layer PVC resists punctures and UV; thin single-layer vinyl is easier to puncture',
      'Storage: both types deflate — drop stitch packs into a storage bag after a full-season run',
    ],
    faq: [
      {
        q: 'Are drop stitch pools more expensive?',
        a: 'Yes, generally. The internal thread structure and reinforced materials cost more than thin vinyl. In return you get usable depth, rigid walls, and multi-season durability.',
      },
      {
        q: 'Is setup harder than a ring pool?',
        a: 'No. Setup is comparable — level ground, unroll, inflate with the included electric pump, fill. Expect 15–30 minutes plus fill time.',
      },
      {
        q: 'Which type is safer for kids?',
        a: 'Both require the same rule: active adult supervision at all times. Rigid drop stitch walls make entry and exit more predictable, but no inflatable pool is a substitute for supervision.',
      },
    ],
    relatedProducts: [
      'rectangular-drop-stitch-pool',
      'round-blue-drop-stitch-pool',
      'round-grey-drop-stitch-pool',
      'hot-tub-square-rect',
      'hot-tub-round',
    ],
    relatedGuides: ['what-is-a-drop-stitch-inflatable-pool', 'how-to-choose-inflatable-pool'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'how-much-space-do-you-need-for-an-inflatable-pool',
    category: 'buying-guide',
    title: 'How Much Space Do You Need for an Inflatable Pool?',
    description:
      'Footprints, clearances, and load factors for Inflatable Pool Factory pool sizes — how to measure your space before choosing a pool.',
    tldr: 'Plan for the pool footprint plus at least 50 cm of clear, non-slip walkway on all sides, and confirm the surface can carry the water: roughly 1 tonne per cubic meter. Inflatable Pool Factory round pools span 2–10 m diameter and rectangular pools start at 2 × 2 m.',
    problem:
      'Buyers often measure only the pool diameter, then discover there is no room to walk around it, no safe entry point, and no drainage route — or worse, the surface cannot carry the filled weight.',
    solution:
      'Measure the usable area, subtract clearance, check the load, and pick the largest pool that fits with margin. A pool that fits properly is safer, easier to maintain, and more pleasant to use than the biggest pool you can squeeze in.',
    audience: 'Anyone planning a first pool in a yard, patio, or garden.',
    steps: [
      'Measure the usable area in both directions — a tape outline on the ground beats estimating',
      'Subtract 50 cm clearance per side for walkways, a ladder, and safe entry/exit',
      'Estimate the water load: length × width × intended water depth gives cubic meters; water weighs about 1 tonne per cubic meter',
      'Example: a 4 m round pool filled to 1.0 m holds roughly 12 m³ of water — around 12 tonnes',
      'Confirm the surface is level; a slope causes uneven water line and wall stress',
      'Plan the fill source and, critically, a drainage route for the drain valve',
      'Match the size to your space: Ø 2–3 m fits small patios; Ø 4–5 m suits typical gardens; 6 m and up needs open lawn',
    ],
    faq: [
      {
        q: 'How close can a pool be to a fence or wall?',
        a: 'Keep at least 50 cm so you can walk around, clean, and inspect the walls. Local barrier rules may also require pool-to-fence distances — check before you buy.',
      },
      {
        q: 'Can I put a pool on a balcony or roof terrace?',
        a: 'Only after a structural load check by a qualified engineer. A filled pool concentrates several tonnes in a small area — most balconies are not designed for that.',
      },
      {
        q: 'Does a bigger pool need more chemicals and filtration?',
        a: 'Yes. Water volume drives chemical demand, filter run time, and fill/drain time. Sizing the pool to your real usage keeps maintenance manageable.',
      },
    ],
    relatedProducts: [
      'rectangular-drop-stitch-pool',
      'round-blue-drop-stitch-pool',
      'round-grey-drop-stitch-pool',
      'hot-tub-square-rect',
      'hot-tub-round',
    ],
    relatedGuides: ['how-to-choose-inflatable-pool', 'placing-an-inflatable-pool-on-a-patio'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'placing-an-inflatable-pool-on-a-patio',
    category: 'buying-guide',
    title: 'What to Know Before Placing a Pool on a Patio or Deck',
    description:
      'Load capacity, surface prep, drainage, and protection for above-ground pools on patios, decks, and terraces.',
    tldr: 'A patio can host an inflatable pool only if the structure carries the filled weight — about 1 tonne per cubic meter of water — and drains safely. Get a structural assessment for anything beyond a small, shallow pool, protect the surface, and plan where the water goes.',
    problem:
      'Patios and decks look flat and solid, so they feel like obvious pool sites. But filled pools concentrate tonnes of water in a small footprint, and decks, pavers, and membranes are rarely designed for that concentrated load.',
    solution:
      'Treat load as the first question, not an afterthought. Confirm capacity with a qualified structural engineer for anything beyond the smallest pools, verify drainage, protect the surface finish, and keep water away from the structure.',
    audience: 'Homeowners with patios, decks, or roof terraces.',
    steps: [
      'Calculate the filled weight: length × width × water depth in meters ≈ weight in tonnes',
      'Ask a qualified engineer to verify the structure for that concentrated load — do not rely on "it feels solid"',
      'Prefer ground-floor concrete patios over elevated decks; avoid balconies unless cleared by an engineer',
      'Check that the surface is level and that pavers or boards will not shift or sink unevenly',
      'Use a ground sheet or protective mat to shield both the pool base and the patio finish',
      'Plan drainage: the drain valve releases hundreds of liters — direct it away from foundations, neighbors, and slip hazards',
      'Keep the pool away from overhead power lines and ensure the pump connection stays dry and protected',
    ],
    faq: [
      {
        q: 'Can a wooden deck support an inflatable pool?',
        a: 'Only if an engineer verifies it. Even a small 2 m pool filled to 0.5 m holds about 1.5 tonnes. Most residential decks are rated for people and furniture, not point loads of that size.',
      },
      {
        q: 'Will a pool damage my patio surface?',
        a: 'Constant moisture, chemical splash, and abrasion can wear some finishes. A ground sheet or protective mat between pool and surface reduces risk; check your patio material and warranty.',
      },
      {
        q: 'What is the safest patio pool setup?',
        a: 'Ground-level concrete, level and crack-free, with a ground sheet, non-slip access, a covered pump connection, and a drainage route planned before filling.',
      },
    ],
    relatedProducts: ['round-blue-drop-stitch-pool', 'round-grey-drop-stitch-pool', 'hot-tub-square-rect'],
    relatedGuides: ['how-much-space-do-you-need-for-an-inflatable-pool', 'inflatable-pool-setup'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
  {
    slug: 'inflatable-pools-for-vacation-rentals',
    category: 'buying-guide',
    title: 'Are Inflatable Pools Suitable for Vacation Rentals?',
    description:
      'What rental hosts should check before adding a drop stitch pool or SPA tub — guests, regulations, insurance, maintenance, and safety.',
    tldr: 'Yes, for many properties — with conditions. A drop stitch pool installs in under an hour and stores off-season, but as a host you must handle guest supervision rules, local pool regulations, insurance disclosure, and daily water care. A family pool used by unsupervised rental guests is a liability, not an amenity.',
    problem:
      'A pool boosts bookings, so hosts buy one, list it, and only then meet the hard questions: barrier rules for rental properties, insurance wording, water quality between turnovers, and what happens when guests ignore supervision rules.',
    solution:
      'Decide with the checklist first. Confirm local regulations for pools at short-term rentals, disclose the pool to your insurer, size it to the property, budget maintenance time between stays, and write supervision rules into your listing and house manual. Inflatable Pool Factory pools suit this use because they set up fast, drain for the off-season, and need no construction.',
    audience: 'Vacation rental hosts and property managers.',
    steps: [
      'Check local regulations — barrier and safety rules for rental properties often apply to any pool, inflatable included',
      'Disclose the pool to your insurer and confirm your liability coverage wording',
      'Choose the size for the property: Ø 4–5 m round or 4 × 3 m rectangular works for most 4–8 guest homes',
      'Budget real maintenance: filtration run time, water testing between stays, and a cleaning window at each turnover',
      'Write explicit guest rules into the listing and house manual: adult supervision required, no unattended children, pool hours',
      'Plan the season: pools can be drained, dried, and stored in the off-season — plan where and how',
      'Inspect between stays: valve seals, wall pressure, ladder stability, and water quality',
    ],
    faq: [
      {
        q: 'Do inflatable pools need fencing at rentals?',
        a: 'In many jurisdictions, yes — pool barrier requirements typically apply regardless of pool type. Check your local code before installing; this is the host\u2019s responsibility.',
      },
      {
        q: 'How much maintenance does a rental pool need?',
        a: 'Daily filter runs, water testing between guest stays, and a cleaning window at each turnover. Salt or heavy-chemistry solutions need equipment confirmation first.',
      },
      {
        q: 'Is a family pool enough for paying guests?',
        a: 'For seasonal, low-frequency use it can work. For high-turnover properties, evaluate commercial-grade options and heavier-duty specifications before committing — see our business solutions page.',
      },
    ],
    relatedProducts: ['rectangular-drop-stitch-pool', 'round-blue-drop-stitch-pool', 'round-grey-drop-stitch-pool'],
    relatedGuides: ['inflatable-pool-maintenance', 'how-to-choose-inflatable-pool'],
    difficulty: 'beginner',
    waterType: ['freshwater'],
  },
];
