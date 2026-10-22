"""Append YAML fields to language-specific YAML files with proper UTF-8 encoding."""
import os
import sys

PAGES_DIR = r'C:\official\src\data\pages'
LANGS = ['ar','da','de','el','es','fi','fr','it','nl','no','pl','pt','ru','sv']

# Academy fields (added to {lang}/academy.yaml)
ACADEMY_FIELDS = """\nknowledge_center_tagline: 'Knowledge Center'
knowledge_center_title: 'Marine Equipment & Industry Guides'
knowledge_center_subtitle: 'Expert knowledge and buying guides for marine professionals, fleet operators, and water sports enthusiasts.'

knowledge_sections:
  - title: 'RIB Boat Knowledge'
    tagline: 'Rigid Inflatable Boat Guides'
    desc: 'Everything about RIB boats — hull design, materials, engine selection, maintenance, and buying advice for commercial and recreational use.'
    guides:
      - title: 'How to Choose the Right RIB Boat'
        desc: 'Complete guide to selecting a RIB — size, engine power, tube material, hull type, and intended use.'
        href: '/guides/rib-buying-guide'
      - title: 'RIB vs Inflatable Boat'
        desc: 'Rigid inflatable boat vs traditional inflatable dinghy — hull design, performance, durability, and capacity compared.'
        href: '/compare/rib-vs-dinghy'
      - title: 'Commercial RIB vs Recreational RIB'
        desc: 'Commercial-grade vs recreational RIB boats — construction standards, materials, lifespan, cost, and certifications.'
        href: '/compare/commercial-vs-recreational-rib'
      - title: 'Aluminum vs Fiberglass Hull'
        desc: 'Compare aluminum and fiberglass hulls for RIB boats across weight, cost, durability, and corrosion resistance.'
        href: '/compare/aluminum-vs-fiberglass'
  - title: 'Inflatable Boat Guide'
    tagline: 'Inflatable Watercraft Knowledge'
    desc: 'Comprehensive guides on inflatable boats — PVC vs Hypalon, construction methods, safety standards, and maintenance best practices.'
    guides:
      - title: 'PVC vs Hypalon Material Guide'
        desc: 'Definitive comparison between PVC and Hypalon CSM for inflatable boat construction.'
        href: '/compare/pvc-vs-hypalon'
      - title: 'How Inflatable Boats Are Made'
        desc: 'Manufacturing process — material cutting, HF welding, seam construction, pressure testing, and quality control.'
        href: '/learn/inflatable-technology'
      - title: 'Inflatable Boat Safety Guide'
        desc: 'Safety standards, load capacity, proper inflation, pre-departure checks, and emergency procedures.'
        href: '/learn/water-safety'
      - title: 'Inflatable Boat Maintenance'
        desc: 'Cleaning, storage, UV protection, winterization, and repair of inflatable boats and RIBs.'
        href: '/guides/maintenance-guide'
  - title: 'Boat Knowledge'
    tagline: 'Inflatable Boat & RIB Hub'
    desc: 'Technical guides covering inflatable boat types, materials, construction methods, maintenance, and safety — from dinghies to RIBs.'
    guides:
      - title: 'Inflatable Boat Types'
        desc: 'Dinghies, RIBs, kayaks, and tenders — learn the differences and choose the right one.'
        href: '/v2/inflatable-boat-types'
      - title: 'Drop-Stitch Technology'
        desc: 'How thousands of internal threads create rigid, high-pressure inflatable structures.'
        href: '/learn/drop-stitch-core'
      - title: 'Materials Reference'
        desc: 'PVC denier ratings, fabric weights, UV resistance, and marine-grade materials explained.'
        href: '/learn/materials'
      - title: 'RIB vs Dinghy'
        desc: 'Compare rigid inflatable boats with traditional inflatable dinghies for different use cases.'
        href: '/v2/rib-vs-dinghy'
  - title: 'SUP Knowledge'
    tagline: 'Stand-Up Paddleboard Guides'
    desc: 'Everything about SUP boards — inflatable vs rigid, board dimensions, material technology, and expert advice for all skill levels.'
    guides:
      - title: 'Inflatable vs Hard SUP'
        desc: 'Compare iSUPs and hard epoxy boards across portability, durability, performance, and value.'
        href: '/learn/sup'
      - title: 'SUP Board Dimensions Guide'
        desc: 'How length, width, and thickness affect stability, speed, and maneuverability.'
        href: '/learn/sup'
      - title: 'SUP Maintenance & Care'
        desc: 'Cleaning, storage, UV protection, and repair tips for inflatable SUP boards.'
        href: '/inflatable-sup-maintenance'
      - title: 'Choosing Your First SUP'
        desc: "Beginner's guide to selecting the right stand-up paddleboard for your weight, skill level, and intended use."
        href: '/learn/sup'
  - title: 'Diving Equipment Guide'
    tagline: 'Commercial Dive Boat Knowledge'
    desc: 'Specialized guides on dive boats, dive RIBs, and equipment for diving centers, dive operators, and commercial diving teams.'
    guides:
      - title: 'Best RIB Boat for Diving Centers'
        desc: 'How to choose the right dive RIB for your diving center — capacity, configuration, and budget considerations.'
        href: '/solutions-diving-center-boats'
      - title: 'Dive RIB Configuration Guide'
        desc: 'Essential features for dive RIBs — tank racks, ladder systems, dive platform, and equipment storage.'
        href: '/solutions-diving-center-boats'
  - title: 'Yacht Tender Guide'
    tagline: 'Superyacht & Marine Tender Solutions'
    desc: 'Guides on selecting the perfect yacht tender — inflatable tenders, RIB tenders, storage solutions, and tender accessories.'
    guides:
      - title: 'How to Choose a Yacht Tender'
        desc: 'Factors to consider when selecting a tender for your yacht — size, material, engine, and storage.'
        href: '/solutions-yacht-tender-solutions'
      - title: 'Inflatable vs RIB Tenders'
        desc: 'Compare inflatable dinghy tenders with rigid inflatable boat tenders for performance, durability, and stowability.'
        href: '/compare/rib-vs-dinghy'
  - title: 'Rescue Equipment Guide'
    tagline: 'Search & Rescue Watercraft Knowledge'
    desc: 'Professional guides on rescue boats, SAR watercraft, and emergency response equipment for coast guard, lifeguards, and disaster relief teams.'
    guides:
      - title: 'SAR Boat Selection Guide'
        desc: 'How to choose the right search and rescue boat — speed, capacity, durability, and specialized equipment requirements.'
        href: '/solutions-rescue-watercraft'
      - title: 'Commercial RIB for Rescue Operations'
        desc: 'Why commercial-grade RIBs are the preferred choice for professional search and rescue teams worldwide.'
        href: '/use-cases/search-and-rescue'\n"""

# Factory fields (added to {lang}/factory.yaml)
FACTORY_FIELDS = """\nintelligence_tagline: Factory Intelligence
intelligence_title: Explore Our Manufacturing Capabilities

intelligence_cards:
  - title: Production Capacity
    icon: C
    icon_bg: blue
    desc: '12,000 m2 facility producing 15,000+ boats/yr across SUP (8,000+), RIB (2,000+), inflatable dinghy (5,000+), and safety equipment lines. 200+ workers, 2 shifts.'
    metrics:
      - label: MOQ
        value: 'SUP: 5-10 / RIB: 2-5'
      - label: Lead Time
        value: '30-45 days'
    link: /factory/capacity
    link_label: 'Full capacity details \u2192'
  - title: Quality Lab & Testing
    icon: Q
    icon_bg: green
    desc: 'Independent QC lab with 4 testing stages: raw material inspection (tensile, tear, UV), 48h pressure hold at 1.25x rated pressure, seam peel testing, and load/balance verification on every boat.'
    metrics:
      - label: Lab Equipment
        value: 'Tensile tester, temp chamber, leak tank'
      - label: Standards
        value: 'ISO 9001, CE, AS 1799'
    link: /factory/quality-lab
    link_label: 'Lab procedures & equipment \u2192'
  - title: OEM/ODM Capability
    icon: O
    icon_bg: purple
    desc: 'End-to-end OEM/ODM services: custom mould design, private-label packaging, custom tube colors, deck graphics (digital & screen printing), Hypalon upgrade option, and drop-ship logistics.'
    metrics:
      - label: Certifications
        value: 'ISO 9001, BSCI, CE, REACH'
      - label: Shipping
        value: 'FOB, CIF, DDP to 50+ countries'
    link: /factory/oem-capability
    link_label: 'Full OEM services \u2192'\n"""

# About fields (added to {lang}/about.yaml)
ABOUT_FIELDS = """\nbrand_hub_tagline: Brand
brand_hub_title: Explore Our Brand
brand_hub_subtitle: Dive deeper into our marine engineering expertise, global presence, and the principles that drive us.

brand_hub_cards:
  - title: Marine Expertise
    desc: 'Decades of material science, precision manufacturing, and real-world testing \u2014 from PVC/Hypalon fabrication to deep-V hull design and drop-stitch technology.'
    link: /brand-marine-expertise
    link_label: 'Learn more \u2192'
  - title: Global Presence
    desc: 'Shipping to 50+ countries from our Qingdao facility with authorized service partners across Europe, Asia-Pacific, and the Americas.'
    link: /brand-global-presence
    link_label: 'Learn more \u2192'
  - title: Why Inflatable Pool Factory
    desc: 'Vertical integration, dual certification (ISO 9001 + BSCI), CE compliance, and low MOQs \u2014 built for brands, distributors, and government agencies.'
    link: /brand-why-inflatable-pool-factory
    link_label: 'Learn more \u2192'\n"""


def append_fields(page, fields, check_fields):
    """Append fields to all language YAML files for a given page."""
    count = 0
    for lang in LANGS:
        fp = os.path.join(PAGES_DIR, lang, f'{page}.yaml')
        if not os.path.exists(fp):
            print(f'MISSING: {fp}')
            continue
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        # Check if fields already exist
        already_present = any(kw in content for kw in check_fields)
        if already_present:
            print(f'SKIP (exists): {lang}/{page}.yaml')
            continue
        # Append fields at the end
        content = content.rstrip() + fields
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'OK: {lang}/{page}.yaml')
        count += 1
    return count


if __name__ == '__main__':
    total = 0
    total += append_fields('academy', ACADEMY_FIELDS, ['knowledge_center_tagline', 'knowledge_sections'])
    total += append_fields('factory', FACTORY_FIELDS, ['intelligence_tagline', 'intelligence_cards'])
    total += append_fields('about', ABOUT_FIELDS, ['brand_hub_tagline', 'brand_hub_cards'])
    print(f'\nTotal: {total} files updated')
