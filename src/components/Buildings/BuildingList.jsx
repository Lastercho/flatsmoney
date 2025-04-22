import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Използване на axios от utils
import '../../styles/BuildingList.css';

const BuildingList = ({ onBuildingSelect }) => {
  const [buildings, setBuildings] = useState([]);
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    total_floors: ''
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get('/auth/user');
        setUserId(response.data.id);
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await axios.get('/buildings');
      setBuildings(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на сградите:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/buildings', {
        ...newBuilding,
        userId
      });
      setNewBuilding({ name: '', address: '', total_floors: '' });
      fetchBuildings();
    } catch (error) {
      console.error('Грешка при добавяне на сграда:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/buildings/${id}`);
      fetchBuildings();
    } catch (error) {
      console.error('Грешка при изтриване на сграда:', error);
    }
  };

  const handleBuildingClick = (building) => {
    onBuildingSelect(building);
  };

  return (
    <div className="building-list">
      <h2>Управление на сгради</h2>
      
      <form onSubmit={handleSubmit} className="building-form">
        <input
          type="text"
          placeholder="Име на сградата"
          value={newBuilding.name}
          onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})}
        />
        <input
          type="text"
          placeholder="Адрес"
          value={newBuilding.address}
          onChange={(e) => setNewBuilding({...newBuilding, address: e.target.value})}
        />
        <input
          type="number"
          placeholder="Брой етажи"
          value={newBuilding.total_floors}
          onChange={(e) => setNewBuilding({...newBuilding, total_floors: e.target.value})}
        />
        <button type="submit">Добави сграда</button>
      </form>

      <div className="buildings-grid">
        {buildings
          .filter(building => building.userId === userId)
          .map(building => (
            <div 
              key={building.id} 
              className="building-card"
              onClick={() => handleBuildingClick(building)}
            >
              <h3>{building.name}</h3>
              <p>Адрес: {building.address}</p>
              <p>Етажи: {building.total_floors}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(building.id);
                }}
              >
                Изтрий
              </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingList;