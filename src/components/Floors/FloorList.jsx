import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Използване на axios от utils
import '../../styles/FloorList.css';

const FloorList = ({ buildingId, onFloorSelect }) => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(null);
  const [newFloor, setNewFloor] = useState({
    floor_number: '',
    total_apartments: ''
  });

  useEffect(() => {
    if (buildingId) {
      fetchFloors();
      fetchBuilding();
    }
  }, [buildingId]);

  const fetchBuilding = async () => {
    try {
      const response = await axios.get(`/buildings/${buildingId}`);
      setBuilding(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на информацията за сградата:', error);
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await axios.get(`/buildings/${buildingId}/floors`);
      setFloors(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на етажите:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!building) {
      alert('Грешка: Информацията за сградата не е налична');
      return;
    }

    if (floors.length >= building.total_floors) {
      alert(`Не можете да добавите повече етажи. Максималният брой етажи за тази сграда е ${building.total_floors}`);
      return;
    }

    const floorExists = floors.some(floor => 
      floor.floor_number === parseInt(newFloor.floor_number) && !floor.is_deleted
    );
    if (floorExists) {
      alert(`Етаж ${newFloor.floor_number} вече съществува в тази сграда!`);
      return;
    }

    try {
      const floorData = {
        floor_number: parseInt(newFloor.floor_number),
        total_apartments: parseInt(newFloor.total_apartments)
      };
      
      await axios.post(`/buildings/${buildingId}/floors`, floorData);
      setNewFloor({ floor_number: '', total_apartments: '' });
      fetchFloors();
    } catch (error) {
      console.error('Грешка при добавяне на етаж:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Възникна грешка при добавяне на етаж!');
      }
    }
  };

  const handleDelete = async (floorId) => {
    try {
      await axios.delete(`/floors/${floorId}`);
      fetchFloors();
    } catch (error) {
      console.error('Грешка при изтриване на етаж:', error);
      alert('Възникна грешка при изтриване на етаж!');
    }
  };

  const handleFloorClick = (floor) => {
    onFloorSelect(floor);
  };

  if (loading) {
    return <div className="floor-list">Зареждане...</div>;
  }

  if (!buildingId) {
    return <div className="floor-list">Моля, изберете сграда</div>;
  }

  return (
    <div className="floor-list">
      <h2>Управление на етажи</h2>
      
      <form onSubmit={handleSubmit} className="floor-form">
        <div className="form-group">
          <input
            type="number"
            placeholder="Номер на етаж"
            value={newFloor.floor_number}
            onChange={(e) => setNewFloor({ ...newFloor, floor_number: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            placeholder="Брой апартаменти"
            value={newFloor.total_apartments}
            onChange={(e) => setNewFloor({ ...newFloor, total_apartments: e.target.value })}
            required
          />
        </div>
        <button type="submit">Добави етаж</button>
      </form>

      <div className="floors-grid">
        {floors.map(floor => (
          <div 
            key={floor.id} 
            className="floor-card"
            onClick={() => handleFloorClick(floor)}
          >
            <h3>Етаж {floor.floor_number}</h3>
            <p>Брой апартаменти: {floor.total_apartments}</p>
            <button 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(floor.id);
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

export default FloorList;