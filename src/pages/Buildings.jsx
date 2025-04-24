import React, { useState } from 'react';
import BuildingList from '../components/Buildings/BuildingList';
import FloorList from '../components/Floors/FloorList';
import ApartmentList from '../components/Apartments/ApartmentList';
import BuildingDetails from '../components/Buildings/BuildingDetails';
import '../styles/Buildings.css';

const Buildings = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building);
    setSelectedFloor(null);
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
  };

  return (
    <div className="buildings-page">
      <BuildingList onBuildingSelect={handleBuildingSelect} />

      {selectedBuilding && (
        <>
          <FloorList 
            buildingId={selectedBuilding.id}
            onFloorSelect={handleFloorSelect}
          />
          <BuildingDetails buildingId={selectedBuilding.id} />
        </>
      )}

      {selectedFloor && (
        <ApartmentList floorId={selectedFloor.id} />
      )}
    </div>
  );
};

export default Buildings; 
