import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import '../../styles/Buildings.css';

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await axios.get('/buildings');
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      if (!userId) {
        setError('Потребителска информация не е намерена. Моля, влезте отново в системата.');
        setLoading(false);
        return;
      }

      const userBuildings = response.data.filter(building => building.created_by === userId);
      setBuildings(userBuildings);
      setLoading(false);
    } catch (error) {
      setError('Възникна грешка при зареждане на сградите');
      console.error('Грешка:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await fetchBuildings();
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Минимално време за по-добро UX
    }
  };

  return (
    <>
      <div className="page-content">
        <div className="buildings-container">
          <div className="buildings-header">
            <div className="buildings-title">
              <h2>Моите сгради</h2>
              <p className="buildings-subtitle">
                Управлявайте вашите сгради и апартаменти
              </p>
            </div>
            <div className="buildings-actions">
              <button 
                onClick={handleRefresh} 
                className="btn-refresh" 
                disabled={refreshing || loading}
                title="Обнови списъка"
              >
                {refreshing ? '⟳' : '↻'}
              </button>
              <Link to="/chess" className="btn-add" title="Стартирай шах">
                <span className="btn-icon">♟️</span> Шах
              </Link>
              <Link to="/buildings/new" className="btn-add">
                <span className="btn-icon">+</span> Добави сграда
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Зареждане на сгради...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={handleRefresh} className="btn-retry">
                Опитай отново
              </button>
            </div>
          ) : buildings.length === 0 ? (
            <div className="no-buildings">
              <div className="empty-state-icon">🏢</div>
              <h3>Все още нямате добавени сгради</h3>
              <p>Започнете като добавите вашата първа сграда</p>
              <Link to="/buildings/new" className="btn-add-first">
                Добави първа сграда
              </Link>
            </div>
          ) : (
            <div className="buildings-grid">
              {buildings.map(building => (
                <div key={building.id} className="building-card">
                  <div className="building-card-header">
                    <h3>{building.name}</h3>
                    {building.description && (
                      <div className="building-description-tooltip" title={building.description}>
                        ℹ️
                      </div>
                    )}
                  </div>
                  <div className="building-card-body">
                    <div className="building-info">
                      <div className="info-row">
                        <span className="info-icon">📍</span>
                        <p><strong>Адрес:</strong> {building.address}</p>
                      </div>
                      <div className="info-row">
                        <span className="info-icon">🏢</span>
                        <p><strong>Етажи:</strong> {building.total_floors}</p>
                      </div>
                    </div>
                    <div className="building-actions">
                      <Link 
                        to={`/buildings/${building.id}`} 
                        className="btn-view"
                      >
                        Управление
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Buildings;
