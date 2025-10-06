import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AnomalyInfo({ data, selectedAnomaly }) {
  const anomalyInfo = useMemo(() => {
    if (!selectedAnomaly) return null;
    
    // Find the asset type information from the assets data
    const assetType = data.assets.find(a => a.assetType === selectedAnomaly.type);
    if (!assetType) return null;
    
    const zonesById = Object.fromEntries(data.zones.map(z => [z.id, z]));
    const zone = selectedAnomaly.zoneId ? zonesById[selectedAnomaly.zoneId] : null;
    
    // Generate details similar to AssetInfo
    const itemNumber = `ITEM-${selectedAnomaly.type.replace(/\s+/g, '').slice(0, 4).toUpperCase()}-${Math.abs(selectedAnomaly.position.x + selectedAnomaly.position.y) % 1000}`;
    const quantity = 1; // Anomalies are typically individual items
    
    return {
      anomaly: selectedAnomaly,
      assetType,
      zone,
      itemNumber,
      quantity
    };
  }, [data, selectedAnomaly]);

  if (!anomalyInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-2xl shadow-2xl backdrop-blur bg-gray-900/70 border border-gray-700 overflow-hidden w-full"
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Large Image on top */}
          <div className="mb-4">
            {anomalyInfo.assetType.image ? (
              <img
                src={`/asset_images/${anomalyInfo.assetType.image}`}
                alt={anomalyInfo.anomaly.type}
                className="w-40 h-32 object-contain"
              />
            ) : null}
          </div>
          
          {/* Anomaly details with two-column layout */}
          <div className="space-y-3 w-full">
            <h3 className="text-lg font-semibold text-gray-100">
              {anomalyInfo.anomaly.type}
            </h3>
            
            {/* Anomaly Status Badge */}
            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                anomalyInfo.anomaly.category === 'missing' 
                  ? 'bg-red-900/40 text-red-300 border border-red-700' 
                  : 'bg-amber-900/40 text-amber-300 border border-amber-700'
              }`}>
                {anomalyInfo.anomaly.category === 'missing' ? 'Missing' : 'In Transit'}
              </span>
            </div>
            
            {/* Single-column layout */}
            <div className="text-sm text-gray-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Item #:</span>
                <span className="text-gray-200">{anomalyInfo.itemNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Position:</span>
                <span className="text-gray-200">({Math.round(anomalyInfo.anomaly.position.x)}, {Math.round(anomalyInfo.anomaly.position.y)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Quantity:</span>
                <span className="text-gray-200">{anomalyInfo.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Zone:</span>
                <span className="text-gray-200">{anomalyInfo.zone ? anomalyInfo.zone.name : 'Outside Zones'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Status:</span>
                <span className="text-gray-200">{anomalyInfo.anomaly.category === 'missing' ? 'Missing' : 'In Transit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Category:</span>
                <span className="text-gray-200">{anomalyInfo.assetType.category}</span>
              </div>
            </div>
            
            {/* Additional anomaly-specific information */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                {anomalyInfo.anomaly.category === 'missing' 
                  ? 'This asset is expected but not found at its designated location.'
                  : 'This asset is currently being moved between locations.'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
