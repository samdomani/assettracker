import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const spring = { type: 'spring', stiffness: 60, damping: 20 };


export default function WarehouseMap({ data, selectedAssetId, selectedZoneId, selectedRackId, selectedAssetType, anomalyFilter, selectedAnomaly, onZoneSelect, onAssetSelect, onRackSelect, onClearAnomalies }) {
  const [activeView, setActiveView] = useState({ type: 'default', id: null });
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  const zonesById = useMemo(() => Object.fromEntries(data.zones.map(z => [z.id, z])), [data.zones]);
  const assetsById = useMemo(() => Object.fromEntries(data.assets.map(a => [a.id, a])), [data.assets]);

  // Get assets in the selected rack
  const selectedRackAssets = useMemo(() => {
    if (!selectedRackId) return [];
    return data.assets.filter(asset => asset.rowId === selectedRackId);
  }, [data.assets, selectedRackId]);

  // Find which zone contains the selected rack
  const selectedRackZoneId = useMemo(() => {
    if (!selectedRackId || selectedRackAssets.length === 0) return null;
    return selectedRackAssets[0].zoneId;
  }, [selectedRackId, selectedRackAssets]);

  // Calculate which zone contains the selected asset
  const selectedAssetZoneId = useMemo(() => {
    if (!selectedAssetId) return null;
    const asset = assetsById[selectedAssetId];
    return asset ? asset.zoneId : null;
  }, [selectedAssetId, assetsById]);

  // Calculate opacity for each zone based on asset selection
  const getZoneOpacity = useCallback((zoneId) => {
    if (!selectedAssetId && !selectedAssetType && !anomalyFilter && !selectedAnomaly) return 1;
    // If anomalies are active (filter or specific), dim all zones slightly to focus pings
    if (selectedAnomaly || (anomalyFilter === 'missing' || anomalyFilter === 'inTransit')) {
      return 0.25;
    }
    if (selectedAssetType) {
      // If filtering by type, dim zones that do not contain any assets of this type
      const hasType = data.assets.some(a => a.zoneId === zoneId && a.assetType === selectedAssetType);
      return hasType ? 1 : 0.15;
    }
    return zoneId === selectedAssetZoneId ? 1 : 0.3;
  }, [selectedAssetId, selectedAssetZoneId, selectedAssetType, data.assets]);

  const getZoneOffset = useCallback((zoneId) => {
    if (!zoneId) return { dx: 0, dy: 0 };
    const z = zonesById[zoneId];
    const o = z && z.offset ? z.offset : { dx: 0, dy: 0 };
    return { dx: o.dx || 0, dy: o.dy || 0 };
  }, [zonesById]);

  // Compute a non-rectangular warehouse outline that leaves buffer around elements
  const outlinePath = useMemo(() => {
    // If manual outline points are provided, build a rectilinear path from them
    const manual = data.blueprint?.outlinePoints;
    if (manual && Array.isArray(manual) && manual.length >= 3) {
      const pts = manual.map(p => ({ x: p.x, y: p.y }));
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (a.x === b.x || a.y === b.y) {
          d += ` L ${b.x} ${b.y}`;
        } else {
          const corner = { x: a.x, y: b.y }; // vertical then horizontal
          d += ` L ${corner.x} ${corner.y} L ${b.x} ${b.y}`;
        }
      }
      // close with orthogonal bend
      const last = pts[pts.length - 1];
      const first = pts[0];
      if (last.x === first.x || last.y === first.y) {
        d += ` L ${first.x} ${first.y} Z`;
      } else {
        const closeCorner = { x: last.x, y: first.y };
        d += ` L ${closeCorner.x} ${closeCorner.y} L ${first.x} ${first.y} Z`;
      }
      return d;
    }

    // Gather rect-like elements and inflate by buffer to create room around all items
    const buffer = 40; // visual buffer around all elements
    /** @type {{x:number,y:number,width:number,height:number}[]} */
    const rects = [];

    const includeRects = (arr) => {
      if (!arr) return;
      for (const r of arr) {
        rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
      }
    };

    // Zones that are rectangles
    for (const z of data.zones) {
      if (z.rect) rects.push({ x: z.rect.x, y: z.rect.y, width: z.rect.width, height: z.rect.height });
    }
    // Static blueprint rectangles
    includeRects(data.blueprint?.offices);
    includeRects(data.blueprint?.bathrooms);
    includeRects(data.blueprint?.docks);
    includeRects(data.blueprint?.hallways);
    includeRects(data.blueprint?.conferenceRooms);
    // Treat assets as tiny rects for hull purposes
    for (const a of data.assets) {
      rects.push({ x: a.position.x, y: a.position.y, width: 0, height: 0 });
    }

    if (rects.length === 0) return '';

    // Generate points from inflated rectangles
    /** @type {{x:number,y:number}[]} */
    const points = [];
    for (const r of rects) {
      const x = r.x - buffer;
      const y = r.y - buffer;
      const w = r.width + buffer * 2;
      const h = r.height + buffer * 2;
      points.push({ x: x, y: y });
      points.push({ x: x + w, y: y });
      points.push({ x: x + w, y: y + h });
      points.push({ x: x, y: y + h });
    }

    // Monotone chain convex hull
    const byXY = points
      .slice()
      .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower = [];
    for (const p of byXY) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    const upper = [];
    for (let i = byXY.length - 1; i >= 0; i--) {
      const p = byXY[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    upper.pop();
    lower.pop();
    const hull = lower.concat(upper);
    if (hull.length < 3) return '';

    // Build rectilinear (Manhattan) SVG path: replace each edge with vertical + horizontal
    let d = `M ${hull[0].x} ${hull[0].y}`;
    for (let i = 1; i < hull.length; i++) {
      const a = hull[i - 1];
      const b = hull[i];
      const corner = { x: a.x, y: b.y }; // vertical then horizontal bend
      d += ` L ${corner.x} ${corner.y} L ${b.x} ${b.y}`;
    }
    // close back to start with orthogonal bend
    const last = hull[hull.length - 1];
    const first = hull[0];
    const closeCorner = { x: last.x, y: first.y };
    d += ` L ${closeCorner.x} ${closeCorner.y} L ${first.x} ${first.y} Z`;
    return d;
  }, [data]);

  // Compute default viewBox to include zones and blueprint elements
  const defaultViewBox = useMemo(() => {
    let minX = 0, minY = 0, maxX = 800, maxY = 600;
    // zones by rect (include zone-level offsets)
    for (const z of data.zones) {
      if (z.rect) {
        const dx = z.offset?.dx || 0;
        const dy = z.offset?.dy || 0;
        minX = Math.min(minX, z.rect.x + dx);
        minY = Math.min(minY, z.rect.y + dy);
        maxX = Math.max(maxX, z.rect.x + dx + z.rect.width);
        maxY = Math.max(maxY, z.rect.y + dy + z.rect.height);
      }
    }
    const includeRects = (arr) => {
      if (!arr) return;
      for (const r of arr) {
        minX = Math.min(minX, r.x);
        minY = Math.min(minY, r.y);
        maxX = Math.max(maxX, r.x + r.width);
        maxY = Math.max(maxY, r.y + r.height);
      }
    };
    includeRects(data.blueprint?.offices);
    includeRects(data.blueprint?.bathrooms);
    includeRects(data.blueprint?.docks);
    includeRects(data.blueprint?.hallways);
    // add padding to zoom out slightly
    const padding = 150;
    const shiftX = + 190; // negative = move left, positive = move right
    const shiftY = - 40;   // negative = move up, positive = move down
    const x = (minX - padding) + shiftX;
    const y = (minY - padding) + shiftY;
    const w = (maxX - minX) + padding * 2;
    const h = (maxY - minY) + padding * 2;
    return `${x} ${y} ${w} ${h}`;
  }, [data]);

  // Compute current viewBox
  const viewBox = useMemo(() => {
    // Priority: selected rack zone > active zone view > default view
    if (selectedRackZoneId && zonesById[selectedRackZoneId]) {
      const z = zonesById[selectedRackZoneId];
      if (z.rect) {
        const pad = 20;
        const dx = z.offset?.dx || 0;
        const dy = z.offset?.dy || 0;
        const x = z.rect.x + dx - pad;
        const y = z.rect.y + dy - pad;
        const w = z.rect.width + pad * 2;
        const h = z.rect.height + pad * 2;
        return `${x} ${y} ${w} ${h}`;
      }
      return z.viewBox;
    }
    
    if (activeView.type === 'zone' && activeView.id && zonesById[activeView.id]) {
      const z = zonesById[activeView.id];
      if (z.rect) {
        const pad = 20;
        const dx = z.offset?.dx || 0;
        const dy = z.offset?.dy || 0;
        const x = z.rect.x + dx - pad;
        const y = z.rect.y + dy - pad;
        const w = z.rect.width + pad * 2;
        const h = z.rect.height + pad * 2;
        return `${x} ${y} ${w} ${h}`;
      }
      return z.viewBox;
    }
    // Removed asset zoom functionality - assets selected from sidebar won't zoom
    return defaultViewBox;
  }, [activeView, assetsById, zonesById, defaultViewBox, selectedRackZoneId]);


  useEffect(() => {
    if (selectedZoneId) setActiveView({ type: 'zone', id: selectedZoneId });
  }, [selectedZoneId]);

  useEffect(() => {
    if (selectedAssetId) setActiveView((v) => (v.type === 'zone' ? v : { type: 'asset', id: selectedAssetId }));
  }, [selectedAssetId]);


  const resetToFull = () => {
    setActiveView({ type: 'default', id: null });
    if (onZoneSelect) onZoneSelect(null);
    if (onRackSelect) onRackSelect(null);
    if (onAssetSelect) onAssetSelect(null);
    if (onClearAnomalies) onClearAnomalies();
  };


  return (
    <div className="h-full w-full bg-gray-900 relative">
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <button
          onClick={resetToFull}
          className="px-3 py-1.5 rounded-md text-sm bg-gray-800 text-gray-100 border border-gray-700 hover:bg-gray-700"
        >
          Full Map
        </button>
        {activeView.type !== 'default' && (
          <button
            onClick={resetToFull}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-800 text-gray-100 border border-gray-700 hover:bg-gray-700"
          >
            Reset View
          </button>
        )}
      </div>
      <motion.svg
        className="h-full w-full"
        viewBox={viewBox}
        animate={{
          // Framer Motion cannot animate viewBox directly as an object in all cases; using string works.
          // We still attach transition for smoothness when React updates prop.
          viewBox,
        }}
        transition={spring}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background grid covering the default view bounds */}
        {/* Click background to reset to full view */}
        {(() => {
          const [vx, vy, vw, vh] = defaultViewBox.split(' ').map(Number);
          return (
            <rect x={vx} y={vy} width={vw} height={vh} fill="#0f172a" onClick={resetToFull} />
          );
        })()}

        {/* Warehouse outline behind elements (non-rectangular, buffered) */}
        {outlinePath && (
          <g>
            <path d={outlinePath} fill="rgba(59,130,246,0.06)" stroke="#60a5fa" strokeWidth={3} strokeLinejoin="miter" />
          </g>
        )}

        {/* Blueprint static elements */}
        {data.blueprint?.hallways?.map(h => (
          <rect key={h.id} x={h.x} y={h.y} width={h.width} height={h.height} fill="#0b1220" stroke="#1f2937" strokeWidth={1} />
        ))}
        {data.blueprint?.walls?.map(w => (
          <line key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#7aa7f9" strokeWidth={2} />
        ))}
        {data.blueprint?.offices?.map(o => (
          <g key={o.id}>
            <rect x={o.x} y={o.y} width={o.width} height={o.height} rx={6} ry={6} fill="#0b1220" stroke="#64748b" strokeWidth={1} />
            <text x={o.x + o.width/2} y={o.y + o.height/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#94a3b8">Office</text>
          </g>
        ))}
        {data.blueprint?.bathrooms?.map(b => (
          <g key={b.id}>
            <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={6} ry={6} fill="#0b1220" stroke="#94a3b8" strokeWidth={1} />
            <text x={b.x + b.width/2} y={b.y + b.height/2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#cbd5e1">WC</text>
          </g>
        ))}
        {data.blueprint?.conferenceRooms?.map(c => (
          <g key={c.id}>
            <rect x={c.x} y={c.y} width={c.width} height={c.height} rx={8} ry={8} fill="#0b1220" stroke="#93c5fd" strokeWidth={1} />
            <text x={c.x + c.width/2} y={c.y + c.height/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#bfdbfe">Conference</text>
          </g>
        ))}

        {/* Zones and Rows */}
        {data.zones.map((zone) => {
          const zoneOpacity = getZoneOpacity(zone.id);
          const isHovered = hoveredZoneId === zone.id;
          const isSelectedZone = zone.id === selectedAssetZoneId;
          
          return (
            <g
              key={zone.id}
              onClick={() => { setActiveView({ type: 'zone', id: zone.id }); if (onZoneSelect) onZoneSelect(zone.id); }}
              onMouseEnter={() => setHoveredZoneId(zone.id)}
              onMouseLeave={() => setHoveredZoneId((id) => (id === zone.id ? null : id))}
              className="cursor-pointer"
              transform={`translate(${zone.offset?.dx || 0}, ${zone.offset?.dy || 0})`}
            >
              {zone.rect ? (
                <motion.rect
                  x={zone.rect.x}
                  y={zone.rect.y}
                  width={zone.rect.width}
                  height={zone.rect.height}
                  rx={10}
                  ry={10}
                  fill={zone.color}
                  stroke={zone.borderColor}
                  animate={{
                    strokeWidth: isHovered ? 3 : (isSelectedZone ? 3 : 2),
                    opacity: isHovered ? 0.9 : zoneOpacity,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                />
              ) : (
                <motion.path
                  d={zone.path}
                  fill={zone.color}
                  stroke={zone.borderColor}
                  animate={{
                    strokeWidth: isHovered ? 3 : (isSelectedZone ? 3 : 2),
                    opacity: isHovered ? 0.9 : zoneOpacity,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                />
              )}
              {/* Zone name that fades in/out on hover */}
              <motion.text
                x={zone.rect ? zone.rect.x + zone.rect.width/2 : zone.labelPos?.x || 0}
                y={zone.rect ? zone.rect.y + zone.rect.height/2 : zone.labelPos?.y || 0}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight="500"
                fill="#e2e8f0"
                stroke="#1e293b"
                strokeWidth={1}
                paintOrder="stroke"
                animate={{
                  opacity: isHovered && activeView.type === 'default' ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                pointerEvents="none"
              >
                {zone.name}
              </motion.text>
            </g>
          );
        })}


        {/* Assets */}
        {data.assets.map((a) => {
          const { dx, dy } = getZoneOffset(a.zoneId);
          const cx = a.position.x + dx;
          const cy = a.position.y + dy;
          const isSelected = selectedAssetId === a.id;
          const isInSelectedRack = selectedRackAssets.some(asset => asset.id === a.id);
          const isTypeMatch = selectedAssetType ? a.assetType === selectedAssetType : true;
          
          // Selected type: ping all matches and hide others
          const shouldPing = selectedAssetType ? isTypeMatch : isSelected;
          
          const baseR = (isSelected || isInSelectedRack || (selectedAssetType && isTypeMatch)) ? 3 : 1;
          // If this asset is of the active type that has anomalies, optionally dim normal dots to make anomaly pings stand out
          const hasActiveType = selectedAssetType || selectedAssetId;
          const fill = selectedAssetType
            ? (isTypeMatch ? '#22c55e' : '#9ca3af')
            : (isSelected ? '#22c55e' : (isInSelectedRack ? '#3b82f6' : '#9ca3af'));
          const dimOpacityByType = selectedAssetType && !isTypeMatch ? 0.2 : 1;
          // Dim level to match asset-type filter behavior when anomaly filter is active
          const dimOpacityByAnomaly = selectedAnomaly ? 0.08 : (anomalyFilter ? 0.2 : 1);
          const finalOpacity = dimOpacityByType * dimOpacityByAnomaly;
          
          return (
            <g key={a.id} className="cursor-pointer" opacity={finalOpacity} onClick={() => { if (onAssetSelect) onAssetSelect(a.id); }}>
              {/* ping ring when selected only */}
              {shouldPing && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={baseR}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={2}
                  initial={{ r: baseR + 1, opacity: 0.9 }}
                  animate={{ r: baseR + 8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                />
              )}
              {/* main dot */}
              <circle cx={cx} cy={cy} r={baseR} fill={fill} />
            </g>
          );
        })}

        {/* Anomaly markers: missing (red) and in-transit (orange).
            Show when:
            - An asset type is selected (pings anomalies for that type), or
            - An individual asset is selected (pings anomalies for that asset's type), or
            - Global anomaly filter is active (pings all anomalies of the selected category). */}
        {(() => {
          const anomalies = data.anomalies || {};
          const makePing = (cx, cy, color) => (
            <g>
              <motion.circle
                cx={cx}
                cy={cy}
                r={5}
                fill="none"
                stroke={color}
                strokeWidth={2}
                initial={{ r: 6, opacity: 0.9 }}
                animate={{ r: 16, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
              />
              <circle cx={cx} cy={cy} r={2.4} fill={color} />
            </g>
          );
          const items = [];
          // If a specific anomaly is selected, only render that one
          if (selectedAnomaly) {
            const color = selectedAnomaly.category === 'missing' ? '#ef4444' : '#fb923c';
            const { dx, dy } = getZoneOffset(selectedAnomaly.zoneId);
            items.push(
              <g key={`sel-${selectedAnomaly.type}-${selectedAnomaly.category}-${selectedAnomaly.position.x}-${selectedAnomaly.position.y}`}>
                {makePing(selectedAnomaly.position.x + dx, selectedAnomaly.position.y + dy, color)}
              </g>
            );
            return items;
          }
          // Global anomaly filter takes precedence
          if (anomalyFilter === 'missing' || anomalyFilter === 'inTransit') {
            const color = anomalyFilter === 'missing' ? '#ef4444' : '#fb923c';
            for (const [type, group] of Object.entries(anomalies)) {
              const list = anomalyFilter === 'missing' ? group.missing || [] : group.inTransit || [];
              for (const a of list) {
                const { dx, dy } = getZoneOffset(a.zoneId);
                items.push(
                  <g key={`glob-${anomalyFilter}-${type}-${a.position.x}-${a.position.y}`}>
                    {makePing(a.position.x + dx, a.position.y + dy, color)}
                  </g>
                );
              }
            }
            return items;
          }
          // Else decide which type's anomalies to show (by selection)
          let activeType = selectedAssetType;
          if (!activeType && selectedAssetId) {
            const asset = assetsById[selectedAssetId];
            activeType = asset?.assetType || null;
          }
          if (!activeType || !anomalies[activeType]) return null;
          const group = anomalies[activeType];
          // missing -> red
          for (const m of group.missing || []) {
            const { dx, dy } = getZoneOffset(m.zoneId);
            items.push(
              <g key={`miss-${activeType}-${m.position.x}-${m.position.y}`}>
                {makePing(m.position.x + dx, m.position.y + dy, '#ef4444')}
              </g>
            );
          }
          // inTransit -> orange
          for (const t of group.inTransit || []) {
            const { dx, dy } = getZoneOffset(t.zoneId);
            items.push(
              <g key={`transit-${activeType}-${t.position.x}-${t.position.y}`}>
                {makePing(t.position.x + dx, t.position.y + dy, '#fb923c')}
              </g>
            );
          }
          return items;
        })()}


      </motion.svg>
    </div>
  );
}



