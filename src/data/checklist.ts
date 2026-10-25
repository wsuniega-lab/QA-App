export interface ChecklistItem {
  id: string;
  text: string;
  /** Shown under the item as guidance, e.g. what to measure or record. */
  hint?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  icon: 'cube-outline' | 'resize-outline' | 'git-network-outline' | 'magnet-outline' | 'thermometer-outline';
  items: ChecklistItem[];
}

/**
 * Pre-pour checklist template. Item ids are stored with each inspection, so
 * never reuse an id for a different check. Add new items with new ids.
 */
export const CHECKLIST: ChecklistSection[] = [
  {
    id: 'forms',
    title: 'Forms & Dimensions',
    icon: 'cube-outline',
    items: [
      { id: 'forms.clean', text: 'Form clean and free of debris, hardened concrete and standing water' },
      { id: 'forms.release', text: 'Form release agent applied evenly, no puddling, none on reinforcement or strand' },
      {
        id: 'forms.dims',
        text: 'Length, width and depth match shop drawing within tolerance',
        hint: 'Record measured values in the note',
      },
      { id: 'forms.square', text: 'Squareness verified by diagonal measurement', hint: 'Record both diagonals' },
      { id: 'forms.tight', text: 'Side rails, bulkheads and end forms secure with tight joints (no grout leaks)' },
      { id: 'forms.chamfer', text: 'Chamfers, reveals and form liners correct and secured' },
      { id: 'forms.blockouts', text: 'Blockouts and openings correct size and location, secured against floating' },
      { id: 'forms.alignment', text: 'Form alignment, camber and sweep checked' },
      { id: 'forms.mark', text: 'Piece mark and shop drawing revision confirmed with production' },
    ],
  },
  {
    id: 'cover',
    title: 'Concrete Cover',
    icon: 'resize-outline',
    items: [
      { id: 'cover.bottom', text: 'Bottom cover verified, chairs/spacers correct height', hint: 'Record measured cover' },
      { id: 'cover.sides', text: 'Side cover verified at all form faces' },
      { id: 'cover.top', text: 'Top cover verified after screed line set' },
      { id: 'cover.strand', text: 'Cover to prestressing strand per drawing' },
      { id: 'cover.embeds', text: 'Cover maintained at embeds, inserts and blockouts' },
      {
        id: 'cover.chairs',
        text: 'Chairs/spacers correct type and spacing (non-corroding at exposed faces)',
      },
    ],
  },
  {
    id: 'reinforcing',
    title: 'Reinforcing & Strand',
    icon: 'git-network-outline',
    items: [
      { id: 'rebar.size', text: 'Bar sizes and grades match shop drawing' },
      { id: 'rebar.spacing', text: 'Bar spacing and quantities correct' },
      { id: 'rebar.laps', text: 'Lap splice lengths and locations per drawing' },
      { id: 'rebar.bends', text: 'Hooks, bends, stirrups and ties correct' },
      { id: 'rebar.tied', text: 'Reinforcement tied securely, will not displace during placement' },
      { id: 'rebar.clean', text: 'Reinforcement clean (no mud, oil, release agent or loose rust)' },
      { id: 'rebar.wwr', text: 'Welded wire reinforcement correct size, orientation and laps' },
      { id: 'strand.pattern', text: 'Strand size, grade, quantity and pattern per drawing' },
      { id: 'strand.debond', text: 'Debonded strand sheathing length and locations correct' },
      {
        id: 'strand.tension',
        text: 'Strand tensioning: gauge pressure and elongation within tolerance of calculated values',
        hint: 'Record jacking force, measured vs. calculated elongation',
      },
      { id: 'strand.harp', text: 'Hold-down/hold-up (deflected strand) locations correct' },
      { id: 'strand.clean', text: 'Strand clean and free of release agent' },
    ],
  },
  {
    id: 'embeds',
    title: 'Embeds & Inserts',
    icon: 'magnet-outline',
    items: [
      {
        id: 'embeds.lifting',
        text: 'Lifting inserts correct type, capacity, quantity and location per handling drawing',
      },
      { id: 'embeds.plates', text: 'Weld plates and connection hardware correct type, location and orientation' },
      { id: 'embeds.secured', text: 'Embeds secured so they will not shift during placement and vibration' },
      { id: 'embeds.anchors', text: 'Headed studs/anchors on embeds correct and undamaged' },
      { id: 'embeds.mep', text: 'Sleeves, conduit, boxes and penetrations located and secured' },
      { id: 'embeds.threads', text: 'Threaded inserts plugged or protected' },
      { id: 'embeds.coating', text: 'Galvanizing/coating on embeds in good condition' },
      { id: 'embeds.clearance', text: 'Clearance between embeds and reinforcement allows consolidation' },
    ],
  },
  {
    id: 'pour',
    title: 'Mix & Pour Readiness',
    icon: 'thermometer-outline',
    items: [
      { id: 'pour.mix', text: 'Approved mix design confirmed for this piece', hint: 'Record mix ID' },
      {
        id: 'pour.weather',
        text: 'Ambient temperature recorded, hot/cold weather measures in place',
        hint: 'Record ambient temperature',
      },
      { id: 'pour.equipment', text: 'Test equipment ready: slump/spread, air, temperature, unit weight' },
      { id: 'pour.cylinders', text: 'Cylinder plan set for release and 28-day strength' },
      { id: 'pour.vibration', text: 'Vibrators/consolidation equipment ready and working' },
      { id: 'pour.curing', text: 'Curing method ready (covers, heat, moisture), temperature monitoring in place' },
      { id: 'pour.finish', text: 'Finish requirements for exposed faces understood by crew' },
      { id: 'pour.briefed', text: 'Production crew briefed on piece requirements' },
    ],
  },
];

export const ALL_ITEMS = CHECKLIST.flatMap((s) => s.items);

export const PIECE_TYPES = [
  'Double Tee',
  'Hollow Core',
  'Wall Panel',
  'Beam',
  'Inverted Tee',
  'Column',
  'Spandrel',
  'Stair',
  'Slab',
  'Pile',
  'Box Culvert',
  'Other',
];
