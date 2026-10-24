/**
 * Pool Ideas scenario content — consumer-first use-case pages.
 * Each scenario answers a real buyer need, lists suitable conditions,
 * matches Inflatable Pool Factory product families, and embeds a real size table
 * sourced from the pool catalog (no invented specs).
 */

export interface PoolIdeaMatch {
  /** Series id from pool-catalog.ts */
  series: 'round' | 'rect-square' | 'hot-tub-square-rect' | 'hot-tub-round';
  /** Why this family fits the scenario */
  reason: string;
}

export interface PoolIdea {
  slug: string;
  navTitle: string;
  /** Eyebrow / category label */
  eyebrow: string;
  title: string;
  /** Scenario photo path under public/images (optional) */
  image?: string;
  /** Alt text for the scenario photo */
  imageAlt?: string;
  intro: string[];
  /** Suitable-conditions checklist */
  conditions: string[];
  matches: PoolIdeaMatch[];
  /** Optional inline note shown between matches and the size table */
  tableNote?: string;
  safety: string[];
  /** Closing CTA line */
  cta: string;
  /** Related guide slugs from src/data/guides.ts */
  relatedGuides?: string[];
}

export const POOL_IDEAS: PoolIdea[] = [
  {
    slug: 'backyard-pools-for-families',
    navTitle: 'Backyard Pools for Families',
    eyebrow: 'Pool Ideas',
    title: 'Backyard Pools for Families',
    intro: [
      'A family pool has to survive summer holidays, birthday parties, and daily after-school splashing — while still being safe for mixed ages and easy for parents to manage. Inflatable Pool Factory drop-stitch pools give you rigid, full-size swimming at a fraction of the cost and commitment of a built-in pool.',
      'Unlike soft-sided toy pools, the high-pressure drop-stitch walls inflate rock-solid at 4–5 PSI, so the pool holds its shape through the season. When summer ends, it drains, folds, and stores in a storage bag.',
    ],
    conditions: [
      'A flat, load-bearing surface of about 3 × 3 m or larger (lawn, patio, or deck rated for the water weight)',
      'Backyards where a permanent pool is impossible, not allowed, or too expensive',
      'Families who want a real swimming depth (up to 1.5 m) without construction',
      'Parents who can supervise actively whenever the pool is in use — inflatable pools require the same supervision as any pool',
    ],
    matches: [
      {
        series: 'round',
        reason: 'The classic family choice — no corners, simple setup, and the largest size menu (2–10 m diameter) so the pool grows with your kids.',
      },
      {
        series: 'rect-square',
        reason: 'A rectangular layout is better for swimming lengths, pool games, and fitting along a fence or patio edge.',
      },
    ],
    tableNote:
      'Popular family sizes sit between 3 m and 5 m round, or 3 × 2 m rectangular — big enough to swim and play, small enough to heat and fill.',
    safety: [
      'Active adult supervision is required at all times when children are in or near the pool.',
      'Empty or securely cover the pool when not in use; never leave standing water unattended around small children.',
      'Check local fencing/barrier regulations — many jurisdictions require pool barriers regardless of pool type.',
      'Inflate to the rated 4–5 PSI operating pressure so walls stay rigid; the pressure-relief valve guards against over-inflation.',
    ],
    cta: 'Ready to pick a size? Compare every model in the shop.',
    relatedGuides: ["how-to-choose-inflatable-pool","inflatable-pool-setup"],
  },
  {
    slug: 'pools-for-small-backyards',
    navTitle: 'Pools for Small Backyards',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Small Backyards',
    intro: [
      'You do not need a big garden to have a real pool. Inflatable Pool Factory pools start at 2 m round and 2 × 2 m rectangular — footprints that fit a small patio, a side yard, or the corner of a townhouse garden — and they pack away completely in the off-season, returning your space when you need it.',
      'Because the walls are rigid drop-stitch instead of sagging vinyl, even the smallest sizes feel like proper pools: straight sides, stable rim, real water depth.',
    ],
    conditions: [
      'Free space from about 2 × 2 m upward, on a surface that can carry the water weight (a 2 m pool holds roughly 1.5 m³ of water — about 1.5 t)',
      'Renters and homeowners who cannot excavate or build',
      'Balconies and roof terraces only after a structural load check by a qualified engineer',
      'Households that want the space back in winter for dining, play, or storage',
    ],
    matches: [
      {
        series: 'round',
        reason: 'The Ø 2 × 0.5 m (S2005) and Ø 3 × 1.2 m (S3012) rounds are the smallest true swimmers in the range — low water volume, fast filling, easy storage.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'From 1.5 × 1.5 m, a square SPA tub turns a tiny courtyard into a soaking spot with built-in seats.',
      },
      {
        series: 'hot-tub-round',
        reason: 'Ø 1.8–2.3 m round SPA tubs fit where nothing else does and seat the whole household.',
      },
    ],
    tableNote:
      'Small-space favorites: Ø 2 × 0.5 m round for splash play with young kids; Ø 3 × 1.2 m round or a square SPA tub for adults to actually swim or soak.',
    safety: [
      'Verify the floor or deck load rating before filling — water weighs about 1 t per m³.',
      'Keep a clear, non-slip path around the pool for safe entry and exit.',
      'Active supervision is required whenever children are near the water.',
      'Use the included drain valve to empty the pool quickly when the season or weather demands it.',
    ],
    cta: 'See the exact footprints and prices in the shop.',
    relatedGuides: ["how-much-space-do-you-need-for-an-inflatable-pool","placing-an-inflatable-pool-on-a-patio"],
  },
  {
    slug: 'large-pools-for-family-gatherings',
    navTitle: 'Large Pools for Family Gatherings',
    eyebrow: 'Pool Ideas',
    title: 'Large Pools for Family Gatherings',
    image: '/images/pool-ideas/large-pools-for-family-gatherings.webp',
    imageAlt:
      'A family of five relaxing in a large round Inflatable Pool Factory drop-stitch pool on a wooden deck during a summer BBQ gathering.',
    intro: [
      'Reunions, block parties, long summer weekends — when the whole family shows up, a small splash pool is not enough. Inflatable Pool Factory\u2019s largest drop-stitch pools reach 10 m round and 6 × 5 m rectangular, with rigid walls up to 1.5 m of real swimming depth and firm, straight sides.',
      'Despite the size, setup stays measured in minutes-to-an-hour with a 1000W electric pump — no crane, no excavation, no permits for permanent structures in most areas (always confirm local rules).',
    ],
    conditions: [
      'Open lawn or hardstanding from roughly 5 × 5 m to 11 × 11 m',
      'Ground that has been checked for level and load — a 6 m round pool at 1.2 m depth holds around 30 m³ of water (≈ 30 t)',
      'Access to a water source with practical fill time and a safe drainage route for emptying',
      'An adult designated to supervise the pool zone during gatherings, exactly as with any pool party',
    ],
    matches: [
      {
        series: 'round',
        reason: 'Rounds up to Ø 10 m give the most swim area per square meter with no corners to manage — the natural centerpiece for a gathering.',
      },
      {
        series: 'rect-square',
        reason: 'The 6 × 5 × 1.5 m rectangular flagship is built for lap swimming, volleyball, and crowds of kids at once.',
      },
    ],
    tableNote:
      'Hosting 6–10 swimmers comfortably usually means Ø 5 m round or larger, or the biggest rectangular model — see the size ladder below.',
    safety: [
      'Assign a sober, undistracted adult as pool watcher whenever the pool is in use — crowded pool parties are the highest-risk scenario.',
      'Establish and enforce a single entry/exit point; add the optional ladder or inflatable stairs for safe climbing.',
      'Brief visiting children on pool rules before their first swim; non-swimmers stay in shallow zones with active supervision.',
      'Empty the pool or block access after the event if it will be unattended.',
    ],
    cta: 'Compare the large-size options and pick your gathering pool.',
    relatedGuides: ["how-much-space-do-you-need-for-an-inflatable-pool","how-to-choose-inflatable-pool"],
  },
  {
    slug: 'outdoor-soaking-pools',
    navTitle: 'Outdoor Soaking & Relaxation',
    eyebrow: 'Pool Ideas',
    title: 'Outdoor Soaking & Relaxation',
    intro: [
      'Not every backyard moment is about swimming. Sometimes the goal is hot water, built-in seats, and the sky above you. Inflatable Pool Factory constant-temperature SPA tubs bring that experience to patios, gardens, and terraces in square, rectangular, and round layouts from 1.5 m up.',
      'The tubs share the same drop-stitch construction as our pools — rigid walls, 4–5 PSI operating pressure — plus insulated designs with seats, so they hold temperature efficiently and stay in place through four-season use in mild climates.',
    ],
    conditions: [
      'A compact footprint from about 1.5 × 1.5 m on a level, load-capable surface',
      'Access to power for the heater system (confirm the heater specification for the model you choose)',
      'Users who want seated soaking and hydrotherapy-style relaxation rather than laps',
      'A drainage route for regular water changes',
    ],
    matches: [
      {
        series: 'hot-tub-round',
        reason: 'Ø 1.8 / 2.0 / 2.3 m round SPA tubs with built-in seats — the classic soaking circle for 2–6 people.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'Square and rectangular tubs from 1.5 × 1.5 m to 3 × 2 m fit against walls and into corners without wasting a centimeter.',
      },
    ],
    tableNote: 'All SPA sizes below are constant-temperature designs with integrated seating.',
    safety: [
      'Follow the heater manufacturer\u2019s water-temperature guidance; hot water is unsuitable for small children, pregnancy, and certain medical conditions — consult a doctor if unsure.',
      'Never soak alone under the influence of alcohol or medication that causes drowsiness.',
      'Keep electrical connections to the heater and pump protected and away from the water edge, per the product manual.',
      'Enter and exit slowly using the built-in seats as steps; wet surfaces are slippery.',
    ],
    cta: 'Explore the SPA tubs and find your soaking size.',
    relatedGuides: ["inflatable-pool-maintenance","what-is-a-drop-stitch-inflatable-pool"],
  },
  {
    slug: 'pools-for-vacation-rentals',
    navTitle: 'Pools for Vacation Rentals',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Vacation Rentals',
    image: '/images/pool-ideas/pools-for-vacation-rentals.webp',
    imageAlt:
      'A family of three enjoying a round Inflatable Pool Factory inflatable pool on the rooftop terrace of a city vacation rental.',
    intro: [
      'A pool is one of the strongest booking magnets a vacation rental can add — and one of the hardest. Inflatable Pool Factory drop-stitch pools were made for this gap: a genuine swimming pool that installs in under an hour, drains at the end of the season, and needs no construction, cranes, or permanent insurance reclassification in most markets (verify with your insurer and local authority).',
      'Rigid 4–5 PSI walls and reinforced seams stand up to guest traffic, and the pressure-relief valve keeps over-enthusiastic inflation from doing damage.',
    ],
    conditions: [
      'Rental properties with 3 × 3 m of usable outdoor space or more',
      'Owners who want a pool amenity without permanent construction or year-round maintenance',
      'Seasonal rentals where the pool can be drained, dried, and stored in the off-season',
      'Clear guest rules: adult supervision required, pool hours, and no unattended children — reflect this in your listing and house manual',
    ],
    matches: [
      {
        series: 'round',
        reason: 'Rounds are guest-proof: no corners, simplest cleaning, and sizes from splash-friendly to genuinely swimmable.',
      },
      {
        series: 'rect-square',
        reason: 'Rectangular models photograph beautifully for listings and give guests a defined swimming lane.',
      },
    ],
    tableNote:
      'For 4–8 guests, Ø 4–5 m round or 4 × 3 m rectangular is the sweet spot — impressive in photos, manageable to maintain.',
    safety: [
      'State supervision requirements prominently in the listing and inside the property.',
      'Provide the pool rules in writing and confirm guests acknowledge them at check-in.',
      'Check local short-term-rental pool regulations — barrier requirements typically apply to any pool, inflatable or not.',
      'Inspect the pool between stays: valve seals, wall pressure, and drain function.',
    ],
    cta: 'Equip your rental — see the models and sizes.',
    relatedGuides: ["inflatable-pools-for-vacation-rentals","inflatable-pool-maintenance"],
  },
  {
    slug: 'pools-for-glamping-and-hospitality',
    navTitle: 'Pools for Glamping & Hospitality',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Glamping & Hospitality',
    image: '/images/pool-ideas/pools-for-glamping-and-hospitality.webp',
    imageAlt:
      'A round Inflatable Pool Factory inflatable pool set on the wooden deck of a mountain glamping dome surrounded by pine forest.',
    intro: [
      'Glamping sites, boutique cabins, and countryside hotels compete on experience. A drop-stitch pool or SPA tub delivers a premium amenity that moves with your business: set it up for the season on a deck or level ground, then store it when the weather turns — no planning permission for permanent structures in many jurisdictions (always confirm locally).',
      'For operators, the same product line is available in commercial configurations: custom sizes, branded colors, and OEM/ODM production through our Qingdao manufacturing base.',
    ],
    conditions: [
      'Level ground or a purpose-built deck rated for full water weight',
      'Sites that operate seasonally and need the amenity to disappear in the off-season',
      'Hospitality teams able to manage water treatment, daily checks, and guest supervision rules',
      'Operators planning multiple units — volume pricing and private-label options apply (see For Businesses)',
    ],
    matches: [
      {
        series: 'hot-tub-round',
        reason: 'A woodside soaking tub is the signature glamping moment — Ø 1.8–2.3 m fits almost any cabin deck.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'Square tubs tuck against cabin walls and seat guests in a compact footprint.',
      },
      {
        series: 'round',
        reason: 'For sites that want a swim amenity, rounds up to Ø 10 m create a destination feature.',
      },
    ],
    tableNote:
      'Most glamping operators start with one or two SPA tubs per cabin cluster, then add a large round pool as the shared centerpiece.',
    safety: [
      'Post pool and tub rules at the amenity and in guest welcome materials; supervision requirements must be explicit.',
      'Assign trained staff to daily water-quality and equipment checks during the season.',
      'Follow commercial water-treatment guidance applicable to your region for shared guest pools.',
      'Secure or drain amenities outside supervised hours.',
    ],
    cta: 'Outfit your site — browse the shop, or talk to our business team for volume pricing.',
    relatedGuides: ["inflatable-pools-for-vacation-rentals","what-is-a-drop-stitch-inflatable-pool"],
  },
  {
    slug: 'pools-for-dink-households',
    navTitle: 'Pools for DINK Households',
    eyebrow: 'Pool Ideas',
    title: 'Pools for DINK Households',
    image: '/images/pool-ideas/pools-for-dink-households.webp',
    imageAlt:
      'A DINK couple soaking in a compact round Inflatable Pool Factory pool on a modern minimalist balcony with potted plants.',
    intro: [
      'For double-income, no-kids households, the backyard is a private retreat — a place for morning coffee, an after-work cool-down, and weekend cocktails under the stars. An Inflatable Pool Factory soaking pool delivers that ritual without construction: rigid drop-stitch walls that look architectural rather than toy-like, and a footprint sized for a patio or courtyard.',
      'Low water volume keeps filling, heating, and chemical care light, and when a travel week or the off-season arrives, the pool deflates into a storage footprint that fits a garage shelf.',
    ],
    conditions: [
      'A level spot from about 1.8 × 1.8 m on a patio, deck, or courtyard rated for the water weight',
      'Renters and homeowners who cannot or do not want to build a permanent pool',
      'Households that prefer compact soaking over lap swimming',
      'A drainage route for regular water changes',
    ],
    matches: [
      {
        series: 'hot-tub-square-rect',
        reason:
          'The 2.1 × 1.6 × 0.8 m tub (SS211608) is a two-person soak with built-in seats — a natural weekend retreat for two.',
      },
      {
        series: 'hot-tub-round',
        reason:
          'Ø 1.8–2.3 m round SPA tubs seat two comfortably, with a 5 mm insulated thermal bottom that holds temperature for longer soaks.',
      },
      {
        series: 'round',
        reason:
          'The Ø 2 × 0.5 m round (S2005) is the smallest true splash pool — quick to fill for a spontaneous evening dip.',
      },
    ],
    tableNote:
      'Most two-person setups land on a 1.8–2.2 m tub: enough depth to soak properly, small enough to refresh the water weekly.',
    safety: [
      'Verify the load rating of balconies and elevated decks with a qualified engineer before filling — water weighs about 1 t per m³.',
      'Follow the heater manufacturer\u2019s temperature guidance for hot soaking; avoid alcohol before or during hot-water use.',
      'Keep electrical connections to heaters and pumps away from the water edge, per the product manual.',
      'Use the drain valve for controlled emptying toward a garden or drain, not across paving.',
    ],
    cta: 'See the compact sizes that fit a modern patio.',
    relatedGuides: ["inflatable-pool-setup","inflatable-pool-maintenance"],
  },
  {
    slug: 'cold-plunge-and-recovery-pools',
    navTitle: 'Cold Plunge & Recovery',
    eyebrow: 'Pool Ideas',
    title: 'Cold Plunge & Recovery Pools',
    image: '/images/pool-ideas/cold-plunge-and-recovery-pools.webp',
    imageAlt:
      'A man doing a cold plunge recovery session in a round grey Inflatable Pool Factory tub inside a home garage gym.',
    intro: [
      'Cold-water immersion has become a staple recovery routine for athletes and fitness enthusiasts. A dedicated plunge vessel needs rigid walls you can brace against, insulation to slow warming, and a compact footprint that fits a garage gym or a shaded patio corner — exactly what Inflatable Pool Factory drop-stitch tubs are built for.',
      'The same 4–5 PSI rigid construction used across our pools, plus the 5 mm insulated thermal bottom on SPA tubs, holds cold water steadily. Add ice, or pair the tub with external water-chilling equipment — the line is designed to work with heating and spa therapy units.',
    ],
    conditions: [
      'A shaded, level spot from about 1.5 × 1.5 m — cold plunges work best out of direct sun',
      'Users healthy enough for cold immersion (see the health notes below)',
      'A routine for keeping water clean: frequent changes for ice-based setups, or filtration for chilled setups',
      'A fitted cover to keep debris out and slow warming between sessions',
    ],
    matches: [
      {
        series: 'hot-tub-round',
        reason:
          'Ø 1.8–2.3 m round tubs with built-in seats give an upright seated plunge for one or two people, insulated bottom included.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'Square tubs from 1.5 × 1.5 m fit garage corners and paired recovery stations.',
      },
      {
        series: 'rect-square',
        reason: 'The 3 × 2 × 0.8 m rectangle (SR230815) allows a reclined, full-body soak for taller athletes.',
      },
    ],
    tableNote: 'Deeper is better for plunges: 0.8–1 m walls let you submerge to the chest or shoulders while seated.',
    safety: [
      'Cold immersion places stress on the cardiovascular system — consult a physician first if you have high blood pressure, a heart condition, circulatory issues, or are pregnant.',
      'Never plunge alone or under the influence of alcohol or sedatives; keep initial sessions short (around 2–5 minutes).',
      'Inflatable Pool Factory tubs are water vessels, not medical devices — no health or recovery claims are made or implied.',
      'Secure the fitted cover when not in use to keep children, pets, and debris out.',
    ],
    cta: 'Set up a recovery station at home.',
    relatedGuides: ["inflatable-pool-maintenance","what-is-a-drop-stitch-inflatable-pool"],
  },
  {
    slug: 'pools-for-pet-families',
    navTitle: 'Pools for Pet Families',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Pet Families',
    image: '/images/pool-ideas/pools-for-pet-families.webp',
    imageAlt:
      'A golden retriever playing in a round Inflatable Pool Factory pool on a sunny suburban lawn while its owner joins in with a toy.',
    intro: [
      'Dogs feel the summer heat far more than we do, and a backyard splash spot is one of the best ways to keep them cool, exercised, and entertained. The problem with most inflatable pools is that thin vinyl walls lose to claws within days.',
      'Inflatable Pool Factory drop-stitch pools take a different approach: dense internal threading and multi-layer PVC inflate to a hard, low-stretch surface at 4–5 PSI that handles normal paw traffic far better than soft air-ring pools. No inflatable is chew-proof — but for supervised splash time, drop-stitch is the toughest portable wall you can buy.',
    ],
    conditions: [
      'A level patch of lawn or patio from about 2 × 2 m',
      'Owners who rinse muddy paws and skim pet hair after each session',
      'Pets that are supervised whenever the pool is filled',
      'Households happy to change water frequently in small-volume pools',
    ],
    matches: [
      {
        series: 'round',
        reason:
          'The Ø 2 × 0.5 m (S2005) low-rim round is the easiest step-in splash pool for small and medium dogs; Ø 3 × 1 m (S3010) gives large breeds room to actually swim.',
      },
      {
        series: 'rect-square',
        reason: 'Rectangular models give multi-pet households a defined play lane and fit along a fence line.',
      },
    ],
    tableNote:
      'For dogs, low wall height matters more than depth — 0.5–1 m wall models keep entry and exit confidence-building.',
    safety: [
      'Never leave pets unattended in or near a filled pool; short-legged and senior dogs tire quickly.',
      'No inflatable pool is chew-proof — prevent chewing on valves, drain caps, and rim seams.',
      'Keep nails trimmed to reduce long-term surface wear, and provide a separate bowl of fresh drinking water.',
      'Change water often and avoid heavy chemical treatment if your pet drinks from the pool.',
    ],
    cta: 'Pick a rugged splash pool your dog can actually enjoy.',
    relatedGuides: ["how-to-choose-inflatable-pool","inflatable-pool-maintenance"],
  },
  {
    slug: 'pools-for-water-fitness-and-recreation',
    navTitle: 'Water Fitness & Active Fun',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Water Fitness & Active Family Fun',
    image: '/images/pool-ideas/pools-for-water-fitness-and-recreation.webp',
    imageAlt:
      'A family doing water exercises and splash games in a spacious round Inflatable Pool Factory pool on a sunny backyard lawn.',
    intro: [
      'Water aerobics, standing stretches, resistance walking, and family splash games turn a pool into a summer fitness platform. What matters for movement is usable floor area and stable, vertical walls — soft ring pools lose interior space to sloped sides and slosh over the rim during active play.',
      'Inflatable Pool Factory drop-stitch pools keep their shape at 4–5 PSI: straight 90-degree walls, a flat stable floor, and rims firm enough to grip for balance work — a wide, stable platform for low-impact movement at a fraction of an in-ground pool\u2019s cost.',
    ],
    conditions: [
      'A footprint from about 3 × 2 m with at least 1 m of clear, non-slip walkway around the pool',
      'Water depth in the waist-to-chest range (0.6–1.2 m) for the exercises you plan',
      'Users who want recreational water fitness — these pools are not sized for lap swimming or diving',
      'A filter pump routine of a few hours a day to handle the extra organic load',
    ],
    matches: [
      {
        series: 'round',
        reason:
          'Ø 3–5 m rounds give the most unobstructed movement area per square meter — no corners to break up a workout circle.',
      },
      {
        series: 'rect-square',
        reason: 'The 3 × 2 × 0.8 m and 4 × 3 × 1.2 m rectangles define a workout lane and host group activity.',
      },
    ],
    tableNote:
      'For standing exercises choose 1.0–1.2 m water depth where possible; for seated and splash work 0.5–0.8 m is plenty.',
    safety: [
      'Never dive or jump headfirst — shallow water causes serious injury on impact.',
      'Treat these pools as recreational fitness venues, not lap pools or training facilities.',
      'Supervise children and non-swimmers actively at all times.',
      'Keep a non-slip path around the pool and dry footing at the entry and exit points.',
    ],
    cta: 'Find the size that fits your workout.',
    relatedGuides: ["how-much-space-do-you-need-for-an-inflatable-pool","inflatable-pool-maintenance"],
  },
  {
    slug: 'townhome-and-compact-yard-pools',
    navTitle: 'Townhomes & Compact Yards',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Townhomes & Compact Yards',
    image: '/images/pool-ideas/townhome-and-compact-yard-pools.webp',
    imageAlt:
      'A round Inflatable Pool Factory inflatable pool on the small patio of a modern townhome with wooden privacy fencing and potted plants.',
    intro: [
      'Townhome patios, side yards, and courtyards rarely appear in pool brochures — but a 2 m pool changes that math. Inflatable Pool Factory drop-stitch pools start at footprints that fit a small paved yard, install without touching shared structures, and disappear into storage the day you need the space back.',
      'Because the walls inflate rigid at 4–5 PSI instead of sagging like a ring pool, even the smallest sizes read as a real pool — straight sides, a stable rim, genuine depth.',
    ],
    conditions: [
      'Measured space from about 2 × 2 m, plus a 0.5–0.8 m access buffer on all sides for valves, pumps, and cleaning',
      'Ground-level patios and paved yards; elevated balconies only after a structural engineer confirms load capacity',
      'A drainage plan that routes water to storm drains or garden beds — not toward shared fences or neighbors',
      'A quick check of HOA or building rules on temporary seasonal structures',
    ],
    matches: [
      {
        series: 'round',
        reason:
          'The Ø 2 × 0.5 m (S2005) and Ø 3 × 1.2 m (S3012) rounds are the classic compact choices — fast to fill, easy to drain.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'The 1.5 × 1.5 m (SS151508) square tub turns even the smallest courtyard into a seated soak.',
      },
    ],
    tableNote:
      'In tight quarters, plan around the outer footprint plus buffer — a Ø 3 m pool wants roughly a 4 × 4 m zone to stay comfortable.',
    safety: [
      'Do not place filled pools on standard residential balconies or suspended decks without written sign-off from a structural engineer — water adds about 1 t per m³.',
      'Drain via the hose-compatible valve toward approved drainage points; avoid sudden discharge near shared walls.',
      'Keep hoses, cords, and pumps off walkways to prevent trips.',
      'Supervise children actively whenever the pool is filled.',
    ],
    cta: 'See how little space a real pool needs.',
    relatedGuides: ["how-much-space-do-you-need-for-an-inflatable-pool","placing-an-inflatable-pool-on-a-patio"],
  },
  {
    slug: 'pools-for-retirees-and-empty-nesters',
    navTitle: 'Pools for Retirees & Empty Nesters',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Retirees & Empty Nesters',
    image: '/images/pool-ideas/pools-for-retirees-and-empty-nesters.webp',
    imageAlt:
      'A retired couple enjoying a warm soak in a round Inflatable Pool Factory pool in a flower-filled garden at golden hour.',
    intro: [
      'When the yard quiets down, a pool stops being a playground and becomes a daily comfort — a cool soak on a warm afternoon, gentle movement for stiff joints, and a magnet for visiting grandchildren. The catch is that permanent pools demand heavy upkeep that nobody wants in retirement.',
      'Inflatable Pool Factory drop-stitch pools split the difference: rigid walls that stay firm while you step in, small water volumes that stay fresh with minutes of weekly care, and a pool that folds away entirely when the season ends.',
    ],
    conditions: [
      'A level, step-free patch of patio or garden from about 1.8 × 1.8 m with a clear, non-slip access path',
      'Users who value seated soaking and gentle movement over swimming laps',
      'A willingness to run a small filter pump and keep the cover on between soaks',
      'Grandchildren visits planned with active adult supervision in mind',
    ],
    matches: [
      {
        series: 'hot-tub-round',
        reason:
          'Ø 1.8–2.3 m round SPA tubs have built-in seats to lower into slowly and a 5 mm insulated bottom that holds temperature.',
      },
      {
        series: 'hot-tub-square-rect',
        reason: 'Square tubs from 1.5 × 1.5 m fit against a garden wall within easy reach of a handrail.',
      },
      {
        series: 'round',
        reason: 'A Ø 3 × 1 m round (S3010) keeps a cool-soak option open without much water to manage.',
      },
    ],
    tableNote:
      'Prioritize entry comfort: the 0.8 m rim of the SPA tubs gives a stable edge for stepping in, plus a clear path with no hoses to step over.',
    safety: [
      'Enter and exit slowly using the rim and seats; wet surfaces are slippery — keep a non-slip mat at the entry point.',
      'Avoid long solo soaks, especially in heated water; follow heater temperature guidance and consult a doctor where relevant.',
      'Inflatable pools are not anti-drowning devices — visiting children need continuous, undistracted adult supervision.',
      'Cover, empty, or block the pool when it is not supervised.',
    ],
    cta: 'Make the garden a daily retreat.',
    relatedGuides: ["inflatable-pool-maintenance","inflatable-pool-setup"],
  },
  {
    slug: 'pools-for-rental-and-event-operators',
    navTitle: 'Pool Rental & Event Operators',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Rental & Event Operators',
    image: '/images/pool-ideas/pools-for-rental-and-event-operators.webp',
    imageAlt:
      'A large commercial Inflatable Pool Factory pool deployed at an outdoor festival site with sand-filter equipment and an operator checking water circulation.',
    intro: [
      'Summer festivals, brand activations, pop-up beach clubs, and community events all want one thing: a water feature guests remember. Rigid pools are too heavy to tour, and toy inflatables rarely survive a second weekend. Inflatable Pool Factory commercial drop-stitch pools bridge the gap — rock-solid at 4–5 PSI, quick to deploy and strike, and packed small enough to stack in a box truck.',
      'The same platform scales from a single VIP plunge to a Ø 10 m centerpiece, with OEM/ODM options for branded fleet builds.',
    ],
    conditions: [
      'Level venue ground or decking, verified for the full water weight (about 1 t per m³)',
      'Commercial general liability insurance that explicitly covers temporary water features',
      'Trained staff for setup, water management, bather supervision, and teardown',
      'A logistics plan for transport, storage, and post-event inspection',
    ],
    matches: [
      {
        series: 'round',
        reason:
          'Rounds from Ø 3 m to Ø 10 m deploy fastest — no corners, symmetric layout, and the biggest visual impact per square meter.',
      },
      {
        series: 'rect-square',
        reason: 'Rectangular models create defined swim lanes and photograph cleanly for brand activations.',
      },
    ],
    tableNote:
      'Fleet starters usually pick one Ø 4–5 m round plus a compact tub: a splash centerpiece and a VIP soak from a single truck.',
    safety: [
      'Public or semi-public events require dedicated, trained water watchers — never rely on bystanders.',
      'Post capacity, no-diving, and no-running signage at every access point.',
      'Verify local event, health-department, and drainage regulations before deploying.',
      'Inspect every unit after each rental: wall pressure, valve seals, seams, and drain function.',
    ],
    cta: 'Build a rental fleet that survives the season — talk to our business team.',
    relatedGuides: ["inflatable-pools-for-vacation-rentals","inflatable-pool-setup"],
  },
  {
    slug: 'pools-for-boutique-hotels-and-luxury-estates',
    navTitle: 'Boutique Hotels & Luxury Estates',
    eyebrow: 'Pool Ideas',
    title: 'Pools for Boutique Hotels & Luxury Estates',
    image: '/images/pool-ideas/pools-for-boutique-hotels-and-luxury-estates.webp',
    imageAlt:
      'A round Inflatable Pool Factory soaking pool integrated into the private courtyard terrace of a boutique hotel suite.',
    intro: [
      'A private plunge on a suite terrace or in a villa courtyard is the amenity that sells the stay. Retrofitting concrete into existing structures means structural work, months of disruption, and permits — Inflatable Pool Factory drop-stitch soaking pools deliver the same photogenic experience with a non-invasive install a small team completes in under an hour.',
      'For properties, the line supports commercial projects: custom sizes and colorways, quiet filtration setups, and OEM/ODM production through our Qingdao manufacturing base.',
    ],
    conditions: [
      'Structural sign-off from a licensed engineer for any elevated terrace, balcony, or deck placement',
      'A level sub-base with protective underlayment to distribute weight and isolate pump vibration',
      'Housekeeping or facilities staff for daily water checks between stays',
      'Local hotel-pool sanitation codes and commercial liability insurance verified before guest use',
    ],
    matches: [
      {
        series: 'hot-tub-square-rect',
        reason:
          'Square and rectangular tubs from 1.8 × 1.8 m to 3 × 2 m tuck into courtyard corners and against feature walls.',
      },
      {
        series: 'hot-tub-round',
        reason: 'Ø 1.8–2.3 m round tubs with seats and an insulated bottom make a signature in-suite soak.',
      },
      {
        series: 'rect-square',
        reason: 'Custom rectangular builds frame deck views — ask our team about project sizing.',
      },
    ],
    tableNote: 'Most properties start with one tub per signature suite, then repeat the model that books best.',
    safety: [
      'Guest materials must state that pools are recreational amenities requiring supervision — they are not anti-drowning devices.',
      'Keep filtration and heater electrics protected and away from the water edge, per the product manual.',
      'Confirm sanitation, fencing, and signage requirements with local authorities before opening to guests.',
      'Cover and secure amenities outside supervised hours.',
    ],
    cta: 'Plan a hospitality project with our commercial team.',
    relatedGuides: ["inflatable-pools-for-vacation-rentals","inflatable-pool-maintenance"],
  },
];

export const findPoolIdea = (slug: string): PoolIdea | undefined => POOL_IDEAS.find((i) => i.slug === slug);
