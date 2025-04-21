import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/BuildingList.css';

const BuildingList = ({ onBuildingSelect }) => {
  const [buildings, setBuildings] = useState([]);
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    total_floors: ''
  });
  const [userId, setUserId] = useState(null); // Add state for user ID

  useEffect(() => {
    // Fetch user ID from authentication context or API
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        const response = await axios.get(import.meta.env.VITE_API_BASE_URL,'/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
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
      const response = await axios.get(import.meta.env.VITE_API_BASE_URL,'/buildings');
      setBuildings(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на сградите:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL,'/buildings', {
        ...newBuilding,
        userId // Include user ID when creating a new building
      });
      setNewBuilding({ name: '', address: '', total_floors: '' });
      fetchBuildings();
    } catch (error) {
      console.error('Грешка при добавяне на сграда:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(import.meta.env.VITE_API_BASE_URL,`/buildings/${id}`);
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
          .filter(building => building.userId === userId) // Filter buildings by user ID
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