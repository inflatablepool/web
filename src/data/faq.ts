export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  category:
    | 'product'
    | 'shipping'
    | 'safety'
    | 'maintenance'
    | 'general'
    | 'ordering'
    | 'warranty'
    | 'sourcing';
  relatedProducts: string[];
  relatedGuides: string[];
}

export const faqs: FaqRecord[] = [
  {
    id: 'pool-setup-time',
    question: 'How long does it take to set up an inflatable pool?',
    answer:
      'Inflating takes 5–15 minutes with the included electric pump depending on the model; full setup — positioning, inflating to the rated pressure, and connecting the filter pump — typically takes 15–30 minutes. Filling with water takes additional time depending on pool size and your water source. Rectangular pools take slightly longer than round models due to their larger footprint.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'drop-stitch-walls',
    question: 'What is a drop stitch pool?',
    answer:
      'Drop stitch construction connects the top and bottom layers of fabric with thousands of internal threads. When inflated, these threads lock the walls rigid like a hard-sided pool, so the pool keeps its shape at full water pressure while still folding away for storage.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-water-capacity',
    question: 'How much water does an inflatable pool hold?',
    answer:
      'It depends on the model and fill level. Our round pools typically hold 1,500–5,000 liters at 80% fill; rectangular pools hold more. Always place the pool on ground that can support the combined weight of pool plus water before filling.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-ground-prep',
    question: 'What surface should I place the pool on?',
    answer:
      'Set the pool on firm, level ground free of stones, sticks, and sharp objects. A concrete pad, patio, or level lawn works well. We recommend a ground sheet underneath for extra protection. Never place the pool on sloped or soft ground.',
    category: 'safety',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-filtration',
    question: 'Do I need a filter pump?',
    answer:
      'A cartridge filter pump keeps water clean and greatly extends the time between water changes. Inflatable Pool Factory pools have standard hose fittings that accept common 32mm or 38mm filter pumps, available separately or bundled with your order.',
    category: 'maintenance',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-water-treatment',
    question: 'How do I keep the water clean?',
    answer:
      'Use standard pool chemicals: chlorine or bromine tablets in a floating dispenser, plus regular pH checks (target 7.2–7.6). Run the filter pump daily, skim debris, and cover the pool when not in use. How long water lasts before changing depends on pool size, bather load, temperature, and filtration capacity — always follow the chemical product label and test the water regularly rather than relying on a fixed schedule.',
    category: 'maintenance',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-repair',
    question: 'How do I repair a puncture?',
    answer:
      'Find the leak with soapy water, clean and dry the area, then apply a PVC patch with rounded corners from the included repair kit. Press firmly and wait 24 hours before reinflating. Small punctures are rare and typically take minutes to fix.',
    category: 'maintenance',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-storage',
    question: 'How do I store the pool for winter?',
    answer:
      'Drain the pool, clean it with mild soap, rinse thoroughly, and dry completely in the shade. Deflate, fold loosely, and store in the carry bag in a cool, dry place away from direct sunlight and freezing temperatures.',
    category: 'maintenance',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-kids-safety',
    question: 'Are inflatable pools safe for children?',
    answer:
      'Yes — with active adult supervision at all times. Children must never be left unattended in or near any pool, even shallow ones. Empty small pools after use, secure larger pools with a cover or ladder removal, and check local fencing regulations for pools above certain depths.',
    category: 'safety',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-size-choice',
    question: 'What pool size should I choose?',
    answer:
      'Round pools suit families and casual swimming in smaller yards. Rectangular pools fit lap swimming and larger groups. Allow at least 1 meter of clear space around the pool, and check your available ground area against the pool dimensions before ordering.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-with-cover',
    question: 'Do pools come with a cover?',
    answer:
      'Our round grey pool ships with a fitted debris cover included. Covers for other models are available as accessories. A cover keeps out leaves and insects, reduces evaporation, and helps maintain water temperature.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-lifespan',
    question: 'How long does an inflatable pool last?',
    answer:
      'With proper care, an Inflatable Pool Factory drop stitch pool can provide seasons of reliable use — the exact lifespan depends on climate, UV exposure, water chemistry, and storage conditions. The UV-resistant, puncture-resistant PVC is built for repeated setup, takedown, and storage. Key factors are clean water chemistry, careful ground prep, and dry storage.',
    category: 'product',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-shipping',
    question: 'How long does shipping take?',
    answer:
      'Dispatch timing for in-stock orders is confirmed with your order confirmation. Delivery time depends on destination and order size — contact us at info@inflatablepoolfactory.com with your location and quantity for an accurate estimate.',
    category: 'shipping',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-pricing',
    question: 'How much do Inflatable Pool Factory pools cost?',
    answer:
      'Each product page shows the current price with a Buy Now button, so you can order directly online with secure Stripe checkout. Wholesale pricing is available for bulk orders — contact info@inflatablepoolfactory.com for details.',
    category: 'ordering',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-oem',
    question: 'Do you offer OEM/ODM services?',
    answer:
      'Yes. We review custom sizes, colors, logos, covers, and packaging for businesses. Custom configurations, design scope, design ownership, MOQ and sample terms are confirmed per project before quoting.',
    category: 'ordering',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-warranty',
    question: 'What is the Inflatable Pool Factory warranty?',
    answer:
      'Inflatable Pool Factory pools carry a 2-year limited manufacturer warranty covering defects in materials and workmanship under normal use. The warranty covers drop stitch fabric, seams, and valves; it excludes improper use, unauthorized modifications, and normal wear. Contact info@inflatablepoolfactory.com with your order details to start a claim.',
    category: 'warranty',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'pool-vs-steel',
    question: 'Inflatable pool or steel-frame pool?',
    answer:
      'Inflatable drop stitch pools are faster to set up, easier to store, softer against the body, and need no tools or metal frames. Steel-frame pools can look more permanent but rust, require more assembly, and are harder to store. For most backyards, inflatable is the practical choice.',
    category: 'general',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'company-model',
    question: 'Is Inflatable Pool Factory a trading company or a manufacturer?',
    answer:
      'Inflatable Pool Factory is a brand company with its own manufacturing base in Qingdao. We manufacture pools at our facility and quote factory-direct, FOB Qingdao. Export logistics are managed from our factory to your warehouse or port.',
    category: 'ordering',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-moq',
    question: 'How do I confirm MOQ for wholesale and OEM orders?',
    answer:
      'MOQ depends on the product, customization, packaging and order volume. Share your target quantity and market; we confirm the applicable MOQ, sample terms and quantity pricing in the quotation.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-sample-policy',
    question: 'Can I order a sample before committing to production?',
    answer:
      'Sample requirements are confirmed per project. Where a sample stage applies, it is checked against the agreed specification for approval before any volume order is released. The sample stage verifies print quality, color accuracy, dimensions and packaging fit against your specification.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-incoterms',
    question: 'What Incoterms do you quote?',
    answer:
      'Standard quotations are FOB Qingdao in USD — the price covers the goods, export packing and delivery onto your forwarder\u2019s vessel at Qingdao port. Ocean freight, insurance, duty and destination charges are arranged by the buyer.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-factory-location',
    question: 'Where is the Inflatable Pool Factory production facility located?',
    answer:
      'Our production facility is in Qingdao, China — one of the world\u2019s largest hubs for inflatable and water-sports manufacturing. Buyers are welcome to audit the factory in person or join a live video walkthrough of the production and inspection areas.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-custom-packaging',
    question: 'Can you produce custom retail packaging?',
    answer:
      'Yes. We manufacture printed cartons, color boxes and mailer packaging sized for garden-retail shelves or e-commerce parcel networks, plus manuals and hang tags under your brand. Packed weight and carton dimensions are tuned to your logistics.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-material-compliance',
    question: 'What material compliance documents do you provide?',
    answer:
      'Our pools use UV-resistant, double-layer drop-stitch PVC. Material specifications and available compliance documents are reviewed against the target market and confirmed for wholesale and OEM projects.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
  {
    id: 'sourcing-third-party-inspection',
    question: 'Can we appoint a third-party inspector?',
    answer:
      'Yes. Third-party inspection (SGS, Bureau Veritas, TÜV, QIMA and similar) is welcome on any order — during production, at the pressure and leak-test stage, or before container loading.',
    category: 'sourcing',
    relatedProducts: [],
    relatedGuides: [],
  },
];
