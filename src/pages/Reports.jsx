import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import PaymentHistoryReport from '../components/Reports/PaymentHistoryReport';
import '../styles/Reports.css';

const Reports = () => {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedBuildingExpenses, setSelectedBuildingExpenses] = useState(null);
  const [selectedBuildingUnpaidExpenses, setSelectedBuildingUnpaidExpenses] = useState(null);
  const [selectedBuildingPayments, setSelectedBuildingPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fiterType, setFilterType] = useState(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
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
      } catch (err) {
        setError('Възникна грешка при зареждане на сградите');
        console.error('Грешка:', err);
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  const handleBuildingSelectBuildingExpenses = (e) => {
    const buildingId = parseInt(e.target.value);
    setSelectedBuildingExpenses(buildingId || null);
    setSelectedBuilding(buildingId || null);
    setSelectedBuildingUnpaidExpenses( null);
    setSelectedBuildingPayments(null);
  };
  const handleBuildingSelectUnpaidExpenses = (e) => {
    const buildingId = parseInt(e.target.value);
    setSelectedBuildingUnpaidExpenses(buildingId || null);
    setSelectedBuilding(buildingId || null);
    setSelectedBuildingExpenses( null);
    setSelectedBuildingPayments( null);
  };
  const handleBuildingSelectPayments = (e) => {
    const buildingId = parseInt(e.target.value);
    setSelectedBuildingPayments(buildingId || null);
    setSelectedBuilding(buildingId || null);
    setSelectedBuildingExpenses(null);
    setSelectedBuildingUnpaidExpenses(null);
  };

  if (loading) {
    return (
      <>
        <div className="page-content">
          <div className="reports-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Зареждане на справки...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-content">
          <div className="reports-page">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn-retry">
                Опитай отново
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-content">
        <div className="reports-page">
          <h2>Справки</h2>
          <div className="reports-grid">
            <div className="report-card">
              <h3>Финансов отчет по сградите</h3>
              <p>Преглед на всички приходи и разходи по сградите, без депозитите</p>
              <div className="building-selector">
                <label>
                  Изберете сграда:
                  <select
                      value={selectedBuildingExpenses || ''}
                      onChange={(e) => {
                        handleBuildingSelectBuildingExpenses(e);
                        setFilterType('building_expenses');
                      }}
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

            <div className="report-card">
              <h3>Неплатени задължения за избрана сграда</h3>
              <p>Списък с всички неплатени задължения</p>
              <div className="building-selector">
                <label>
                  Изберете сграда:
                  <select
                      value={selectedBuildingUnpaidExpenses || ''}
                      onChange={(e) => {
                        handleBuildingSelectUnpaidExpenses(e);
                        setFilterType('unpaid_expenses');
                      }}
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
            <div className="report-card">
              <h3>История на плащанията</h3>
              <p>Генерирайте справка за всички плащания (депозити, задължения и разходи) за избрана сграда.</p>
              <div className="building-selector">
                <label>
                  Изберете сграда:
                  <select 
                    value={selectedBuildingPayments || ''}
                    onChange={(e) => {
                      handleBuildingSelectPayments(e);
                      setFilterType('payments');
                    }}
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
            <PaymentHistoryReport buildingId={selectedBuilding} filterType={fiterType}/>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;
