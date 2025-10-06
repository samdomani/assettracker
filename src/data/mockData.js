const baseZones = [
  {
    id: 'zone-a', name: 'Zone A', color: 'rgba(59, 130, 246, 0.25)', borderColor: 'rgb(59, 130, 246)', labelPos: { x: 60, y: 60 }, rect: { x: -50, y: -100, width: 260, height: 140 },
  },
  {
    id: 'zone-b', name: 'Zone B', color: 'rgba(34, 197, 94, 0.25)', borderColor: 'rgb(34, 197, 94)', labelPos: { x: 60, y: 280 }, rect: { x: 280, y: 480, width: 550, height: 120 },
  },
  {
    id: 'zone-c', name: 'Zone C', color: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgb(239, 68, 68)', labelPos: { x: 520, y: 80 }, rect: { x: 220, y: 100, width: 350, height: 260 },
  },
  {
    id: 'zone-d', name: 'Zone D', color: 'rgba(234, 179, 8, 0.25)', borderColor: 'rgb(234, 179, 8)', labelPos: { x: 520, y: 340 }, rect: { x: 750, y: 120, width: 200, height: 230 },
  },
  {
    id: 'zone-e', name: 'Zone E', color: 'rgba(168, 85, 247, 0.25)', borderColor: 'rgb(168, 85, 247)', labelPos: { x: 820, y: 340 }, rect: { x: 900, y: 480, width: 320, height: 120 },
  },
  {
    id: 'zone-f', name: 'Zone F', color: 'rgba(251, 146, 60, 0.25)', borderColor: 'rgb(251, 146, 60)', labelPos: { x: 1040, y: 340 }, rect: { x: 1060, y: 120, width: 220, height: 230 },
  },
];

function generateRowsForZone(zone) {
  const pad = 10;
  const inner = { x: zone.rect.x + pad, y: zone.rect.y + pad, width: zone.rect.width - pad * 2, height: zone.rect.height - pad * 2 };
  const rows = [];
  if (zone.id === 'zone-a') {
    // 8 vertical columns
    const cols = 8; const gap = 6;
    const colW = (inner.width - gap * (cols - 1)) / cols;
    for (let i = 0; i < cols; i++) {
      rows.push({ id: `a-r${i+1}`, x: inner.x + i * (colW + gap), y: inner.y, width: colW, height: inner.height });
    }
  } else if (zone.id === 'zone-b') {
    // 12 horizontal bars
    const bars = 12; const gap = 4;
    const barH = (inner.height - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      rows.push({ id: `b-r${i+1}`, x: inner.x, y: inner.y + i * (barH + gap), width: inner.width, height: barH });
    }
  } else if (zone.id === 'zone-c') {
    // Create larger areas to spread assets across the entire zone
    const cols = 6; const rowsCount = 4; const gap = 8;
    const cellW = (inner.width - gap * (cols - 1)) / cols;
    const cellH = (inner.height - gap * (rowsCount - 1)) / rowsCount;
    let id = 1;
    for (let r = 0; r < rowsCount; r++) {
      for (let c = 0; c < cols; c++) {
        rows.push({ id: `c-r${id++}`, x: inner.x + c * (cellW + gap), y: inner.y + r * (cellH + gap), width: cellW, height: cellH });
      }
    }
  } else if (zone.id === 'zone-d') {
    // unified 4x2 grid
    const cols = 4, rowsCount = 2, gap = 8;
    const cellW = (inner.width - gap * (cols - 1)) / cols;
    const cellH = (inner.height - gap * (rowsCount - 1)) / rowsCount;
    let id = 1;
    for (let r = 0; r < rowsCount; r++) {
      for (let c = 0; c < cols; c++) {
        rows.push({ id: `d-r${id++}`, x: inner.x + c * (cellW + gap), y: inner.y + r * (cellH + gap), width: cellW, height: cellH });
      }
    }
  } else if (zone.id === 'zone-e') {
    // 12 vertical columns
    const cols = 12; const gap = 4;
    const colW = (inner.width - gap * (cols - 1)) / cols;
    for (let i = 0; i < cols; i++) {
      rows.push({ id: `e-r${i+1}`, x: inner.x + i * (colW + gap), y: inner.y, width: colW, height: inner.height });
    }
  } else if (zone.id === 'zone-f') {
    // 8 horizontal bars
    const bars = 8; const gap = 4;
    const barH = (inner.height - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      rows.push({ id: `f-r${i+1}`, x: inner.x, y: inner.y + i * (barH + gap), width: inner.width, height: barH });
    }
  }
  return rows;
}

function randomInRange(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Hidden placement rectangles per zone (not rendered). These guide where assets spawn.
function generatePlacementRectsForZone(zone, totalRects, rows) {
  const pad = 12; // outer padding inside the zone
  const gap = 8;  // gap between placement rectangles
  const inner = { x: zone.rect.x + pad, y: zone.rect.y + pad, width: zone.rect.width - pad * 2, height: zone.rect.height - pad * 2 };
  const cols = Math.max(1, Math.floor(totalRects / rows));
  const cellW = (inner.width - gap * (cols - 1)) / cols;
  const cellH = (inner.height - gap * (rows - 1)) / rows;
  const rects = [];
  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rects.length >= totalRects) break;
      rects.push({
        id: `${zone.id}-p${id++}`,
        x: inner.x + c * (cellW + gap),
        y: inner.y + r * (cellH + gap),
        width: cellW,
        height: cellH,
      });
    }
  }
  return rects;
}

// Configuration: number of hidden placement rectangles and how many to fill with assets
const placementConfig = {
  'zone-a': { total: 40, rows: 4, fill: 8 },
  'zone-b': { total: 120, rows: 6, fill: 25 },
  'zone-c': { total: 80, rows: 4, fill: 15 },
  'zone-d': { total: 60, rows: 3, fill: 10 },
  'zone-e': { total: 40, rows: 4, fill: 10 },
  'zone-f': { total: 60, rows: 3, fill: 15 },
};

function pickActivePlacementRects(zoneId, rects, fillCount) {
  // Deterministic selection: take evenly spaced indices across the list
  if (fillCount >= rects.length) return rects;
  const active = [];
  const step = rects.length / fillCount;
  for (let i = 0; i < fillCount; i++) {
    const idx = Math.floor(i * step);
    active.push(rects[idx]);
  }
  return active;
}

// Define asset types sourced from public/asset_images (names match filenames)
const assetTypes = [
  { name: 'Bins (Large)', image: 'Bins (Large).png', category: 'Storage' },
  { name: 'Bins (Medium)', image: 'Bins (Medium).png', category: 'Storage' },
  { name: 'Bins (Small)', image: 'Bins (Small).png', category: 'Storage' },
  { name: 'Boxes', image: 'Boxes.png', category: 'Packaging' },
  { name: 'Crates (Large)', image: 'Crates (Large).png', category: 'Storage' },
  { name: 'Crates (Small)', image: 'Crates (Small).png', category: 'Storage' },
  { name: 'Pallets', image: 'Pallets.png', category: 'Material Handling' },
  { name: 'Racks', image: 'Racks.png', category: 'Storage' },
  { name: 'Totes (Large)', image: 'Totes (Large).png', category: 'Storage' },
  { name: 'Totes (Medium)', image: 'Totes (Medium).png', category: 'Storage' },
  { name: 'Totes (Small)', image: 'Totes (Small).png', category: 'Storage' },
];

function generateAssets() {
  const assets = [];
  let globalAssetIndex = 0;

  // Precompute placement rectangles per zone
  /** @type {Record<string, {all: any[], active: any[]}>} */
  const zonePlacements = {};
  for (const z of baseZones) {
    const cfg = placementConfig[z.id];
    if (z.rect && cfg) {
      const all = generatePlacementRectsForZone(z, cfg.total, cfg.rows);
      const active = pickActivePlacementRects(z.id, all, cfg.fill);
      zonePlacements[z.id] = { all, active };
    } else {
      zonePlacements[z.id] = { all: [], active: [] };
    }
  }

  // Helper to add an asset instance at a random point within a rect
  function pushAsset(zone, rect, typeName) {
    const assetType = assetTypes.find(t => t.name === typeName);
    if (!assetType) return;
    const padding = 6;
    const minX = rect.x + padding;
    const maxX = rect.x + rect.width - padding;
    const minY = rect.y + padding;
    const maxY = rect.y + rect.height - padding;
    const x = randomInRange(minX, maxX);
    const y = randomInRange(minY, maxY);

    const id = `${assetType.name.replace(/\s+/g, '-')}-${zone.id}-${(1000 + globalAssetIndex).toString()}`;
    const history = [
      { x: x + randomInRange(-40, 40), y: y + randomInRange(-40, 40), timestamp: 0 },
      { x: x + randomInRange(-20, 20), y: y + randomInRange(-20, 20), timestamp: 2 },
      { x, y, timestamp: 4 },
    ];
    let rowId;
    if (zone.rows && zone.rows.length) {
      for (const r of zone.rows) {
        if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
          rowId = r.id;
          break;
        }
      }
    }
    assets.push({
      id,
      zoneId: zone.id,
      rowId,
      position: { x, y },
      status: 'Stationary', // Most assets are stationary, anomalies will be handled separately
      history,
      assetType: assetType.name,
      image: assetType.image,
      category: assetType.category,
    });
    globalAssetIndex++;
  }

  // Exclusive-per-rect types setup (per new rules)
  function getZoneExclusiveTypes(zoneId) {
    const bins = ['Bins (Large)', 'Bins (Medium)', 'Bins (Small)'];
    const totes = ['Totes (Large)', 'Totes (Medium)', 'Totes (Small)'];
    const crates = ['Crates (Large)', 'Crates (Small)'];
    const set = [];
    // Bins: Zones D and F only
    if (zoneId === 'zone-d' || zoneId === 'zone-f') set.push(...bins);
    // Totes: Zones A and E only
    if (zoneId === 'zone-a' || zoneId === 'zone-e') set.push(...totes);
    // Crates remain: Zones A and D only
    if (zoneId === 'zone-a' || zoneId === 'zone-d') set.push(...crates);
    return set;
  }

  // Precise exclusive rectangle counts for Bins and Totes per zone
  function getExclusiveRectCount(zoneId, typeName) {
    switch (zoneId) {
      case 'zone-d': {
        if (typeName === 'Bins (Large)') return 1;
        if (typeName === 'Bins (Medium)') return 4;
        if (typeName === 'Bins (Small)') return 6;
        // Crates default handled elsewhere
        return null;
      }
      case 'zone-f': {
        if (typeName === 'Bins (Large)') return 2;
        if (typeName === 'Bins (Medium)') return 2;
        if (typeName === 'Bins (Small)') return 3;
        return null;
      }
      case 'zone-a': {
        if (typeName === 'Totes (Large)') return 2;
        if (typeName === 'Totes (Medium)') return 4;
        if (typeName === 'Totes (Small)') return 3;
        return null;
      }
      case 'zone-e': {
        if (typeName === 'Totes (Large)') return 2;
        if (typeName === 'Totes (Medium)') return 2;
        if (typeName === 'Totes (Small)') return 5;
        return null;
      }
      default:
        return null;
    }
  }

  // Iterate zones and distribute per rules
  for (const zone of baseZones) {
    const placements = zonePlacements[zone.id]?.all || [];
    if (!placements.length) continue;

    // Reserve exclusive rectangles per type
    const reserved = new Map(); // rectId -> typeName
    const availableRects = placements.slice();
    function reserveRectsForType(typeName, count) {
      const picked = [];
      for (let i = 0; i < count && availableRects.length > 0; i++) {
        const idx = Math.floor((i * 997 + zone.id.length) % availableRects.length);
        const rect = availableRects.splice(idx, 1)[0];
        reserved.set(rect.id, typeName);
        picked.push(rect);
      }
      return picked;
    }

    // Determine zone-specific exclusive types
    const zoneExclusiveTypes = getZoneExclusiveTypes(zone.id);
    // Reserve specific number of rects per exclusive type (bins/totes per spec; crates default 1-2)
    for (const typeName of zoneExclusiveTypes) {
      let rectsToReserve = getExclusiveRectCount(zone.id, typeName);
      if (rectsToReserve == null) {
        // default for crates or any unspecified: 1-2 depending on availability
        rectsToReserve = Math.max(1, Math.min(2, availableRects.length));
      }
      rectsToReserve = Math.min(rectsToReserve, availableRects.length);
      reserveRectsForType(typeName, rectsToReserve);
    }

    // Fill exclusive rectangles densely with that type only
    for (const [rectId, typeName] of reserved.entries()) {
      const rect = placements.find(r => r.id === rectId);
      if (!rect) continue;
      const clusterCount = 6 + (Math.abs((rect.x + rect.y) | 0) % 10); // 6-15 assets
      for (let i = 0; i < clusterCount; i++) {
        pushAsset(zone, rect, typeName);
      }
    }

    // Racks: Zones A and E -> exactly one in EVERY rectangle (including reserved)
    //        Zone B -> one in every non-exclusive rectangle
    const nonExclusiveRects = placements.filter(r => !reserved.has(r.id));
    if (zone.id === 'zone-a' || zone.id === 'zone-e') {
      for (const rect of placements) {
        pushAsset(zone, rect, 'Racks');
      }
    } else if (zone.id === 'zone-b') {
      for (const rect of nonExclusiveRects) {
        pushAsset(zone, rect, 'Racks');
      }
    }

    // Pallets: Zone C only, 1-5 per rectangle (random)
    if (zone.id === 'zone-c') {
      for (const rect of nonExclusiveRects) {
        const palletsCount = randomInRange(1, 5);
        for (let i = 0; i < palletsCount; i++) pushAsset(zone, rect, 'Pallets');
      }
    }

    // Boxes: Zone B and E only, scattered
    if (zone.id === 'zone-b' || zone.id === 'zone-e') {
      // scatter across a subset of non-exclusive rects
      const subsetStride = zone.id === 'zone-b' ? 4 : 6;
      for (let i = 0; i < nonExclusiveRects.length; i += subsetStride) {
        const rect = nonExclusiveRects[i];
        const boxesCount = 2 + (i % 3); // 2-4
        for (let j = 0; j < boxesCount; j++) pushAsset(zone, rect, 'Boxes');
      }
    }
  }

  return assets;
}

// attach generated rows into zones so they always fit within rects
for (const z of baseZones) {
  z.rows = generateRowsForZone(z);
}

// Force regeneration of assets with corrected coordinates (v2 - fixed Shipping/Inventory2 zones)
const assets = generateAssets(); // Total: 643 assets distributed across zones


// compute overall zone bounds
const bounds = baseZones.reduce((b, z) => ({
  minX: Math.min(b.minX, z.rect.x),
  minY: Math.min(b.minY, z.rect.y),
  maxX: Math.max(b.maxX, z.rect.x + z.rect.width),
  maxY: Math.max(b.maxY, z.rect.y + z.rect.height),
}), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

// blueprint elements placed outside or between zones using computed gaps
const gap = 40;
const offices = [];
// bottom offices (5) - manually positioned for easy editing
offices.push({ id: 'off-b1', x: bounds.minX + 260, y: bounds.maxY + 60, width: 30, height: 30 });
offices.push({ id: 'off-b2', x: bounds.minX + 300, y: bounds.maxY + 60, width: 30, height: 30 });
offices.push({ id: 'off-b3', x: bounds.minX + 340, y: bounds.maxY + 60, width: 30, height: 30 });
offices.push({ id: 'off-b4', x: bounds.minX + 380, y: bounds.maxY + 60, width: 30, height: 30 });
offices.push({ id: 'off-b5', x: bounds.minX + 420, y: bounds.maxY + 60, width: 30, height: 30 });
// Left side offices (3) - manually positioned for easy editing
offices.push({ id: 'off-r1', x: bounds.maxX - 1180, y: bounds.minY + 440, width: 30, height: 30 });
offices.push({ id: 'off-r2', x: bounds.maxX - 1180, y: bounds.minY + 480, width: 30, height: 30 });
offices.push({ id: 'off-r3', x: bounds.maxX - 1180, y: bounds.minY + 520, width: 30, height: 30 });
// between columns (near middle vertically)
offices.push({ id: 'off-m1', x: bounds.maxX - 480, y: bounds.minY + 510, width: 30, height: 30 });
offices.push({ id: 'off-m2', x: bounds.maxX - 520, y: bounds.minY + 510, width: 30, height: 30 });
offices.push({ id: 'off-m3', x: bounds.maxX - 560, y: bounds.minY + 510, width: 30, height: 30 });
offices.push({ id: 'off-m4', x: bounds.maxX - 600, y: bounds.minY + 510, width: 30, height: 30 });


// walls drawn as thin line segments (to look like map outline)
const walls = [
  // Middle v/h walls (Middle Zone)
  { id: 'wall-1.1', x1: bounds.minX + 750, y1: bounds.minY + 150, x2: bounds.minX + 750, y2: bounds.minY + 231 },
  { id: 'wall-1.2', x1: bounds.minX + 690, y1: bounds.minY + 230, x2: bounds.minX + 750, y2: bounds.minY + 230 },
  { id: 'wall-1.3', x1: bounds.minX + 690, y1: bounds.minY + 229, x2: bounds.minX + 690, y2: bounds.minY + 480 },
  // long horizontal walls (Middle Zone)
  { id: 'wall-2.1', x1: bounds.minX + 190, y1: bounds.minY + 500, x2: bounds.minX + 350, y2: bounds.minY + 500 },
  { id: 'wall-2.2', x1: bounds.minX + 370, y1: bounds.minY + 500, x2: bounds.minX + 670, y2: bounds.minY + 500 },
  { id: 'wall-2.3', x1: bounds.minX + 690, y1: bounds.minY + 500, x2: bounds.minX + 1030, y2: bounds.minY + 500 },
  { id: 'wall-2.4', x1: bounds.minX + 1050, y1: bounds.minY + 500, x2: bounds.minX + 1150, y2: bounds.minY + 500 },
  { id: 'wall-2.5', x1: bounds.minX + 1170, y1: bounds.minY + 500, x2: bounds.minX + 1370, y2: bounds.minY + 500 },
  // Right vertical wall (Middle Zone)
  { id: 'wall-3.1', x1: bounds.minX + 1050, y1: bounds.minY + 150, x2: bounds.minX + 1050, y2: bounds.minY + 480 },
    // Left v/h walls (Bottom Zone)
  { id: 'wall-4.1', x1: bounds.minX + 280, y1: bounds.minY + 500, x2: bounds.minX + 280, y2: bounds.minY + 750 },
  { id: 'wall-4.2', x1: bounds.minX + 200, y1: bounds.minY + 620, x2: bounds.minX + 270, y2: bounds.minY + 620 },
];

const hallways = [];
// horizontal hallway between top and bottom rows of zones
hallways.push({ id: 'hall-middle', x: bounds.minX - 20, y: (baseZones[0].rect.y + baseZones[0].rect.height + baseZones[1].rect.y)/2 - 10, width: bounds.maxX - bounds.minX + 40, height: 20 });
// vertical hallway between left and right zone columns
hallways.push({ id: 'hall-vert', x: (baseZones[0].rect.x + baseZones[2].rect.x)/2 - 10, y: bounds.minY - 20, width: 20, height: bounds.maxY - bounds.minY + 40 });

const conferenceRooms = [
  // Moved one conference room to the right-side offices area
  { id: 'conf-1', x: bounds.maxX - 500, y: bounds.minY + 110, width: 120, height: 30 },
  // Scootched the bottom conference room further to the right
  { id: 'conf-2', x: bounds.minX + 500, y: bounds.maxY + 60, width: 120, height: 30 },
];

const bathrooms = [
  { id: 'bath-1', x: bounds.minX + 150, y: bounds.maxY - 100, width: 30, height: 20 },
  { id: 'bath-2', x: bounds.minX + 150, y: bounds.maxY - 70, width: 30, height: 20 },
  { id: 'bath-3', x: bounds.minX + 60, y: bounds.maxY - 510, width: 20, height: 30 },
  { id: 'bath-4', x: bounds.maxX - 1240, y: bounds.minY + 190, width: 20, height: 30 },
  { id: 'bath-5', x: bounds.maxX - 300, y: bounds.minY + 110, width: 20, height: 30 },
  { id: 'bath-6', x: bounds.maxX - 330, y: bounds.minY + 110, width: 20, height: 30 },
];

export const warehouseData = {
  version: 'v3-unique-asset-ids', // Force refresh with unique asset IDs
  zones: baseZones,
  assets,
  // Anomalies: assets missing/wrong-place and in-transit by assetType
  anomalies: {
    // Bins (Large): 1 missing inside a rectangle in Zone A
    'Bins (Large)': {
      missing: [
        { 
          id: 'Bins-Large-Missing-001',
          zoneId: 'zone-a',
          position: { x: baseZones[0].rect.x + baseZones[0].rect.width * 0.35, y: baseZones[0].rect.y + baseZones[0].rect.height * 0.45 },
          status: 'Missing',
          assetType: 'Bins (Large)',
          image: 'Bins (Large).png',
          category: 'Storage',
          rowId: null
        },
      ],
      inTransit: []
    },
    // Bins (Medium): 3 missing, two in one rectangle in Zone E
    'Bins (Medium)': {
      missing: [
        { 
          id: 'Bins-Medium-Missing-001',
          zoneId: 'zone-e',
          position: { x: baseZones[4].rect.x + baseZones[4].rect.width * 0.25, y: baseZones[4].rect.y + baseZones[4].rect.height * 0.5 },
          status: 'Missing',
          assetType: 'Bins (Medium)',
          image: 'Bins (Medium).png',
          category: 'Storage',
          rowId: null
        },
        { 
          id: 'Bins-Medium-Missing-002',
          zoneId: 'zone-e',
          position: { x: baseZones[4].rect.x + baseZones[4].rect.width * 0.28, y: baseZones[4].rect.y + baseZones[4].rect.height * 0.52 },
          status: 'Missing',
          assetType: 'Bins (Medium)',
          image: 'Bins (Medium).png',
          category: 'Storage',
          rowId: null
        },
        { 
          id: 'Bins-Medium-Missing-003',
          zoneId: 'zone-e',
          position: { x: baseZones[4].rect.x + baseZones[4].rect.width * 0.7, y: baseZones[4].rect.y + baseZones[4].rect.height * 0.35 },
          status: 'Missing',
          assetType: 'Bins (Medium)',
          image: 'Bins (Medium).png',
          category: 'Storage',
          rowId: null
        },
      ],
      inTransit: []
    },
    // Bins (Small): 1 missing in Zone A, 1 in transit above Zone F
    'Bins (Small)': {
      missing: [
        { 
          id: 'Bins-Small-Missing-001',
          zoneId: 'zone-a',
          position: { x: baseZones[0].rect.x + baseZones[0].rect.width * 0.6, y: baseZones[0].rect.y + baseZones[0].rect.height * 0.3 },
          status: 'Missing',
          assetType: 'Bins (Small)',
          image: 'Bins (Small).png',
          category: 'Storage',
          rowId: null
        },
      ],
      inTransit: [
        { 
          id: 'Bins-Small-InTransit-001',
          zoneId: null,
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.5, y: baseZones[5].rect.y - 40 },
          status: 'In-Transit',
          assetType: 'Bins (Small)',
          image: 'Bins (Small).png',
          category: 'Storage',
          rowId: null
        },
      ]
    },
    // Boxes: add 2 missing in Zone D, 4 missing in Zone E, and 1 in transit below Zone B
    'Boxes': {
      missing: [
        { 
          id: 'Boxes-Missing-001',
          zoneId: 'zone-d',
          position: { x: baseZones[3].rect.x + baseZones[3].rect.width * 0.30, y: baseZones[3].rect.y + baseZones[3].rect.height * 0.35 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
        { 
          id: 'Boxes-Missing-002',
          zoneId: 'zone-d',
          position: { x: baseZones[3].rect.x + baseZones[3].rect.width * 0.65, y: baseZones[3].rect.y + baseZones[3].rect.height * 0.60 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
        { 
          id: 'Boxes-Missing-003',
          zoneId: 'zone-f',
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.20, y: baseZones[5].rect.y + baseZones[5].rect.height * 0.40 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
        { 
          id: 'Boxes-Missing-004',
          zoneId: 'zone-f',
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.25, y: baseZones[5].rect.y + baseZones[5].rect.height * 0.55 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
        { 
          id: 'Boxes-Missing-005',
          zoneId: 'zone-f',
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.70, y: baseZones[5].rect.y + baseZones[5].rect.height * 0.35 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
        { 
          id: 'Boxes-Missing-006',
          zoneId: 'zone-f',
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.78, y: baseZones[5].rect.y + baseZones[5].rect.height * 0.65 },
          status: 'Missing',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
      ],
      inTransit: [
        { 
          id: 'Boxes-InTransit-001',
          zoneId: null,
          position: { x: baseZones[1].rect.x + baseZones[1].rect.width * 0.5, y: baseZones[1].rect.y + baseZones[1].rect.height + 40 },
          status: 'In-Transit',
          assetType: 'Boxes',
          image: 'Boxes.png',
          category: 'Packaging',
          rowId: null
        },
      ]
    },
    // Crates (Large): 3 missing -> two in Zone E, one in Zone F
    'Crates (Large)': {
      missing: [
        { 
          id: 'Crates-Large-Missing-001',
          zoneId: 'zone-e',
          position: { x: baseZones[4].rect.x + baseZones[4].rect.width * 0.30, y: baseZones[4].rect.y + baseZones[4].rect.height * 0.60 },
          status: 'Missing',
          assetType: 'Crates (Large)',
          image: 'Crates (Large).png',
          category: 'Storage',
          rowId: null
        },
        { 
          id: 'Crates-Large-Missing-002',
          zoneId: 'zone-e',
          position: { x: baseZones[4].rect.x + baseZones[4].rect.width * 0.65, y: baseZones[4].rect.y + baseZones[4].rect.height * 0.40 },
          status: 'Missing',
          assetType: 'Crates (Large)',
          image: 'Crates (Large).png',
          category: 'Storage',
          rowId: null
        },
        { 
          id: 'Crates-Large-Missing-003',
          zoneId: 'zone-f',
          position: { x: baseZones[5].rect.x + baseZones[5].rect.width * 0.50, y: baseZones[5].rect.y + baseZones[5].rect.height * 0.30 },
          status: 'Missing',
          assetType: 'Crates (Large)',
          image: 'Crates (Large).png',
          category: 'Storage',
          rowId: null
        },
      ],
      inTransit: []
    },
    // Crates (Small): 1 missing in Zone C
    'Crates (Small)': {
      missing: [
        { 
          id: 'Crates-Small-Missing-001',
          zoneId: 'zone-c',
          position: { x: baseZones[2].rect.x + baseZones[2].rect.width * 0.20, y: baseZones[2].rect.y + baseZones[2].rect.height * 0.70 },
          status: 'Missing',
          assetType: 'Crates (Small)',
          image: 'Crates (Small).png',
          category: 'Storage',
          rowId: null
        },
      ],
      inTransit: []
    },
    // Pallets: 2 in transit -> one above Zone C, one to the right of Zone C
    'Pallets': {
      missing: [],
      inTransit: [
        { 
          id: 'Pallets-InTransit-001',
          zoneId: null,
          position: { x: baseZones[2].rect.x + baseZones[2].rect.width * 0.50, y: baseZones[2].rect.y - 40 },
          status: 'In-Transit',
          assetType: 'Pallets',
          image: 'Pallets.png',
          category: 'Material Handling',
          rowId: null
        },
        { 
          id: 'Pallets-InTransit-002',
          zoneId: null,
          position: { x: baseZones[2].rect.x + baseZones[2].rect.width + 40, y: baseZones[2].rect.y + baseZones[2].rect.height * 0.50 },
          status: 'In-Transit',
          assetType: 'Pallets',
          image: 'Pallets.png',
          category: 'Material Handling',
          rowId: null
        },
      ]
    },
  },
  forklifts: [
    { id: 'forklift-1', position: { x: baseZones[0].rect.x - 30, y: baseZones[0].rect.y + 50 }, assetId: assets[0]?.id || 'G2-100000' }, // Near receiving zone
    { id: 'forklift-2', position: { x: baseZones[2].rect.x + baseZones[2].rect.width + 20, y: baseZones[2].rect.y + 50 }, assetId: assets[1]?.id || 'G2-100001' }, // Near kitting zone
    { id: 'forklift-3', position: { x: baseZones[4].rect.x - 30, y: baseZones[4].rect.y + 50 }, assetId: assets[2]?.id || 'G2-100002' }, // Near shipping zone
  ],
  blueprint: {
    offices,
    bathrooms,
    walls,
    hallways: [],
    conferenceRooms,
    outlinePoints: [
      { x: -100, y: 80 },
      { x: 700, y: -150 },
      { x: 1320, y: 50 },
      { x: 900, y: 650 },
      { x: 140, y: 650 },
      { x: 140, y: 120 },
    ],
  },
};

export { generateAssets };



