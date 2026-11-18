/**
 * Shape-specific engineering notes for the product detail pages.
 *
 * These profiles explain the published construction and the questions a buyer
 * should confirm on the approved model drawing. They do not add per-SKU
 * pressure, thickness, capacity or load ratings that the factory has not
 * confirmed.
 */

export interface EngineeringPoint {
  title: string;
  body: string;
}

export interface EngineeringLink {
  label: string;
  href: string;
}

export interface PoolEngineeringProfile {
  shape: string;
  intro: string;
  points: EngineeringPoint[];
  note: string;
  links: EngineeringLink[];
}

const COMMON_LINKS: EngineeringLink[] = [
  { label: 'Drop stitch technology center', href: '/drop-stitch-pool-technology' },
  { label: 'PVC material guide', href: '/drop-stitch-pool-materials' },
  { label: 'Water capacity calculator', href: '/inflatable-pool-water-capacity' },
  { label: 'Published test results', href: '/quality-control/destructive-testing/results' },
];

const PRESSURE_POINT: EngineeringPoint = {
  title: 'Pressure and water depth',
  body: 'Inflate to the pressure stated on the model nameplate or approved specification. Our published standard-model baseline is 4-5 PSI operating, 8 PSI maximum and relief above 6 PSI; custom and SPA models can differ. Water depth is lower than the overall wall height, and capacity depends on internal dimensions and the actual fill level.',
};

const roundProfile: PoolEngineeringProfile = {
  shape: 'round',
  intro:
    'A round drop-stitch pool uses one continuous circular wall. The engineering focus is the circular wall load path and the floor-to-wall seam, not a set of 90-degree corners.',
  points: [
    {
      title: 'Continuous circular wall',
      body: 'The wall forms a closed ring, so water pressure is carried around the perimeter without 90-degree corners. This gives an even swimming radius and a predictable circular footprint. It does not remove the need for correct pressure, ground preparation and seam inspection.',
    },
    {
      title: 'Circular footprint and clearance',
      body: 'A round pool needs a square area large enough to contain the circle, plus access around the perimeter for inflation, cleaning and safety. Check the outer diameter and the route to the site, not only the nominal water area.',
    },
    {
      title: 'Floor-to-wall seam',
      body: 'The floor and perimeter wall are joined into a single air chamber with heat-welded seams and reinforced PVC rail bands. The seam and rail area is inspected before packing; the exact reinforcement lay-up is confirmed in the approved model drawing.',
    },
    {
      title: 'Diameter and wall options',
      body: 'The standard round pool series runs from 2.0 m to 10.0 m in diameter with 10 cm and 15 cm inflated wall options. The round SPA series uses 8 cm, 10 cm and 15 cm walls. Custom diameters are reviewed per project.',
    },
    PRESSURE_POINT,
  ],
  note: 'This profile explains the published construction. It is not a substitute for the approved model drawing, nameplate or user documentation.',
  links: COMMON_LINKS,
};

const rectangularProfile: PoolEngineeringProfile = {
  shape: 'rectangular',
  intro:
    'A rectangular drop-stitch pool combines straight side walls with 90-degree corners. The engineering focus is the corner and seam load path, straight-wall stiffness and the floor-to-wall connection.',
  points: [
    {
      title: 'Straight-wall geometry',
      body: 'Straight walls maximize usable swim space inside a rectangular deck or garden layout. The wall panels are patterned to hold their shape at the model\'s rated pressure; long walls and corners see different bending loads from a circular wall.',
    },
    {
      title: 'Corner and seam reinforcement',
      body: 'Corners and vertical seams are where bending and peel loads concentrate. Our published production process uses heat-welded panel assembly with double or triple-layer reinforced PVC rail bands at edges and seams. The specific corner reinforcement is confirmed in the approved model drawing.',
    },
    {
      title: 'Bottom-to-wall connection',
      body: 'The floor and perimeter walls are joined into a single air chamber. The connection is heat-welded and inspected as part of the production flow; gusset or reinforcement details can vary by model and are confirmed on the approved drawing.',
    },
    {
      title: 'Drainage and valve placement',
      body: 'Drain and filter ports are heat-sealed into designated wall panels. Standard models use 38 mm filter-pump ports, water shut-off valves, over-inflation safety valves and drain valves. Placement can be reviewed for custom projects and is fixed on the approved drawing.',
    },
    {
      title: 'Size and wall options',
      body: 'The standard rectangular and square series covers 15 factory sizes from 2 x 2 x 0.8 m to 6 x 5 x 1.5 m, with 15 cm, 20 cm and 50 cm inflated wall options. Selected large models use the 50 cm reinforced wall; confirm the engineering and test data for the exact model.',
    },
    PRESSURE_POINT,
  ],
  note: 'This profile explains the published construction. It is not a substitute for the approved model drawing, nameplate or user documentation.',
  links: COMMON_LINKS,
};

const squareSpaProfile: PoolEngineeringProfile = {
  shape: 'square / rectangular SPA',
  intro:
    'A square or rectangular SPA tub uses the same drop-stitch wall construction as the pool range, with built-in seats and an insulated bottom for seated soaking. Heating and filtration are external and specified separately.',
  points: [
    {
      title: 'Built-in seating',
      body: 'The standard SPA models include integrated inflatable seats. Seat layout, depth and occupied space are model-specific; confirm the internal drawing before planning a deck or surround.',
    },
    {
      title: 'Insulated thermal bottom',
      body: 'The standard SPA models use a 5 mm insulated thermal bottom to reduce heat loss through the floor. The heater is not included; the heating unit and its safety requirements are specified separately for the project.',
    },
    {
      title: 'Compact square footprint',
      body: 'The square and rectangular SPA series runs from 1.5 x 1.5 x 0.8 m to 3 x 2 x 1.0 m with 15 cm and 20 cm wall options. Check the filled weight and the support capacity of the deck or patio before installation.',
    },
    {
      title: 'External heating and filtration',
      body: 'SPA tubs are designed for use with external heating and filtration equipment. The compatible equipment, hose connections and electrical requirements are confirmed for the target market and project.',
    },
    PRESSURE_POINT,
  ],
  note: 'This profile explains the published construction. It is not a substitute for the approved model drawing, nameplate or user documentation.',
  links: COMMON_LINKS,
};

const roundSpaProfile: PoolEngineeringProfile = {
  shape: 'round SPA',
  intro:
    'A round SPA tub combines a compact circular footprint with drop-stitch walls, built-in seats and an insulated bottom. It is designed for seated soaking with external heating and filtration.',
  points: [
    {
      title: 'Circular SPA wall',
      body: 'The round SPA wall is a continuous ring, which suits a compact courtyard or balcony layout. As with the pool range, correct pressure, ground support and seam inspection are required; the circular shape is not a substitute for those controls.',
    },
    {
      title: 'Built-in seats and insulated bottom',
      body: 'The standard round SPA models include integrated inflatable seats and a 5 mm insulated thermal bottom. Seat layout and internal depth are model-specific; confirm the drawing before planning steps or a surround.',
    },
    {
      title: 'Compact diameter range',
      body: 'The standard round SPA series covers 1.8 m, 2.0 m and 2.3 m diameters with 8 cm, 10 cm and 15 cm wall options. The small footprint makes the filled weight and the support surface especially important.',
    },
    {
      title: 'External heating and filtration',
      body: 'The SPA tub is designed for use with an external heater and filtration equipment, which are not included. Compatible equipment, connections and electrical requirements are confirmed for the target market and project.',
    },
    PRESSURE_POINT,
  ],
  note: 'This profile explains the published construction. It is not a substitute for the approved model drawing, nameplate or user documentation.',
  links: COMMON_LINKS,
};

export const poolEngineeringProfiles: Record<string, PoolEngineeringProfile> = {
  'rectangular-drop-stitch-pool': rectangularProfile,
  'round-blue-drop-stitch-pool': roundProfile,
  'round-grey-drop-stitch-pool': roundProfile,
  'hot-tub-round': roundSpaProfile,
  'hot-tub-square-rect': squareSpaProfile,
};
