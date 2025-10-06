import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AssetInfo({ data, selectedAssetId }) {
  const assetInfo = useMemo(() => {
    if (!selectedAssetId) return null;
    const asset = data.assets.find(a => a.id === selectedAssetId);
    if (!asset) return null;
    
    const zonesById = Object.fromEntries(data.zones.map(z => [z.id, z]));
    const zone = zonesById[asset.zoneId];
    
    // Generate placeholder details similar to the original popover
    const rackNumber = asset.rowId || 'Rack-NA';
    const itemNumber = `ITEM-${asset.id.slice(-4)}`;
    const quantity = Math.abs(((asset.id.charCodeAt(0) + asset.id.charCodeAt(asset.id.length - 1)) % 50)) + 1;
    
    return {
      asset,
      zone,
      rackNumber,
      itemNumber,
      quantity
    };
  }, [data, selectedAssetId]);

  if (!assetInfo) return null;

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
          {/* Large Image on top (no container) */}
          <div className="mb-4">
            {assetInfo.asset.image ? (
              <img
                src={`/asset_images/${assetInfo.asset.image}`}
                alt={assetInfo.asset.assetType || assetInfo.asset.id}
                className="w-40 h-32 object-contain"
              />
            ) : null}
          </div>
          
          {/* Asset details with two-column layout */}
          <div className="space-y-3 w-full">
            <h3 className="text-lg font-semibold text-gray-100">
              {assetInfo.asset.assetType || assetInfo.asset.id}
            </h3>
            
            {/* Single-column layout */}
            <div className="text-sm text-gray-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Item #:</span>
                <span className="text-gray-200">{assetInfo.itemNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Rack #:</span>
                <span className="text-gray-200">{assetInfo.rackNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Quantity:</span>
                <span className="text-gray-200">{assetInfo.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Zone:</span>
                <span className="text-gray-200">{assetInfo.zone?.name || assetInfo.asset.zoneId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Status:</span>
                <span className="text-gray-200">{assetInfo.asset.status}</span>
              </div>
              {assetInfo.asset.category && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Category:</span>
                  <span className="text-gray-200">{assetInfo.asset.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
