import React, { useState, useEffect } from 'react';

import PaymentHistoryReport from '../components/Reports/PaymentHistoryReport';
import '../styles/Reports.css';

const Reports = ({ buildings }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false); // Set loading to false since buildings are received as props
  }, [buildings]);

  const handleBuildingSelect = (e) => {
    const buildingId = parseInt(e.target.value);
    setSelectedBuilding(buildingId || null);
  };

  if (loading) {
    return <div className="reports-page">Зареждане...</div>;
  }

  if (error) {
    return <div className="reports-page error">{error}</div>;
  }

  return (
    <div className="reports-page">
      <h2>Справки</h2>
      <div className="reports-grid">
        <div className="report-card">
          <h3>Финансов отчет по сградите</h3>
          <p>Преглед на всички приходи и разходи по сградите</p>
          <button>Генерирай справка</button>
        </div>
        <div className="report-card">
          <h3>Задължения по апартаменти</h3>
          <p>Списък с всички неплатени задължения</p>
          <button>Генерирай справка</button>
        </div>
        <div className="report-card">
          <h3>История на плащанията</h3>
          <p>Генерирайте справка за всички плащания (депозити, задължения и разходи) за избрана сграда.</p>
          <div className="building-selector">
            <label>
              Изберете сграда:
              <select 
                value={selectedBuilding || ''} 
                onChange={handleBuildingSelect}
              >
                <option value="">Изберете сграда</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {selectedBuilding && (
        <PaymentHistoryReport buildingId={selectedBuilding} />
      )}
    </div>
  );
};

export default Reports;