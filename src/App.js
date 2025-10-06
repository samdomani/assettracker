import './index.css';
import { useState } from 'react';
import WarehouseMap from './components/WarehouseMap';
import Sidebar from './components/Sidebar';
import AssetInfo from './components/AssetInfo';
import AnomalyInfo from './components/AnomalyInfo';
import { warehouseData } from './data/mockData';

function App() {
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [selectedRackId, setSelectedRackId] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [anomalyFilter, setAnomalyFilter] = useState(null); // 'missing' | 'inTransit' | null
  const [selectedAnomaly, setSelectedAnomaly] = useState(null); // { type, category, zoneId, position }

  // Clear rack selection when zone changes
  const clearAllSelections = () => {
    setSelectedAssetId(null);
    setSelectedZoneId(null);
    setSelectedRackId(null);
    setSelectedAssetType(null);
    setAnomalyFilter(null);
    setSelectedAnomaly(null);
  };

  const clearAnomalies = () => {
    setAnomalyFilter(null);
    setSelectedAnomaly(null);
  };

  const handleZoneSelect = (zoneId) => {
    clearAllSelections();
    setSelectedZoneId(zoneId);
  };

  const handleRackSelect = (rackId) => {
    clearAllSelections();
    setSelectedRackId(rackId);
  };

  const handleAssetSelect = (assetId) => {
    clearAllSelections();
    setSelectedAssetId(assetId);
  };

  const handleAssetTypeSelect = (assetType) => {
    clearAllSelections();
    setSelectedAssetType(assetType);
  };

  const handleAnomalyFilterChange = (filter) => {
    clearAllSelections();
    setAnomalyFilter(filter);
  };

  const handleAnomalySelect = (anomaly) => {
    // Don't clear anomaly filter when selecting a specific anomaly
    // Only clear other selections (assets, zones, etc.)
    setSelectedAssetId(null);
    setSelectedZoneId(null);
    setSelectedRackId(null);
    setSelectedAssetType(null);
    setSelectedAnomaly(anomaly);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <WarehouseMap
        data={warehouseData}
        selectedAssetId={selectedAssetId}
        selectedZoneId={selectedZoneId}
        selectedRackId={selectedRackId}
        selectedAssetType={selectedAssetType}
        anomalyFilter={anomalyFilter}
        selectedAnomaly={selectedAnomaly}
        onZoneSelect={handleZoneSelect}
        onAssetSelect={handleAssetSelect}
        onRackSelect={handleRackSelect}
        onClearAnomalies={clearAnomalies}
      />

      <div className="pointer-events-none absolute inset-0 p-4 sm:p-6 md:p-8 flex justify-end items-start">
        <div className="pointer-events-auto max-h-full max-w-[380px] w-full flex flex-col gap-4 overflow-y-auto no-scrollbar">
          <Sidebar
            data={warehouseData}
            selectedZoneId={selectedZoneId}
            selectedRackId={selectedRackId}
            selectedAssetType={selectedAssetType}
            anomalyFilter={anomalyFilter}
            selectedAnomaly={selectedAnomaly}
            onZoneSelect={handleZoneSelect}
            onAssetSelect={handleAssetSelect}
            onRackSelect={handleRackSelect}
            onAssetTypeSelect={handleAssetTypeSelect}
            onAnomalyFilterChange={handleAnomalyFilterChange}
            onAnomalySelect={handleAnomalySelect}
          />
          <AssetInfo
            data={warehouseData}
            selectedAssetId={selectedAssetId}
          />
          <AnomalyInfo
            data={warehouseData}
            selectedAnomaly={selectedAnomaly}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
