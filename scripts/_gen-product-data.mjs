const slugs = [
  {
    slug: 'ap330',
    series: 'Apex Performance',
    size: '330',
    name: 'Apex Performance 330 (AP330)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'dayboat', 'cruising'],
    desc: 'Entry-level luxury console RIB tender in the Apex Performance series.',
    def: 'A 3.36m luxury console RIB tender with 20° deep V aluminum hull, built-in fuel tank, and premium EVA deck.',
    problem:
      'Yacht owners need a premium tender that combines aluminum durability with luxury finish and integrated console for comfortable inshore cruising.',
    howItWorks:
      'The AP330 features a 3mm marine-grade aluminum 20° deep V hull with center console, 30L built-in fuel tank, and EVA faux wood grain deck. Supports up to 30 HP short shaft outboard.',
    audience: 'Yacht owners seeking a premium tender, resort operators, and day boat enthusiasts.',
    ai_use_cases: ['Yacht tender for 40-60 ft vessels', 'Resort guest transport', 'Inshore day cruising'],
    ai_specs: {
      length: '3.36 m',
      hull: '3mm aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '30 HP',
      capacity: '5 persons',
      fuel: '30 L built-in',
    },
    ai_comparison:
      'Compared to smaller Swiftlitee/Versa tenders, the AP330 adds a full center console with windshield, built-in fuel tank, and EVA luxury deck — a step up from tiller-steered open boats.',
    ai_faq: [
      {
        q: 'Does the AP330 come with a console?',
        a: 'Yes, the AP330 includes an integrated luxury center console with steering wheel, windshield, and helm seat as standard.',
      },
      {
        q: 'Can it be used as a standalone day boat?',
        a: 'Yes. With the center console and 30 HP rating, the AP330 is fully capable as an independent inshore day boat for family outings.',
      },
    ],
  },
  {
    slug: 'ap360',
    series: 'Apex Performance',
    size: '360',
    name: 'Apex Performance 360 (AP360)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'dayboat', 'cruising'],
    desc: 'Small-to-midsize luxury center console RIB tender with 40 HP capability.',
    def: 'A 3.63m luxury console RIB with 20° deep V aluminum hull, center console, 30L fuel tank, and EVA deck standard.',
    problem:
      'Boaters need a compact but fully-equipped console RIB that offers more power and space than entry-level tenders.',
    howItWorks:
      'The AP360 upgrades to long shaft 40 HP capability while maintaining the 20° deep V aluminum hull, integrated console, and luxury EVA deck of the Apex series.',
    audience: 'Yacht owners, day cruisers, and resort operators needing more power than the AP330.',
    ai_use_cases: ['Larger yacht tender', 'Family day boat', 'Resort water taxi'],
    ai_specs: {
      length: '3.63 m',
      hull: '3mm aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '40 HP',
      capacity: '6 persons',
      fuel: '30 L built-in',
    },
    ai_comparison:
      'The AP360 extends the AP330 platform with 40 HP long shaft capability and 6-person capacity, ideal for larger yachts or families needing more power.',
    ai_faq: [
      {
        q: 'What engine shaft length does the AP360 require?',
        a: 'The AP360 requires a Long Shaft (L, 20 inch) outboard, unlike the AP330 which uses Short Shaft.',
      },
      { q: 'How many people can it carry?', a: 'Up to 6 persons with a maximum load of 600 kg.' },
    ],
  },
  {
    slug: 'ap390',
    series: 'Apex Performance',
    size: '390',
    name: 'Apex Performance 390 (AP390)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'dayboat', 'cruising'],
    desc: 'Mid-size luxury console RIB stepping into the 50 HP class.',
    def: 'A 3.90m luxury console RIB with 20° deep V hull, 47cm tubes, 30L fuel tank, rated for up to 50 HP.',
    problem: 'Boaters need a mid-size console RIB with 50 HP capability for faster planing and heavier payloads.',
    howItWorks:
      'The AP390 features 47cm larger tubes and 50 HP long shaft rating, providing more buoyancy and power than the AP360 while maintaining the same luxury finish.',
    audience: 'Yacht owners needing a high-quality tender, day boat enthusiasts, and charter operators.',
    ai_use_cases: ['Premium yacht tender', 'Family day cruising', 'Inshore fishing'],
    ai_specs: {
      length: '3.90 m',
      hull: '3mm aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '50 HP',
      capacity: '7 persons',
      fuel: '30 L built-in',
    },
    ai_comparison:
      'The AP390 steps up to 47cm tubes and 50 HP, bridging the gap between compact tenders and the larger AP420 family day boat.',
    ai_faq: [
      {
        q: 'Is the AP390 suitable for watersports?',
        a: 'With 50 HP, the AP390 can pull light tubes and kneeboards, though dedicated watersports are better served by the AP520 or AP560.',
      },
      {
        q: 'Does it have a radar arch option?',
        a: 'Yes, a rollbar / ski tow arch is available as an optional accessory for the AP390.',
      },
    ],
  },
  {
    slug: 'ap420',
    series: 'Apex Performance',
    size: '420',
    name: 'Apex Performance 420 (AP420)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'dayboat', 'cruising', 'watersports'],
    desc: 'The perfect first family dayboat with 70 HP capability and 55L fuel tank.',
    def: 'A 4.24m luxury console RIB with 20° deep V hull, 55L high-capacity fuel tank, wide bow step, rated for 70 HP.',
    problem: 'Families need a versatile day boat that can handle watersports, cruising, and comfortable seating for 8.',
    howItWorks:
      'The AP420 upgrades to a 55L fuel tank and 70 HP rating with 47cm tubes and 4 air chambers, providing the range and power for full-day family outings.',
    audience: 'Families, day boat enthusiasts, and yacht owners wanting a versatile tender.',
    ai_use_cases: ['Family day boat', 'Watersports towing', 'Yacht tender for larger vessels'],
    ai_specs: {
      length: '4.24 m',
      hull: 'Marine-grade aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '70 HP',
      capacity: '8 persons',
      fuel: '55 L built-in',
    },
    ai_comparison:
      'The AP420 is the sweet-spot family day boat — more range and power than the AP390, with comfortable seating for 8 and optional sundeck and tow post.',
    ai_faq: [
      {
        q: 'Can the AP420 pull a skier?',
        a: 'Yes, with 70 HP the AP420 can pull a single slalom skier or wakeboarder. An optional tow post or A-frame roll bar is available.',
      },
      {
        q: 'What makes this a good first family boat?',
        a: 'The AP420 offers 8-person capacity, self-draining deck, 55L fuel range, and CE Category C certification — everything a family needs in a manageable 4.2m package.',
      },
    ],
  },
  {
    slug: 'ap460',
    series: 'Apex Performance',
    size: '460',
    name: 'Apex Performance 460 (AP460)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'dayboat', 'cruising'],
    desc: 'Flagship crossover model in the 4-meter class with ergonomic layout and bow locker.',
    def: 'A 4.60m luxury RIB with 20° deep V hull, 55L fuel tank, deluxe center console with forward seat, and large bow locker.',
    problem: 'Boaters need a 4.6m crossover that works as both a luxury tender and comfortable day cruiser.',
    howItWorks:
      'The AP460 features a standalone center console with forward seat, built-in bow locker, and 83 HP rating in a 4.6m platform.',
    audience: 'Yacht owners, day cruisers, and boaters wanting maximum capability in a 4-meter class RIB.',
    ai_use_cases: ['Premium yacht tender', 'Day cruising', 'Coastal exploration'],
    ai_specs: {
      length: '4.60 m',
      hull: '5083 aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '83 HP (70 HP in select regions)',
      capacity: '9 persons',
      fuel: '55 L built-in',
    },
    ai_comparison:
      'The AP460 is the flagship of the 4-meter Apex class, with bow locker, deluxe console, and 83 HP capability — more storage and power than the AP420.',
    ai_faq: [
      {
        q: 'Why is the max HP listed as 83 HP?',
        a: 'The AP460 is rated for 83 HP in most markets, though some regions label it as 70 HP for licensing purposes. The hull is fully rated for 83 HP.',
      },
      {
        q: 'Does the bow locker hold an anchor?',
        a: 'Yes, the large bow locker accommodates anchor chain gear, mooring lines, and fenders.',
      },
    ],
  },
  {
    slug: 'ap520',
    series: 'Apex Performance',
    size: '520',
    name: 'Apex Performance 520 (AP520)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['coastal', 'sea'],
    water: ['moderate chop', 'rough'],
    safety: 'high',
    use_case: ['cruising', 'watersports', 'tender', 'diving'],
    desc: '5-meter class luxury RIB with 24° offshore deep V hull and 105L fuel tank.',
    def: 'A 5.23m luxury RIB with 24° offshore deep V aluminum hull, 105L built-in fuel tank, and 100 HP capability.',
    problem:
      'Boaters need a 5-meter class RIB with offshore-capable hull and long-range fuel capacity for extended cruising.',
    howItWorks:
      'The AP520 upgrades to a 24° deadrise offshore hull, 105L extra-large fuel tank, and 100 HP rating — a significant jump in offshore capability from the 4-meter class.',
    audience: 'Experienced boaters, yacht owners, and commercial operators needing an offshore-capable 5m RIB.',
    ai_use_cases: ['Offshore day cruising', 'Watersports', 'Yacht tender for superyachts', 'Dive support'],
    ai_specs: {
      length: '5.23 m',
      hull: '4mm aluminum 24° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 52cm',
      max_engine: '100 HP',
      capacity: '10 persons',
      fuel: '105 L built-in',
    },
    ai_comparison:
      'The AP520 crosses into the 5-meter class with 24° offshore hull and 105L fuel — a major upgrade from the 20°/55L configuration of the 4-meter Apex models.',
    ai_faq: [
      {
        q: 'What is the cruising range with the 105L tank?',
        a: 'At moderate cruising speed with a 100 HP outboard, the 105L tank provides approximately 100-150 nautical miles of range depending on conditions.',
      },
      {
        q: 'Does the AP520 handle rough water?',
        a: 'Yes. The 24° offshore deep V hull is specifically designed for rougher sea conditions, a significant upgrade from the 20° hull of smaller Apex models.',
      },
    ],
  },
  {
    slug: 'ap560',
    series: 'Apex Performance',
    size: '560',
    name: 'Apex Performance 560 (AP560)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['coastal', 'sea'],
    water: ['moderate chop', 'rough'],
    safety: 'high',
    use_case: ['cruising', 'watersports', 'tender', 'diving', 'fishing'],
    desc: 'Core long-range sports RIB with 115 HP, 105L fuel, and 12-person capacity.',
    def: 'A 5.66m luxury RIB with 24° offshore deep V hull, 2.50m beam, 105L fuel tank, rated for 115 HP.',
    problem:
      'Experienced boaters need a versatile 5.5m RIB that serves as luxury tender, standalone dayboat, and watersports platform.',
    howItWorks:
      'The AP560 features a 2.50m wide beam, 24° offshore hull, and 115 HP rating — the core long-range model in the Apex series with 12-person capacity and 1.1-ton payload.',
    audience: 'Experienced boaters, superyacht owners, watersports enthusiasts, and dive operators.',
    ai_use_cases: ['Superyacht luxury tender', 'Watersports towing platform', 'Offshore day cruising', 'Dive boat'],
    ai_specs: {
      length: '5.66 m',
      hull: '4mm aluminum 24° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 52cm',
      max_engine: '115 HP',
      capacity: '12 persons',
      fuel: '105 L built-in',
    },
    ai_comparison:
      'The AP560 is the versatile core of the Apex fleet — wider beam and more power than the AP520, making it ideal as both a standalone vessel and a superyacht tender.',
    ai_faq: [
      {
        q: 'Can the AP560 pull a wakeboarder?',
        a: 'Yes. With 115 HP and a rollbar/ski tow arch option, the AP560 is an excellent watersports platform for skiing, wakeboarding, and tubing.',
      },
      {
        q: 'Is it suitable as a superyacht tender?',
        a: 'Absolutely. The 12-person capacity, 105L range, and luxury finish make it one of the best superyacht tenders in its class.',
      },
    ],
  },
  {
    slug: 'ap660',
    series: 'Apex Performance',
    size: '660',
    name: 'Apex Performance 660 (AP660)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['sea', 'offshore'],
    water: ['rough'],
    safety: 'high',
    use_case: ['offshore cruising', 'tender', 'patrol'],
    desc: 'CE Category B offshore luxury RIB with 26° deep V and 200 HP.',
    def: 'A 6.51-6.60m luxury offshore RIB with 26° deep V 5mm aluminum hull, 140L fuel tank, CE Category B certified, rated for 200 HP.',
    problem:
      'Offshore boaters need a CE Category B certified RIB capable of handling harsh sea conditions with long-range fuel capacity.',
    howItWorks:
      'The AP660 upgrades to 26° offshore deep V hull with 5mm aluminum, 140L fuel tank, and 200 HP XL shaft rating — the first Apex model with full offshore Category B certification.',
    audience:
      'Experienced offshore boaters, coast guard units, and commercial operators needing Category B certification.',
    ai_use_cases: ['Offshore cruising', 'Coast guard patrol', 'Search and rescue support', 'Long-range transport'],
    ai_specs: {
      length: '6.51-6.60 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 55cm',
      max_engine: '200 HP',
      capacity: '13 persons',
      fuel: '140 L built-in',
    },
    ai_comparison:
      'The AP660 is the first Apex model with CE Category B offshore certification, 5mm hull, and 200 HP — a dramatic step up in offshore capability from the 24°/100HP AP520/AP560.',
    ai_faq: [
      {
        q: 'What does CE Category B mean?',
        a: 'Category B (Offshore) certification means the boat is designed for operating in wind forces up to Beaufort 8 and significant wave heights up to 4 meters.',
      },
      {
        q: 'Can it handle twin engines?',
        a: 'The AP660 is rated for a single 200 HP XL shaft engine. For twin engines, consider the AP800 or AP900.',
      },
    ],
  },
  {
    slug: 'ap700',
    series: 'Apex Performance',
    size: '700',
    name: 'Apex Performance 700 (AP700)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['sea', 'offshore'],
    water: ['rough'],
    safety: 'high',
    use_case: ['offshore cruising', 'tender'],
    desc: '7-meter luxury offshore RIB with 250 HP and 280L fuel.',
    def: 'A 7.0m+ luxury offshore RIB with 26° deep V 5mm hull, 280L fuel tank, CE Category B, rated for 250 HP.',
    problem: 'Offshore boaters need a 7m RIB with ultra-long range and high power for extended offshore missions.',
    howItWorks:
      'The AP700 features a 280L ultra-large fuel tank, 250 HP XL shaft rating, and oversized 58cm tubes — built for serious offshore cruising.',
    audience: 'Experienced offshore boaters and commercial operators needing maximum range and power.',
    ai_use_cases: ['Extended offshore cruising', 'Long-range patrol', 'Superyacht support vessel'],
    ai_specs: {
      length: '7.0 m+',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 58cm',
      max_engine: '250 HP',
      capacity: '14 persons',
      fuel: '280 L built-in',
    },
    ai_comparison:
      'The AP700 doubles the fuel capacity of the AP660 to 280L and increases power to 250 HP — the first Apex model with true long-range offshore capability.',
    ai_faq: [
      {
        q: 'What is the cruising range with 280L?',
        a: 'With a 200-250 HP outboard at cruising speed, the 280L tank provides approximately 200-300 nautical miles of range depending on conditions and load.',
      },
      {
        q: 'Can the AP700 be beached?',
        a: 'The 5mm aluminum hull can handle careful beaching on sand, though the larger size and weight make it more practical to anchor offshore and wade in.',
      },
    ],
  },
  {
    slug: 'ap760',
    series: 'Apex Performance',
    size: '760',
    name: 'Apex Performance 760 (AP760)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['sea', 'offshore'],
    water: ['rough'],
    safety: 'high',
    use_case: ['offshore cruising', 'tender', 'luxury'],
    desc: 'Luxury 7.6m offshore flagship RIB with 300 HP and 280L fuel.',
    def: 'A 7.71m luxury offshore RIB with 26° deep V hull, 58cm tubes, 280L fuel, CE Category B, rated for 300 HP.',
    problem: 'Buyers need a 7.5m luxury offshore flagship that combines high performance with premium comfort.',
    howItWorks:
      'The AP760 steps into the 7.5m crossover dimension with 300 HP rating, boarding ladder, helm console with USB ports, and deck courtesy lighting.',
    audience: 'Luxury offshore boaters, yacht owners, and premium charter operators.',
    ai_use_cases: ['Luxury offshore cruising', 'Yacht club sport boat', 'Premium charter vessel'],
    ai_specs: {
      length: '7.71 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 58cm',
      max_engine: '300 HP',
      capacity: '10 persons',
      fuel: '280 L built-in',
    },
    ai_comparison:
      'The AP760 is the luxury performance flagship of the 7m class, with 300 HP rating, boarding ladder, and premium helm station — more refined than the utilitarian AP700.',
    ai_faq: [
      {
        q: 'What luxury features does the AP760 include?',
        a: 'Standard features include deck courtesy lighting, waterproof USB ports at the helm, and a deluxe console with room for 12-inch chartplotters.',
      },
      {
        q: 'Does it come with a boarding ladder?',
        a: 'Yes, the AP760 includes a stern boarding ladder as standard equipment.',
      },
    ],
  },
  {
    slug: 'ap800',
    series: 'Apex Performance',
    size: '800',
    name: 'Apex Performance 800 (AP800)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['sea', 'offshore'],
    water: ['rough', 'extreme'],
    safety: 'high',
    use_case: ['offshore cruising', 'tender', 'luxury'],
    desc: 'Offshore cruise flagship with 350 HP, twin engine support, 300L fuel tank.',
    def: 'An 8.11m luxury offshore RIB with 26° deep V hull, 300L fuel tank, CE Category B, supporting single 350 HP or twin engines.',
    problem:
      'Offshore cruisers need an 8m+ flagship with twin engine capability and luxury amenities for extended offshore passages.',
    howItWorks:
      'The AP800 features a 300L super-large fuel tank, twin engine support up to 350 HP total, sundeck extensions, anchor locker, and dinette area.',
    audience: 'Experienced offshore cruisers, luxury boat owners, and charter fleet operators.',
    ai_use_cases: ['Extended offshore cruising', 'Luxury day boat', 'Charter vessel', 'Twin-engine patrol'],
    ai_specs: {
      length: '8.11 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon 58cm',
      max_engine: '350 HP (single or twin)',
      capacity: '15 persons',
      fuel: '300 L built-in',
    },
    ai_comparison:
      'The AP800 is the offshore cruise flagship — twin engine capability, 300L fuel, sundeck, and dinette make it a true offshore weekender compared to the single-engine AP760.',
    ai_faq: [
      {
        q: 'Can the AP800 run twin engines?',
        a: 'Yes. The AP800 supports twin outboard engines with a reinforced transom, or a single 350 HP engine.',
      },
      {
        q: 'Does it have a cabin?',
        a: 'The AP800 does not have a cabin, but offers a mid-cockpit dinette area and under-seat storage. For cabin accommodations, see the Explorer EX9.',
      },
    ],
  },
  {
    slug: 'ap900',
    series: 'Apex Performance',
    size: '900',
    name: 'Apex Performance 900 (AP900)',
    cat: 'RIB',
    skill: 'professional',
    env: ['sea', 'offshore'],
    water: ['rough', 'extreme'],
    safety: 'high',
    use_case: ['offshore cruising', 'luxury', 'charter'],
    desc: 'The ultimate 9.12m flagship RIB with 600 HP twin engines and 380L fuel.',
    def: 'A 9.12m ultimate flagship RIB with 26° deep V hull, 380L fuel, CE Category B/C, supporting twin 300 HP (600 HP total).',
    problem:
      'Premium buyers need the largest, most capable RIB in the Inflatable Pool Factory range for offshore luxury cruising with 19-person capacity.',
    howItWorks:
      'The AP900 features 380L oversized fuel tank, twin 300 HP engines (600 HP total), dual sundecks, optional kitchenette and head, and bow storage locker — the pinnacle of the Apex series.',
    audience:
      'Premium offshore cruisers, charter operators, and government agencies needing a high-capacity high-speed vessel.',
    ai_use_cases: [
      'Ultra-premium offshore cruising',
      'High-speed charter',
      'Government patrol',
      'Luxury events platform',
    ],
    ai_specs: {
      length: '9.12 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon 58cm',
      max_engine: '600 HP (twin 2x300 HP)',
      capacity: '19 persons',
      fuel: '380 L built-in',
    },
    ai_comparison:
      'The AP900 is the ultimate Inflatable Pool Factory RIB — 9.12m, 600 HP twin engines, 380L fuel, 19 passengers. Nothing else in the range matches its combination of size, power, and luxury.',
    ai_faq: [
      {
        q: 'What is the top speed of the AP900?',
        a: 'With twin 300 HP engines, the AP900 can reach top speeds of up to 60 knots depending on load and conditions.',
      },
      {
        q: 'Does the AP900 have a bathroom?',
        a: 'An optional head system (marine toilet) can be installed inside the large center console. A kitchenette with refrigerator is also available as an option.',
      },
    ],
  },
  {
    slug: 'df420',
    series: 'Defender',
    size: '420',
    name: 'Defender 420 (DF420)',
    cat: 'RIB',
    skill: 'professional',
    env: ['coastal', 'sea', 'rescue'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['patrol', 'commercial', 'rescue', 'dive'],
    desc: 'Entry-level commercial/heavy-duty RIB for patrol and utility operations.',
    def: 'A 4.24m commercial RIB with 4mm aluminum 20° deep V hull, 47cm tubes, rated for 60 HP, designed for patrol and commercial operations.',
    problem: 'Commercial operators need a rugged, compact patrol RIB that withstands daily heavy-duty use.',
    howItWorks:
      'The DF420 features a 4mm marine-grade aluminum hull with commercial passivation, full-length keel guard, bow locker, and self-draining deck — built for commercial duty cycles.',
    audience: 'Coast guard, harbor patrol, dive operators, and commercial marine businesses.',
    ai_use_cases: ['Harbor patrol', 'Dive support', 'Rescue operations', 'Commercial utility'],
    ai_specs: {
      length: '4.24 m',
      hull: '4mm aluminum 20° commercial deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '60 HP',
      capacity: '8 persons',
      fuel: 'Portable / bow locker storage',
    },
    ai_comparison:
      'The DF420 is the entry-level Defender — more rugged than the Apex series with 4mm hull, full keel guard, and commercial paint finish designed for stain resistance and visibility.',
    ai_faq: [
      {
        q: 'What color options are available for commercial use?',
        a: 'The DF420 offers Dark Grey, Black, and Rescue Red color schemes specifically designed for commercial visibility and stain resistance.',
      },
      {
        q: 'Can it carry dive equipment?',
        a: 'Yes. The bow locker and open deck layout make it suitable for dive operations with equipment storage.',
      },
    ],
  },
  {
    slug: 'df460',
    series: 'Defender',
    size: '460',
    name: 'Defender 460 (DF460)',
    cat: 'RIB',
    skill: 'professional',
    env: ['coastal', 'sea', 'rescue'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['patrol', 'commercial', 'rescue'],
    desc: '4-meter class utility RIB balancing maneuverability with payload capacity.',
    def: 'A 4.60m commercial RIB with 4mm aluminum 20° deep V hull, 47cm tubes, rated for 70 HP, designed for patrol and commercial duty.',
    problem:
      'Commercial operators need a compact patrol RIB with large space payload capacity and high maneuverability.',
    howItWorks:
      'The DF460 extends the DF420 platform with 70 HP rating and larger internal space, maintaining the commercial-duty construction and protective features.',
    audience: 'Coast guard, patrol units, dive operators, and commercial marine businesses.',
    ai_use_cases: ['Coastal patrol', 'Dive operations', 'Commercial transport', 'Utility work'],
    ai_specs: {
      length: '4.60 m',
      hull: '4mm aluminum 20° commercial deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '70 HP',
      capacity: '9 persons',
      fuel: 'External / bow locker storage',
    },
    ai_comparison:
      'The DF460 adds 70 HP capability and more deck space to the DF420 platform, making it better suited for patrol missions requiring more speed and crew capacity.',
    ai_faq: [
      {
        q: 'Does it include a tachometer?',
        a: 'Yes, the DF460 helm console includes a tachometer/RPM gauge as part of the standard commercial console package.',
      },
      {
        q: 'What is the highlight orange color?',
        a: 'Highlight Orange is a high-visibility color scheme exclusive to the Defender series, designed for SAR and patrol visibility in all conditions.',
      },
    ],
  },
  {
    slug: 'df500',
    series: 'Defender',
    size: '500',
    name: 'Defender 500 (DF500)',
    cat: 'RIB',
    skill: 'professional',
    env: ['coastal', 'sea', 'rescue'],
    water: ['moderate chop', 'rough'],
    safety: 'high',
    use_case: ['patrol', 'commercial', 'rescue', 'dive'],
    desc: 'Core commercial utility RIB with 24° offshore deep V hull and 90L integrated fuel tank.',
    def: 'A 5.00m commercial RIB with 4mm aluminum 24° offshore deep V hull, 90L integrated fuel tank, rated for 100 HP.',
    problem:
      'Commercial operators need a 5m utility RIB with offshore-grade hull and integrated fuel for extended patrol duty.',
    howItWorks:
      'The DF500 upgrades from the 20° hull of DF420/460 to a 24° offshore deep V, and adds a 90L integrated bilge fuel tank — significantly improving range and sea-keeping.',
    audience: 'Coast guard, patrol units, commercial operators, and SAR teams.',
    ai_use_cases: ['Extended patrol missions', 'Commercial dive operations', 'SAR support', 'Utility transport'],
    ai_specs: {
      length: '5.00-5.10 m',
      hull: '4mm aluminum 24° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 52cm',
      max_engine: '100 HP',
      capacity: '10 persons',
      fuel: '90 L integrated bilge',
    },
    ai_comparison:
      'The DF500 represents a major upgrade from the DF460 — 24° offshore hull, integrated 90L fuel tank, and 100 HP rating make it suitable for serious offshore patrol duty.',
    ai_faq: [
      {
        q: 'How does the DF500 differ from the DF460?',
        a: 'The DF500 upgrades the hull deadrise from 20° to 24° for better offshore performance, adds a 90L integrated bilge fuel tank (vs. external tank on DF460), and increases the power rating to 100 HP.',
      },
      {
        q: 'Can it be equipped with suspension seats?',
        a: 'Yes, professional pneumatic/hydraulic suspension seats with shock mitigation are available as optional equipment for the DF500.',
      },
    ],
  },
  {
    slug: 'df540',
    series: 'Defender',
    size: '540',
    name: 'Defender 540 (DF540)',
    cat: 'RIB',
    skill: 'professional',
    env: ['coastal', 'sea', 'rescue'],
    water: ['moderate chop', 'rough'],
    safety: 'high',
    use_case: ['patrol', 'rescue', 'commercial', 'dive'],
    desc: 'Mid-size offshore workhorse for patrol, SAR, and commercial operations.',
    def: 'A 5.41m commercial RIB with 4mm aluminum 24° offshore deep V hull, 105L fuel tank, rated for 115 HP, designed for patrol and SAR.',
    problem:
      'Professional marine units need a rugged 5.4m workhorse for coast guard patrol, SAR, and commercial diving operations.',
    howItWorks:
      'The DF540 features a modular self-draining deck, 105L under-floor fuel tank, heavy-duty protection pack, and 115 HP rating — the flagship of the Defender 5m class.',
    audience: 'Coast guard, SAR teams, dive operators, and commercial marine operators.',
    ai_use_cases: ['Coast guard patrol', 'Search and rescue', 'Commercial dive operations', 'Maritime security'],
    ai_specs: {
      length: '5.41 m',
      hull: '4mm aluminum 24° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 52cm',
      max_engine: '115 HP',
      capacity: '12 persons',
      fuel: '105 L under-floor',
    },
    ai_comparison:
      'The DF540 is the flagship of the 5m Defender class — larger fuel tank, more power, and heavier-duty construction than the DF500, ideal for all-day patrol missions.',
    ai_faq: [
      {
        q: 'What is the difference between DF540 and DF540 Coaster?',
        a: 'The DF540 Coaster features a dedicated Coaster commercial console with windshield and handrails, while the standard DF540 uses the Defender exclusive commercial console. Both share the same hull and specs.',
      },
      {
        q: 'Can a dive rack be fitted?',
        a: 'Yes, a dive rack system is available as optional equipment for both the DF540 and DF540 Coaster.',
      },
    ],
  },
  {
    slug: 'df540-coaster',
    series: 'Defender',
    size: '540',
    name: 'Defender 540 Coaster (DF540 Coaster)',
    cat: 'RIB',
    skill: 'professional',
    env: ['coastal', 'sea', 'rescue'],
    water: ['moderate chop', 'rough'],
    safety: 'high',
    use_case: ['patrol', 'rescue', 'commercial', 'dive', 'exploration'],
    desc: 'Coaster Edition patrol RIB with dedicated modular work deck for inshore/offshore multi-purpose operations.',
    def: 'A 5.41m Coaster Edition commercial RIB with 24° offshore deep V hull, 105L fuel tank, Coaster console with windshield, rated for 115 HP.',
    problem:
      'Commercial operators need a purpose-built Coaster console RIB with flush work deck for multi-purpose patrol and exploration.',
    howItWorks:
      'The DF540 Coaster features a dedicated Coaster commercial console with windshield and stainless steel handrails, flush self-draining deck, and 105L fuel tank for full-day patrol endurance.',
    audience: 'Coast guard, patrol teams, dive operators, and commercial marine businesses.',
    ai_use_cases: [
      'Coastal patrol with console protection',
      'Search and rescue',
      'Dive exploration',
      'Commercial water operations',
    ],
    ai_specs: {
      length: '5.41 m',
      hull: '4mm aluminum 24° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 52cm',
      max_engine: '115 HP',
      capacity: '12 persons',
      fuel: '105 L under-floor',
    },
    ai_comparison:
      'The DF540 Coaster uses the same hull as the standard DF540 but features a Coaster-style console with full windshield — better weather protection for extended patrol missions.',
    ai_faq: [
      {
        q: 'What advantage does the Coaster console provide?',
        a: 'The Coaster console offers full windshield protection, stainless steel handrails, and a larger dashboard area — better suited for extended offshore patrol in rough weather.',
      },
      {
        q: 'Is the hull the same as the standard DF540?',
        a: 'Yes, both DF540 variants share the identical 24° offshore deep V hull, 105L fuel tank, and 115 HP rating.',
      },
    ],
  },
  {
    slug: 'df600',
    series: 'Defender',
    size: '600',
    name: 'Defender 600 (DF600)',
    cat: 'RIB',
    skill: 'professional',
    env: ['sea', 'offshore', 'rescue'],
    water: ['rough'],
    safety: 'high',
    use_case: ['patrol', 'rescue', 'commercial', 'dive'],
    desc: '6-meter offshore patrol RIB with CE Category B certification and 140L fuel.',
    def: 'A 6.00m offshore patrol RIB with 5mm aluminum 26° deep V hull, 140L fuel tank, CE Category B, rated for 150 HP.',
    problem:
      'Offshore patrol units need a CE Category B certified 6m RIB for rough sea patrol, SAR, and professional diving.',
    howItWorks:
      'The DF600 upgrades to 5mm hull, 26° offshore deadrise, 140L under-floor fuel, and CE Category B certification — the first Defender with full offshore rating.',
    audience: 'Coast guard, SAR teams, offshore patrol units, and professional dive operations.',
    ai_use_cases: [
      'Offshore maritime patrol',
      'Search and rescue in rough seas',
      'Professional dive engineering',
      'Commercial duty operations',
    ],
    ai_specs: {
      length: '6.00 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 58cm',
      max_engine: '150 HP',
      capacity: '14 persons',
      fuel: '140 L under-floor',
    },
    ai_comparison:
      'The DF600 is the first Defender with CE Category B offshore certification — 5mm hull, 26° deadrise, and 140L fuel make it a serious offshore patrol vessel.',
    ai_faq: [
      {
        q: 'Can the DF600 handle rough offshore conditions?',
        a: 'Yes. CE Category B certification means the DF600 is designed for wind forces up to Beaufort 8 and significant wave heights up to 4 meters.',
      },
      {
        q: 'What engine configuration is recommended?',
        a: 'A 115-150 HP long shaft outboard provides the best balance of performance and fuel economy for patrol missions.',
      },
    ],
  },
  {
    slug: 'df700',
    series: 'Defender',
    size: '700',
    name: 'Defender 700 (DF700)',
    cat: 'RIB',
    skill: 'professional',
    env: ['sea', 'offshore', 'rescue'],
    water: ['rough'],
    safety: 'high',
    use_case: ['patrol', 'rescue', 'commercial', 'SAR'],
    desc: '7-meter commercial SAR workhorse with ultra-large 285L fuel tank.',
    def: 'A 6.95m commercial SAR RIB with 5mm aluminum 26° deep V hull, 285L ultra-large fuel tank, rated for 250 HP.',
    problem: 'Long-duration offshore patrol and SAR operations need a 7m RIB with ultra-long range fuel capacity.',
    howItWorks:
      'The DF700 more than doubles the fuel capacity of the DF600 to 285L, supports single/twin engine configurations, and features a spacious 5.2m+ internal deck.',
    audience: 'Coast guard, offshore SAR teams, and commercial patrol operators.',
    ai_use_cases: [
      'Long-duration offshore patrol',
      'Extended SAR missions',
      'Offshore law enforcement',
      'Commercial security',
    ],
    ai_specs: {
      length: '6.95 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 58cm',
      max_engine: '250 HP (single or twin)',
      capacity: '14 persons',
      fuel: '285 L ultra-large',
    },
    ai_comparison:
      'The DF700 doubles the DF600 fuel capacity to 285L — the ultra-large tank enables multi-day patrol missions without refueling.',
    ai_faq: [
      {
        q: 'Can the DF700 run twin engines?',
        a: 'Yes. The reinforced transom supports a single 250 HP engine or twin engine configuration for redundancy.',
      },
      {
        q: 'What is the patrol range with 285L?',
        a: 'At patrol cruising speed, the 285L tank provides approximately 250-350 nautical miles of range depending on engine configuration and conditions.',
      },
    ],
  },
  {
    slug: 'df760',
    series: 'Defender',
    size: '760',
    name: 'Defender 760 (DF760)',
    cat: 'RIB',
    skill: 'professional',
    env: ['sea', 'offshore', 'rescue'],
    water: ['rough', 'extreme'],
    safety: 'high',
    use_case: ['interception', 'rescue', 'commercial', 'patrol'],
    desc: 'Offshore SAR and heavy interceptor flagship with 60cm extra-large tubes and 300 HP.',
    def: 'A 7.60m heavy interceptor RIB with 5mm aluminum 26° deep V hull, 60cm extra-large tubes, 285L fuel, rated for 300 HP.',
    problem:
      'Coast guard and law enforcement need a heavy interceptor with ultra-wide deck and high power for offshore interception and SAR.',
    howItWorks:
      'The DF760 features 60cm extra-large tubes, 1.63m ultra-wide internal deck, 300 HP rating with single/twin engine options, and 285L fuel for long-range missions.',
    audience: 'Coast guard interception units, SAR teams, and commercial engineering operators.',
    ai_use_cases: [
      'Offshore interception',
      'Heavy SAR operations',
      'Large-scale commercial engineering',
      'Maritime law enforcement',
    ],
    ai_specs: {
      length: '7.60 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 60cm',
      max_engine: '300 HP',
      capacity: '18 persons',
      fuel: '285 L ultra-large',
    },
    ai_comparison:
      'The DF760 expands internal width by 25cm over the DF700 with 60cm tubes, and adds 300 HP rating — the heaviest interceptor in the Defender series.',
    ai_faq: [
      {
        q: 'How does the DF760 differ from the DF700?',
        a: 'The DF760 features 60cm extra-large tubes (vs. 58cm), a 1.63m ultra-wide internal deck (vs. 1.38m), 300 HP rating (vs. 250 HP), and 18-person capacity (vs. 14).',
      },
      {
        q: 'Can the DF760 carry dive teams?',
        a: 'Yes. The 1.63m ultra-wide deck easily accommodates fully equipped dive teams with gear. A dive rack system is available as an option.',
      },
    ],
  },
  {
    slug: 'df860',
    series: 'Defender',
    size: '860',
    name: 'Defender 860 (DF860)',
    cat: 'RIB',
    skill: 'professional',
    env: ['sea', 'offshore', 'rescue'],
    water: ['rough', 'extreme'],
    safety: 'high',
    use_case: ['interception', 'rescue', 'military', 'patrol'],
    desc: '8.6m ultimate flagship interceptor with 500 HP twin engines for extreme offshore operations.',
    def: 'An 8.60m heavy interceptor flagship with 5mm aluminum 26° deep V hull, 60cm tubes, twin 250 HP engines (500 HP total), 1.88m ultra-wide deck.',
    problem:
      'Military and special operations need the largest, most powerful Defender for extreme offshore interception, SAR, and tactical operations.',
    howItWorks:
      'The DF860 features a 1.88m ultra-wide interior, 3.10m beam, twin 250 HP engines (500 HP total), flagship commercial console supporting multiple 12-16 inch displays, and dual electric bilge pumps.',
    audience: 'Coast guard, military/police tactical units, and special maritime operations.',
    ai_use_cases: [
      'Offshore special interception',
      'Extreme weather SAR',
      'Military/police tactical operations',
      'Heavy commercial engineering',
    ],
    ai_specs: {
      length: '8.60 m',
      hull: '5mm aluminum 26° offshore deep V',
      tubes: 'ORCA Hypalon 60cm',
      max_engine: '500 HP (twin 2x250 HP)',
      capacity: '18 persons',
      fuel: '285 L (optional dual tank)',
    },
    ai_comparison:
      'The DF860 is the ultimate Defender flagship — 8.6m, 500 HP twin engines, 1.88m ultra-wide deck, flagship console with multiple large displays. Nothing else in the Defender range matches its size and power.',
    ai_faq: [
      {
        q: 'What display sizes can the flagship console accommodate?',
        a: 'The DF860 flagship commercial console supports multiple 12-16 inch chartplotter/radar displays and VHF radio stations.',
      },
      {
        q: 'Is there a heavy-duty T-Top option?',
        a: 'Yes, a heavy-duty T-Top protective canopy / radar and warning light arch is available as optional equipment.',
      },
    ],
  },
  {
    slug: 'ex7',
    series: 'Explorer',
    size: '7',
    name: 'Explorer 7 (EX7)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'medium',
    use_case: ['cruising', 'luxury', 'sightseeing', 'tender'],
    desc: '7m crossover boat with fiberglass hull and raised slim tubes — luxury comfort meets crossover design.',
    def: 'A 6.98m crossover boat with fiberglass deep V hull, 32cm raised slim tubes, 270L fuel, 300 HP, dual sundecks, head in console, T-Top.',
    problem:
      'Buyers want a crossover boat that combines RIB safety with fiberglass luxury and superyacht-tender-level comfort.',
    howItWorks:
      'The EX7 is Inflatable Pool Factory first fiberglass hull boat with raised slim tubes, maximizing interior space while maintaining tube protection. Features dual sundecks, head in console, galley, and T-Top.',
    audience: 'Luxury boat buyers, yacht owners, and resort operators wanting crossover comfort.',
    ai_use_cases: ['Luxury day cruising', 'Yacht tender', 'Coastal sightseeing', 'Resort guest transport'],
    ai_specs: {
      length: '6.98 m',
      hull: 'Fiberglass 20° deep V',
      tubes: '32cm high-mounted slim design',
      max_engine: '300 HP',
      capacity: '8 persons',
      fuel: '270 L built-in',
    },
    ai_comparison:
      'The EX7 is unique in the Inflatable Pool Factory range — fiberglass hull with slim protective tubes rather than full RIB wrapping. Interior space is maximized with 2.00m ultra-wide beam.',
    ai_faq: [
      {
        q: 'Why does the EX7 use a fiberglass hull?',
        a: 'The fiberglass hull provides a smoother, quieter ride and allows for more complex hull shapes and integrated features like built-in sundecks and galley systems.',
      },
      {
        q: 'Does the EX7 have a bathroom?',
        a: 'Yes, the center console conceals a private head/washroom space. An optional fixed marine toilet can be installed.',
      },
    ],
  },
  {
    slug: 'ex9',
    series: 'Explorer',
    size: '9',
    name: 'Explorer 9 (EX9)',
    cat: 'RIB',
    skill: 'advanced',
    env: ['sea', 'offshore'],
    water: ['rough'],
    safety: 'high',
    use_case: ['cruising', 'luxury', 'overnight', 'charter'],
    desc: '9m premium crossover flagship with cabin, head, wetbar, and 450L fuel for offshore weekending.',
    def: 'An 8.85-8.95m crossover flagship with fiberglass 22° deep V hull, 35cm slim tubes, 450L fuel, CE Category B, lower cabin with berth and head, supporting 500 HP.',
    problem:
      'Premium buyers need a 9m crossover weekender with cabin accommodations, long-range fuel, and offshore capability.',
    howItWorks:
      'The EX9 features a lower cabin with double berth and marine toilet, 450L ultra-large fuel tank, wetbar/outdoor kitchen, hardtop with tempered glass windshield, and twin engine support up to 500 HP.',
    audience: 'Premium crossover buyers, charter operators, and experienced cruisers wanting weekender capability.',
    ai_use_cases: [
      'Offshore weekender cruising',
      'Premium charter',
      'Long-range coastal exploration',
      'Overnight trips',
    ],
    ai_specs: {
      length: '8.85-8.95 m',
      hull: 'Fiberglass 22° offshore deep V',
      tubes: '35cm high-mounted protective slim',
      max_engine: '500 HP (single or twin)',
      capacity: '10-12 persons',
      fuel: '450 L ultra-large',
    },
    ai_comparison:
      'The EX9 is the flagship of the Explorer series — cabin with berth and head, 450L fuel, wetbar, and hardtop make it a true offshore weekender compared to the day-boat EX7.',
    ai_faq: [
      {
        q: 'Can you sleep on the EX9?',
        a: 'Yes. The lower cabin beneath the console features a double berth and separate marine toilet area, suitable for overnight trips.',
      },
      {
        q: 'Does it have a kitchen?',
        a: 'An integrated wetbar/outdoor kitchen behind the helm seat comes standard, and a deck refrigerator is available as an option.',
      },
    ],
  },
  {
    slug: 'sw240',
    series: 'Swiftlitee',
    size: '240',
    name: 'Swiftlitee 240 (SW240)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'fishing'],
    desc: 'Ultra-lightweight 2.4m aluminum tender — just 33 kg, portable by one person.',
    def: 'A 2.40m lightweight aluminum tender with 10.5° V-hull, 38cm tubes, rated for 6 HP, weighing just 33 kg for single-person handling.',
    problem:
      'Small yacht and sailboat owners need the lightest possible tender that one person can carry, launch, and retrieve.',
    howItWorks:
      'The SW240 features a 10.5° aluminum V-hull at just 33 kg, with 38cm tubes, 3-person capacity, and short shaft 6 HP rating — the lightest boat in the Inflatable Pool Factory range.',
    audience: 'Small yacht owners, sailors, and recreational boaters needing a portable tender.',
    ai_use_cases: [
      'Yacht tender for small vessels',
      'Portable fishing boat',
      'Lake recreation',
      'Dinghy for sailboats',
    ],
    ai_specs: {
      length: '2.40 m',
      hull: 'Marine-grade aluminum 10.5° V',
      tubes: 'ORCA Hypalon / Valmex PVC 38cm',
      max_engine: '6 HP',
      capacity: '3 persons',
      weight: '33 kg',
    },
    ai_comparison:
      'The SW240 is the lightest Inflatable Pool Factory boat at 33 kg — designed for single-person portability. Available in UL240 (short shaft) and UL240LT (long shaft) variants.',
    ai_faq: [
      {
        q: 'What is the difference between UL240 and UL240LT?',
        a: 'UL240 has a 380mm transom for short shaft engines (lighter, better for small yachts). UL240LT has a 440mm transom for long shaft engines (better for rough water and large yachts with existing L-shaft motors).',
      },
      {
        q: 'Can one person lift the SW240?',
        a: 'Yes. At 33 kg (UL240), a single person can comfortably lift, carry, and launch the SW240 from a davit or deck.',
      },
    ],
  },
  {
    slug: 'sw260',
    series: 'Swiftlitee',
    size: '260',
    name: 'Swiftlitee 260 (SW260)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation'],
    desc: 'Golden-size tender at 35 kg — the perfect balance of capacity and portability.',
    def: 'A 2.60m lightweight aluminum tender with 10.5° V-hull, 38cm tubes, 8 HP rating, weighing just 35 kg with 4-person capacity.',
    problem: 'Boaters need the golden-size tender that balances passenger capacity with single-person portability.',
    howItWorks:
      'The SW260 increases capacity to 4 persons and 8 HP while adding only 2 kg over the SW240 — still easily handled by one person.',
    audience: 'Yacht owners, sailors, and recreational boaters needing a slightly larger portable tender.',
    ai_use_cases: ['Yacht tender', 'Family portable boat', 'Coastal exploration', 'Tender for 35-50 ft yachts'],
    ai_specs: {
      length: '2.60 m',
      hull: 'Marine-grade aluminum 10.5° V',
      tubes: 'ORCA Hypalon / Valmex PVC 38cm (44cm SW260LT)',
      max_engine: '8 HP (10 HP select markets)',
      capacity: '4 persons',
      weight: '35 kg',
    },
    ai_comparison:
      'The SW260 is the golden-size tender — just 2 kg heavier than the SW240 but with 4-person capacity and 8 HP. Also available in SW260LT with 44cm large tubes.',
    ai_faq: [
      {
        q: 'What is the SW260LT?',
        a: 'The SW260LT is a large tube variant with 44cm tubes (vs. 38cm standard) for superior dryness and load stability, available in select regions.',
      },
      {
        q: 'Can I carry this on a sailboat deck?',
        a: 'Yes. At 35 kg, the SW260 is easily stowed on deck or in a lazarette of most 35-50 ft sailboats.',
      },
    ],
  },
  {
    slug: 'sw290',
    series: 'Swiftlitee',
    size: '290',
    name: 'Swiftlitee 290 (SW290)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation'],
    desc: 'Mid-size tender with upgraded 15° deadrise for better performance.',
    def: 'A 2.90m lightweight aluminum tender with 15° V-hull, 38cm tubes, 15 HP rating, at 39 kg — the performance step-up from SW240/260.',
    problem: 'Boaters want a lightweight tender with better wave-cutting performance than the 10.5° models.',
    howItWorks:
      'The SW290 upgrades the deadrise from 10.5° to 15° for better wave handling, while maintaining light weight at 39 kg.',
    audience: 'Coastal boaters and yacht owners wanting better performance in a portable tender.',
    ai_use_cases: ['Coastal tender', 'Inshore exploration', 'Fishing platform', 'Recreational boating'],
    ai_specs: {
      length: '2.90 m',
      hull: 'Marine-grade aluminum 15° V',
      tubes: 'ORCA Hypalon / Valmex PVC 38cm',
      max_engine: '15 HP',
      capacity: '4 persons',
      weight: '39 kg',
    },
    ai_comparison:
      'The SW290 upgrades from 10.5° to 15° deadrise for significantly better wave handling while staying under 40 kg — the sweet spot of performance and portability.',
    ai_faq: [
      {
        q: 'Why does the SW290 have a 15° hull?',
        a: 'The 15° deadrise provides noticeably better wave-cutting and smoother ride compared to the 10.5° of the SW240/SW260, especially in choppy conditions.',
      },
      {
        q: 'Is it still portable by one person?',
        a: 'At 39 kg, the SW290 is still manageable for one person, though slightly heavier than the SW240/SW260.',
      },
    ],
  },
  {
    slug: 'sw310',
    series: 'Swiftlitee',
    size: '310',
    name: 'Swiftlitee 310 (SW310)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'fishing'],
    desc: 'Expanded tender with 44cm tubes and 5-person capacity for confident shoreline exploration.',
    def: 'A 3.13m lightweight aluminum tender with 15° V-hull, 44cm tubes, 15 HP rating, 5-person capacity at 50 kg.',
    problem: 'Boaters need a lightweight tender with larger tubes and more capacity for confident coastal exploration.',
    howItWorks:
      'The SW310 upgrades to 44cm larger tubes and 5-person capacity while maintaining the 15° deadrise, giving users confidence to explore further shorelines.',
    audience: 'Coastal explorers, yacht owners, and recreational boaters wanting more capacity.',
    ai_use_cases: ['Coastal exploration', 'Family tender', 'Fishing platform', 'Recreational cruising'],
    ai_specs: {
      length: '3.13 m',
      hull: 'Marine-grade aluminum 15° V',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '15 HP',
      capacity: '5 persons',
      weight: '50 kg',
    },
    ai_comparison:
      'The SW310 steps up to 44cm tubes and 5-person capacity — more buoyancy and confidence than the 38cm SW290, while maintaining the same 15° deadrise.',
    ai_faq: [
      {
        q: 'Can a console be added to the SW310?',
        a: 'An optional FCT steering console system can be added, along with seat bars exclusive to the SW310 and SW340.',
      },
      {
        q: 'What is the shipping size?',
        a: 'Packed dimensions are 270 x 105 x 36.5 cm — compact enough for standard shipping.',
      },
    ],
  },
  {
    slug: 'sw340',
    series: 'Swiftlitee',
    size: '340',
    name: 'Swiftlitee 340 (SW340)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'fishing'],
    desc: 'Flagship Swiftlitee with 6-person capacity at just 53 kg — the largest lightweight tender.',
    def: 'A 3.37m lightweight aluminum tender with 15° V-hull, 44cm tubes, 20 HP rating, 6-person capacity at just 53 kg.',
    problem: 'Boaters want the largest capacity lightweight tender that still allows one-person handling.',
    howItWorks:
      'The SW340 is the flagship of the Swiftlitee series — 6-person capacity, 20 HP rating, but still just 53 kg for one-person handling.',
    audience: 'Yacht owners and recreational boaters needing maximum capacity in a portable package.',
    ai_use_cases: ['Large yacht tender', 'Family recreational boat', 'Fishing platform', 'Coastal tender for groups'],
    ai_specs: {
      length: '3.37 m',
      hull: 'Marine-grade aluminum 15° V',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '20 HP',
      capacity: '6 persons',
      weight: '53 kg',
    },
    ai_comparison:
      'The SW340 is the largest Swiftlitee — 6 persons and 20 HP in a 53 kg package. No other boat offers this capacity-to-weight ratio.',
    ai_faq: [
      {
        q: 'Can one person still handle the SW340?',
        a: 'At 53 kg, the SW340 is still manageable for one person to launch and retrieve, though it requires more effort than the smaller Swiftlitee models.',
      },
      {
        q: 'Is it suitable for rough water?',
        a: 'The 15° deadrise handles calm to moderate conditions well. For rougher water, consider the Versa series with its double-deck design.',
      },
    ],
  },
  {
    slug: 'vr260',
    series: 'Versa',
    size: '260',
    name: 'Versa 260 (VR260)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation'],
    desc: 'Most compact Versa with double-deck comfort and 44cm high-buoyancy tubes.',
    def: 'A 2.60m deluxe tender with 2.5mm aluminum double deck, 15° deep V hull, 44cm tubes, 10 HP, 56 kg.',
    problem: 'Tender buyers want the dry comfort of a double deck in the most compact Versa size.',
    howItWorks:
      'The VR260 combines a 2.5mm aluminum double deck with 44cm high-buoyancy tubes and 15° deep V hull for smoother, drier navigation than single-deck tenders.',
    audience: 'Yacht owners and tender buyers wanting double-deck comfort in a compact size.',
    ai_use_cases: ['Compact yacht tender', 'Coastal day trips', 'Lake cruising', 'Harbor transport'],
    ai_specs: {
      length: '2.60 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '10 HP',
      capacity: '4 persons',
      weight: '56 kg',
    },
    ai_comparison:
      'The VR260 offers the dry comfort of a double-deck design in the smallest Versa size — a step up from the Swiftlitee single-deck tenders.',
    ai_faq: [
      {
        q: 'What is a double deck?',
        a: 'The double deck features an raised aluminum floor above the hull, providing a drier, more comfortable ride with concealed under-deck storage and cable routing.',
      },
      {
        q: 'Does the VR260 have a bow locker?',
        a: 'Yes, the bow locker holds a 12L external fuel tank, keeping fuel lines routed under the double deck.',
      },
    ],
  },
  {
    slug: 'vr290',
    series: 'Versa',
    size: '290',
    name: 'Versa 290 (VR290)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation'],
    desc: 'Sweet-spot luxury tender with double deck and 44cm tubes.',
    def: 'A 2.90m deluxe tender with 2.5mm aluminum double deck, 15° deep V hull, 44cm tubes, 15 HP, 61 kg.',
    problem: 'Tender buyers want the most popular Versa size — the sweet spot of capacity, comfort, and handling.',
    howItWorks:
      'The VR290 is the highly popular sweet-spot sized luxury tender with double deck, bow locker for 12L/24L fuel, and 44cm high-buoyancy tubes.',
    audience: 'Yacht owners wanting the ideal balance of tender size and luxury features.',
    ai_use_cases: ['Luxury yacht tender', 'Coastal day trips', 'Harbor shuttle', 'Recreational cruising'],
    ai_specs: {
      length: '2.90 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '15 HP',
      capacity: '4 persons',
      weight: '61 kg',
    },
    ai_comparison:
      'The VR290 is the most popular Versa model — the sweet spot of size, comfort, and portability with the double-deck advantage.',
    ai_faq: [
      {
        q: 'What fuel tank does the bow locker hold?',
        a: 'The bow locker accommodates a 12L or 24L portable external fuel tank, keeping fuel lines concealed under the double deck.',
      },
      {
        q: 'Is a bow locker cushion available?',
        a: 'Yes, a bow locker cushion is available as an optional accessory for comfortable seating on the bow locker.',
      },
    ],
  },
  {
    slug: 'vr310',
    series: 'Versa',
    size: '310',
    name: 'Versa 310 (VR310)',
    cat: 'RIB',
    skill: 'beginner',
    env: ['coastal', 'lake'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation'],
    desc: 'Milestone Versa model with console-compatible double deck and 5-person capacity.',
    def: 'A 3.10m deluxe tender with double-deck design, 15° deep V hull, 44cm tubes, 20 HP, console-compatible, 5 persons.',
    problem: 'Boaters want a Versa tender that can accommodate an optional steering console for enhanced control.',
    howItWorks:
      'The VR310 adds console compatibility to the Versa double-deck platform, supporting the optional FCT steering console system.',
    audience: 'Boaters wanting a tender that can grow from tiller to console steering.',
    ai_use_cases: ['Console-compatible tender', 'Family day boat', 'Fishing platform', 'Coastal cruising'],
    ai_specs: {
      length: '3.10 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '20 HP',
      capacity: '5 persons',
      weight: '65 kg',
    },
    ai_comparison:
      'The VR310 is the first Versa model with console compatibility — start with tiller and upgrade to FCT console steering when ready.',
    ai_faq: [
      {
        q: 'What console options are available?',
        a: 'The VR310 supports the optional FCT steering console system with helm seat cushion kit.',
      },
      {
        q: 'Can the console be added later?',
        a: 'Yes. The VR310 is designed for easy console retrofits — the double-deck design includes internal cable channels for steering and electrical routing.',
      },
    ],
  },
  {
    slug: 'vr340',
    series: 'Versa',
    size: '340',
    name: 'Versa 340 (VR340)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'cruising'],
    desc: 'Primary tender with excellent spatial capacity and console-compatible deck.',
    def: 'A 3.40m deluxe tender with double-deck design, 15° deep V hull, 44cm tubes, 25 HP, console-compatible, 6 persons.',
    problem: 'Yacht owners need a primary tender with spacious deck, console compatibility, and seating comfort.',
    howItWorks:
      'The VR340 is the mid-to-large flagship primary tender in the Versa series, with console-compatible deck, large bow locker, and 6-person capacity.',
    audience: 'Yacht owners wanting a premium primary tender with console option.',
    ai_use_cases: ['Primary yacht tender', 'Family cruising', 'Fishing platform', 'Coastal exploration'],
    ai_specs: {
      length: '3.40 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '25 HP',
      capacity: '6 persons',
      weight: '71 kg',
    },
    ai_comparison:
      'The VR340 is the flagship primary tender — 6 persons, 25 HP, console-compatible, with the largest bow locker in the Versa range.',
    ai_faq: [
      {
        q: 'What console fits the VR340?',
        a: 'The optional FCT steering console system is perfectly supported, providing full helm control with steering wheel and instrument panel.',
      },
      {
        q: 'How much fuel can the bow locker hold?',
        a: 'The large bow locker securely holds a 24L portable fuel tank along with anchor chain gear.',
      },
    ],
  },
  {
    slug: 'vr360',
    series: 'Versa',
    size: '360',
    name: 'Versa 360 (VR360)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['calm', 'slight chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'cruising'],
    desc: 'High-performance luxury tender stepping into the 30 HP class with console options.',
    def: 'A 3.60m deluxe tender with 15° deep V hull, 44cm tubes, 30 HP, console-compatible, 6 persons, 76 kg.',
    problem: 'Boaters need a 3.6m tender with 30 HP capability and console options for enhanced performance.',
    howItWorks:
      'The VR360 steps into the 30 HP class with the same double-deck comfort and console compatibility, providing more power for faster planing.',
    audience: 'Performance-oriented tender buyers and yacht owners wanting faster transit times.',
    ai_use_cases: ['Performance tender', 'Faster yacht transfers', 'Coastal cruising', 'Console RIB'],
    ai_specs: {
      length: '3.60 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '30 HP',
      capacity: '6 persons',
      weight: '76 kg',
    },
    ai_comparison:
      'The VR360 adds 30 HP capability to the Versa double-deck platform — faster planing and better performance than the 25 HP VR340.',
    ai_faq: [
      {
        q: 'What console options are available?',
        a: 'The VR360 supports the optional FCT steering console system for full helm control.',
      },
      {
        q: 'Is 30 HP enough for planing?',
        a: 'Yes. With 30 HP and moderate load, the VR360 planes easily, providing fast and comfortable transit between yacht and shore.',
      },
    ],
  },
  {
    slug: 'vr380',
    series: 'Versa',
    size: '380',
    name: 'Versa 380 (VR380)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'medium',
    use_case: ['tender', 'recreation', 'cruising'],
    desc: 'Mid-to-large luxury tender with three console options for large yachts and catamarans.',
    def: 'A 3.80m deluxe tender with 15° deep V hull, 44cm tubes, 30 HP, three console options (Open/FCT8/GT), 7 persons.',
    problem:
      'Large yacht and catamaran owners need a tender with multiple console setup options to match their specific needs.',
    howItWorks:
      'The VR380 offers three configurations: Open (standard tiller), FCT8 console (optional), and GT luxury console (optional) — the most versatile Versa model.',
    audience: 'Large yacht and catamaran owners wanting a customizable tender with console options.',
    ai_use_cases: ['Large yacht tender', 'Catamaran tender', 'Luxury guest transport', 'Customizable console RIB'],
    ai_specs: {
      length: '3.80 m',
      hull: '2.5mm aluminum 15° deep V double deck',
      tubes: 'ORCA Hypalon / Valmex PVC 44cm',
      max_engine: '30 HP',
      capacity: '7 persons',
      weight: '83 kg',
    },
    ai_comparison:
      'The VR380 is the most versatile Versa — three console options (Open, FCT8, GT) and 7-person capacity make it ideal for large yachts and catamarans.',
    ai_faq: [
      {
        q: 'What are the three console options?',
        a: 'Open (standard tiller with bench seat), FCT8 (steering console with helm seat), and GT (luxury console with higher-end seating and storage).',
      },
      {
        q: 'Is the VR380 suitable for catamarans?',
        a: 'Yes. The VR380 is specifically designed for large cruising yachts and catamarans, with console options and 7-person capacity for guest transfers.',
      },
    ],
  },
  {
    slug: 'vr400',
    series: 'Versa',
    size: '400',
    name: 'Versa 400 (VR400)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'medium',
    use_case: ['tender', 'cruising', 'dayboat'],
    desc: 'Crossover flagship with 20° deep V hull and 50 HP for mid-size console cruiser capability.',
    def: 'A 3.96m crossover flagship tender with 20° deep V hull, 47cm tubes, 50 HP long shaft, wider double deck, 8 persons.',
    problem: 'Boaters want a Versa that crosses into console cruiser territory with 50 HP and enhanced wave-cutting.',
    howItWorks:
      'The VR400 upgrades to 20° deep V, 47cm tubes, and 50 HP long shaft — a significant jump in performance and sea-keeping from the 15° smaller Versa models.',
    audience: 'Boaters wanting a crossover from tender to console cruiser with 50 HP performance.',
    ai_use_cases: ['Crossover tender/cruiser', 'Family day boat', 'Coastal cruising', 'Console RIB'],
    ai_specs: {
      length: '3.96 m',
      hull: '3-4mm aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '50 HP',
      capacity: '8 persons',
      weight: '147 kg',
    },
    ai_comparison:
      'The VR400 is the crossover flagship — 20° deep V and 50 HP make it a completely different class of boat from the 15°/30HP smaller Versa models.',
    ai_faq: [
      {
        q: 'Why does the VR400 weigh 147 kg vs 83 kg for the VR380?',
        a: 'The VR400 uses a thicker 3-4mm hull with 20° deadrise, 47cm tubes, and reinforced transom for 50 HP — significantly more structure than the 15°/30HP VR380.',
      },
      {
        q: 'What console options fit?',
        a: 'FCT, GT, or Deluxe center console and driver seat kits are available as options.',
      },
    ],
  },
  {
    slug: 'vr420',
    series: 'Versa',
    size: '420',
    name: 'Versa 420 (VR420)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'cruising', 'dayboat'],
    desc: 'Mid-to-large luxury console cruiser with 60 HP and 800 kg payload.',
    def: 'A 4.20m deluxe tender with 20° deep V hull, 47cm tubes, 60 HP, 800 kg max load, concealed cable channels, 8 persons.',
    problem: 'Boaters need a 4.2m console cruiser with 60 HP, large payload, and professional deck layout.',
    howItWorks:
      'The VR420 features 4mm aluminum hull, 60 HP long shaft rating, 800 kg max load, 4 air chambers, and internal cable channels for console rigging.',
    audience: 'Boaters wanting a 4m+ console cruiser with serious payload capability.',
    ai_use_cases: ['Luxury console cruiser', 'Heavy-duty tender', 'Day boat', 'Commercial light transport'],
    ai_specs: {
      length: '4.20 m',
      hull: '4mm aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '60 HP',
      capacity: '8 persons',
      weight: '185 kg',
    },
    ai_comparison:
      'The VR420 adds 60 HP and 800 kg payload to the VR400 platform — more power and capacity for serious tender and cruiser use.',
    ai_faq: [
      {
        q: 'Can the VR420 handle rough water?',
        a: 'The 20° deep V hull provides excellent wave-cutting and sea-keeping for inshore and coastal conditions up to Category C.',
      },
      {
        q: 'What is the bow locker capacity?',
        a: 'The large bow locker accommodates an integrated fuel tank, 24L portable fuel tank, and anchor chain gear.',
      },
    ],
  },
  {
    slug: 'vr460',
    series: 'Versa',
    size: '460',
    name: 'Versa 460 (VR460)',
    cat: 'RIB',
    skill: 'intermediate',
    env: ['coastal', 'sea'],
    water: ['moderate chop'],
    safety: 'high',
    use_case: ['tender', 'cruising', 'dayboat'],
    desc: 'Largest Versa flagship with 70 HP, 920 kg payload, and 4mm reinforced aluminum hull.',
    def: 'A 4.60m flagship deluxe RIB with 4mm reinforced aluminum 20° deep V hull, 47cm tubes, 70 HP, 920 kg max load, 9 persons.',
    problem: 'Boaters want the maximum Versa platform — the largest payload and power in the series.',
    howItWorks:
      'The VR460 is the flagship Versa — 4mm reinforced hull, 70 HP, 920 kg payload, 9-person capacity, and extra-large bow locker for the ultimate tender/cruiser.',
    audience: 'Boaters wanting the largest, most capable Versa tender with maximum power and payload.',
    ai_use_cases: ['Flagship luxury tender', 'Day cruiser', 'Heavy-capacity tender', 'Commercial light duty'],
    ai_specs: {
      length: '4.60 m',
      hull: '4mm reinforced aluminum 20° deep V',
      tubes: 'ORCA Hypalon / Valmex PVC 47cm',
      max_engine: '70 HP',
      capacity: '9 persons',
      weight: '215 kg',
    },
    ai_comparison:
      'The VR460 is the ultimate Versa — 70 HP, 920 kg payload, and 9-person capacity make it the most capable tender in the Versa range.',
    ai_faq: [
      {
        q: 'Is the VR460 the largest Versa?',
        a: 'Yes. The VR460 is the flagship model — the largest dimensions, most powerful engine rating, and highest payload in the Versa series.',
      },
      {
        q: 'What optional equipment is available?',
        a: 'FCT/GT/Deluxe console kits, FRP bow step and cleat, rollbar/tow post, transom box, and boat cover are all available options.',
      },
    ],
  },
];

const records = slugs.map((s) => ({
  id: s.slug,
  name: s.name,
  category: s.cat,
  region: ['EU', 'US', 'ASIA'],
  skill: s.skill,
  environment: s.env,
  water_condition: s.water,
  safety_level: s.safety,
  use_case: s.use_case,
  safety_rules: ['life vest required for all occupants', 'check weather before departure'],
  desc: s.desc,
  definition: s.def,
  problem: s.problem,
  howItWorks: s.howItWorks,
  audience: s.audience,
  best_for_business: s.slug.startsWith('df')
    ? ['clubs']
    : s.slug.startsWith('ex')
      ? ['resorts']
      : s.slug.startsWith('sw')
        ? ['resorts', 'entrepreneurs']
        : ['clubs', 'resorts'],
  business_recommendation: s.desc,
  ai_use_cases: s.ai_use_cases,
  ai_specs: s.ai_specs,
  ai_comparison: s.ai_comparison,
  ai_faq: s.ai_faq,
}));

const businessData = {};
slugs.forEach((s) => {
  const bestFor = s.slug.startsWith('df')
    ? ['clubs']
    : s.slug.startsWith('ex')
      ? ['resorts']
      : s.slug.startsWith('sw')
        ? ['resorts', 'entrepreneurs']
        : ['clubs', 'resorts'];

  let useCase;
  let operatingCost;
  let whyChoose;
  let lifespan;

  if (s.slug.startsWith('ap')) {
    useCase = 'Luxury tender, day cruising, watersports';
    operatingCost = 'Moderate — annual hull maintenance, engine servicing, tube cleaning';
    whyChoose = `The ${s.name} delivers premium luxury finish with aluminum durability — a step above standard tenders with integrated console, EVA deck, and built-in fuel tank.`;
    lifespan = '10-15 years with proper maintenance';
  } else if (s.slug.startsWith('df')) {
    useCase = 'Patrol, SAR, commercial operations, dive support';
    operatingCost =
      'Low-moderate — commercial-duty components designed for daily operation, minimal cosmetic maintenance';
    whyChoose = `The ${s.name} is built for professional duty cycles — heavy-duty protection, commercial paint, and reinforced structure withstand daily commercial use.`;
    lifespan = '10-20 years in commercial service';
  } else if (s.slug.startsWith('ex')) {
    useCase = 'Luxury cruising, charter, overnight trips, guest transport';
    operatingCost = 'Moderate — fiberglass hull maintenance, premium system upkeep, annual anti-fouling';
    whyChoose = `The ${s.name} offers superyacht-tender-level comfort in a crossover platform — cabin, wetbar, and dual sundecks set it apart from any RIB.`;
    lifespan = '10-15 years with proper care';
  } else if (s.slug.startsWith('sw')) {
    useCase = 'Yacht tender, portable recreation, fishing';
    operatingCost = 'Very low — minimal maintenance, no fuel system (portable tank), easy hull cleaning';
    whyChoose = `The ${s.name} is the lightest boat in the Inflatable Pool Factory range — one-person portable with aluminum durability at minimal operating cost.`;
    lifespan = '8-12 years with proper care';
  } else {
    useCase = 'Yacht tender, day cruising, console RIB';
    operatingCost = 'Low — double-deck design protects hull, standard components, easy maintenance';
    whyChoose = `The ${s.name} offers the dry comfort of a double-deck design with console upgrade options — more comfort and versatility than single-deck tenders.`;
    lifespan = '10-15 years with proper maintenance';
  }

  businessData[s.slug] = {
    bestFor,
    recommendation: s.desc,
    useCase,
    operatingCost,
    whyBusinessesChooseIt: whyChoose,
    lifespan,
  };
});

// Output as JSON for manual insertion
console.log('=== ProductRecord entries ===');
console.log(JSON.stringify(records, null, 2));
console.log('\n=== BusinessProductInfo entries ===');
console.log(JSON.stringify(businessData, null, 2));
