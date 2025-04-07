import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import '../../styles/Buildings.css';
import Reports from "../../pages/Reports.jsx";

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await axios.get('/buildings');
      const user = JSON.parse(localStorage.getItem('user')); // Parse the user data from localStorage
      const userId = user.id; // Extract the user ID
      const userBuildings = response.data.filter(building => building.created_by === userId);
      setBuildings(userBuildings);
      setLoading(false);
    } catch (error) {
      setError('Възникна грешка при зареждане на сградите');
      console.error('Грешка:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Зареждане...</div>;
  if (error) return <div className="error">{error}</div>;
  return (
    <div className="buildings-container">
      <div className="buildings-header">
        <h2>Моите сгради</h2>
        <Link to="/buildings/new" className="btn">
          Добави сграда
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div className="no-buildings">
          <p>Все още нямате добавени сгради.</p>
        </div>
      ) : (
        <div className="buildings-grid">
          {buildings.map(building => (
            <div key={building.id} className="building-card">
              <div className="building-card-header">
                <h3>{building.name}</h3>
              </div>
              <div className="building-card-body">
                <div className="building-info">
                  <p><strong>Адрес:</strong> {building.address}</p>
                  <p><strong>Етажи:</strong> {building.total_floors}</p>
                </div>
                <div className="building-actions">
                  <Link 
                    to={`/buildings/${building.id}`} 
                    className="btn"
                  >
                    Преглед
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Reports buildings={buildings} />
    </div>
  );
  
};

export default Buildings;