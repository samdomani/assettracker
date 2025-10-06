import { useMemo, useState, useEffect } from 'react';

export default function Sidebar({ data, selectedZoneId, selectedRackId, selectedAssetType, anomalyFilter, selectedAnomaly, onZoneSelect, onAssetSelect, onRackSelect, onAssetTypeSelect, onAnomalyFilterChange, onAnomalySelect }) {
  const [query, setQuery] = useState('');
  const [expandedZoneId, setExpandedZoneId] = useState(null);
  const [expandedRackId, setExpandedRackId] = useState(null);
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [anomaliesExpanded, setAnomaliesExpanded] = useState(true);

  const zonesById = useMemo(() => Object.fromEntries(data.zones.map(z => [z.id, z])), [data.zones]);

  // Group assets by zone and then by rack within each zone
  const groupedAssets = useMemo(() => {
    const q = query.toLowerCase();
    const filteredAssets = data.assets.filter(a => a.id.toLowerCase().includes(q));
    
    const zoneMap = new Map();
    for (const z of data.zones) {
      const rackMap = new Map();
      // Initialize with all racks for this zone
      if (z.rows) {
        for (const rack of z.rows) {
          rackMap.set(rack.id, []);
        }
      }
      zoneMap.set(z.id, rackMap);
    }
    
    // Group assets by zone and rack
    for (const a of filteredAssets) {
      if (a.rowId && zoneMap.has(a.zoneId)) {
        const rackMap = zoneMap.get(a.zoneId);
        if (rackMap.has(a.rowId)) {
          rackMap.get(a.rowId).push(a);
        }
      }
    }
    
    return zoneMap; // Map<zoneId, Map<rackId, Asset[]>>
  }, [data.assets, data.zones, query]);

  const anomalyLists = useMemo(() => {
    const result = { missing: [], inTransit: [] };
    const anomalies = data.anomalies || {};
    for (const [type, group] of Object.entries(anomalies)) {
      for (const m of group.missing || []) {
        result.missing.push({ ...m, category: 'missing' });
      }
      for (const t of group.inTransit || []) {
        result.inTransit.push({ ...t, category: 'inTransit' });
      }
    }
    return result;
  }, [data.anomalies]);

  const renderAnomalyItem = (item, idx) => {
    const zoneName = item.zoneId ? (zonesById[item.zoneId]?.name || item.zoneId) : 'Outside Zones';
    const isSelected = selectedAnomaly && selectedAnomaly.type === item.assetType && selectedAnomaly.category === item.category && selectedAnomaly.position.x === item.position.x && selectedAnomaly.position.y === item.position.y && selectedAnomaly.zoneId === item.zoneId;
    return (
      <div
        key={`${item.assetType}-${item.category}-${idx}`}
        className={`rounded-md p-2 ${isSelected ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-700/60 hover:bg-gray-700 border border-gray-700'} cursor-pointer`}
        onClick={() => {
          if (isSelected) {
            onAnomalySelect(null);
          } else {
            onAnomalySelect({ type: item.assetType, category: item.category, zoneId: item.zoneId, position: item.position });
          }
        }}
      >
        <div className="flex items-center gap-2 text-sm text-gray-100">
          <img src={`/asset_images/${item.image || ''}`} alt={item.assetType} className="w-5 h-5 object-contain" />
          <span className="font-medium">{item.assetType}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          <span className="text-gray-300">Status:</span> <span className={`${item.status === 'Missing' ? 'text-red-300' : 'text-amber-300'}`}>{item.status}</span> • <span className="text-gray-300">Zone:</span> {zoneName}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl shadow-2xl backdrop-blur bg-gray-900/70 border border-gray-700 overflow-hidden">
      <div className="p-3 border-b border-gray-800">
        <div className="text-sm font-medium text-gray-200">Location</div>
        <div className="mt-2">
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="Search asset ID..."
            className="w-full px-3 py-2 bg-gray-800/70 text-gray-100 rounded-md outline-none border border-gray-700 focus:border-gray-500"
          />
        </div>
      </div>

      <div className="p-3 overflow-y-auto no-scrollbar max-h-[70vh] space-y-3">
        <div className="text-xs uppercase text-gray-400">Zones</div>
        <div className="mt-2 space-y-2">
          {data.zones.map(z => {
            const rackMap = groupedAssets.get(z.id) || new Map();
            const totalAssets = Array.from(rackMap.values()).flat().length;
            const isExpanded = expandedZoneId === z.id;
            
            return (
              <div key={z.id} className="rounded-md border" style={{ borderColor: z.borderColor }}>
                <div
                  className="px-3 py-2 rounded-t-md flex items-center justify-between cursor-pointer"
                  style={{ backgroundColor: z.color }}
                  onClick={() => {
                    setExpandedZoneId(prev => (prev === z.id ? null : z.id));
                    if (expandedZoneId === z.id) {
                      setExpandedRackId(null); // Close rack when closing zone
                    }
                  }}
                >
                  <div className="text-sm font-medium text-gray-100">{z.name} <span className="text-xs text-gray-200">({totalAssets})</span></div>
                  <div className="text-xs text-gray-100">{isExpanded ? 'Hide' : 'Show'}</div>
                </div>
                {isExpanded && (
                  <div className="p-2 space-y-2 bg-gray-900/60 max-h-60 overflow-y-auto no-scrollbar">
                    {z.rows && z.rows.length > 0 ? (
                      z.rows.map(rack => {
                        const rackAssets = rackMap.get(rack.id) || [];
                        const isRackExpanded = expandedRackId === rack.id;
                        
                        return (
                          <div key={rack.id} className="bg-gray-800/40 rounded-md border border-gray-700">
                            <div
                              className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-800/60"
                              onClick={() => {
                                setExpandedRackId(prev => (prev === rack.id ? null : rack.id));
                                // Select rack to ping all assets in it
                                onRackSelect(rack.id);
                              }}
                            >
                              <div className="text-sm text-gray-200">
                                Row {rack.id.split('-')[1]} <span className="text-xs text-gray-400">({rackAssets.length})</span>
                              </div>
                              <div className="text-xs text-gray-400">{isRackExpanded ? 'Hide' : 'Show'}</div>
                            </div>
                            {isRackExpanded && (
                              <div className="p-2 space-y-1 bg-gray-900/40">
                                {rackAssets.length === 0 ? (
                                  <div className="text-xs text-gray-400 px-2 py-1">No assets in this rack.</div>
                                ) : (
                                  rackAssets.map(a => (
                                    <div
                                      key={a.id}
                                      className="bg-gray-700/60 rounded-md p-2 hover:bg-gray-700 cursor-pointer"
                                    onClick={() => {
                                        onAssetSelect(a.id);
                                      }}
                                    >
                                      <div className="text-sm text-gray-100">{a.id}</div>
                                      <div className="text-xs text-gray-400">{a.status} • {a.assetType}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-400 px-2 py-1">No rows defined for this zone.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <div className="text-xs uppercase text-gray-400 flex items-center justify-between">
            <span>Assets</span>
            <button className="text-[11px] text-gray-300 hover:text-gray-100" onClick={() => setAssetsExpanded(v => !v)}>
              {assetsExpanded ? 'Hide' : 'Show'}
            </button>
          </div>
          {assetsExpanded && (
            <div className="mt-2 grid grid-cols-1 gap-2">
              {Array.from(new Set(data.assets.map(a => a.assetType))).sort().map(type => {
                const allOfType = data.assets.filter(a => a.assetType === type);
                const totalCount = allOfType.length;
                const anomaly = data.anomalies?.[type];
                const missingCount = anomaly?.missing?.length || 0;
                const transitCount = anomaly?.inTransit?.length || 0;
                return (
                  <button
                    key={type}
                    onClick={() => onAssetTypeSelect(type === selectedAssetType ? null : type)}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                      type === selectedAssetType
                        ? 'bg-blue-900/40 border-blue-500 text-blue-100'
                        : 'bg-gray-800/40 border-gray-700 text-gray-200 hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <img src={`/asset_images/${allOfType[0]?.image || ''}`} alt={type} className="w-5 h-5 object-contain" />
                      <span className="text-sm">{type}</span>
                      <div className="ml-auto flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-gray-700/70 text-gray-200">{totalCount}</span>
                        <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300">{missingCount}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">{transitCount}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Anomalies Section */}
        <div className="pt-3">
          <div className="text-xs uppercase text-gray-400 flex items-center justify-between">
            <span>Anomalies</span>
            <button className="text-[11px] text-gray-300 hover:text-gray-100" onClick={() => setAnomaliesExpanded(v => !v)}>
              {anomaliesExpanded ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className={`px-2.5 py-1 text-xs rounded-md border ${anomalyFilter === 'missing' ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-gray-800/40 border-gray-700 text-gray-200 hover:bg-gray-800/60'}`}
              onClick={() => onAnomalyFilterChange(anomalyFilter === 'missing' ? null : 'missing')}
            >
              Missing
            </button>
            <button
              className={`px-2.5 py-1 text-xs rounded-md border ${anomalyFilter === 'inTransit' ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-gray-800/40 border-gray-700 text-gray-200 hover:bg-gray-800/60'}`}
              onClick={() => onAnomalyFilterChange(anomalyFilter === 'inTransit' ? null : 'inTransit')}
            >
              In-Transit
            </button>
          </div>
          {anomaliesExpanded && (
            <div className="mt-2 space-y-2">
              {(anomalyFilter === 'missing' ? anomalyLists.missing : anomalyFilter === 'inTransit' ? anomalyLists.inTransit : []).map(renderAnomalyItem)}
              {anomalyFilter && (anomalyFilter === 'missing' ? anomalyLists.missing.length === 0 : anomalyLists.inTransit.length === 0) && (
                <div className="text-xs text-gray-400">No anomalies found.</div>
              )}
              {!anomalyFilter && (
                <div className="text-xs text-gray-400">Select an anomaly type to list them.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



