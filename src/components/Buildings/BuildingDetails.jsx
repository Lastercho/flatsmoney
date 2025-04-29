import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import BuildingExpenses from './BuildingExpenses';
import '../../styles/BuildingDetails.css';
import ApartmentList from '../Apartments/ApartmentList';
import FloorList from '../Floors/FloorList';
import BulkObligations from "../Apartments/BulkObligations.jsx";

const BuildingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBulkObligations, setShowBulkObligations] = useState(false);
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    totalObligations: 0,
    totalExpenses: 0,
    availableAmount: 0
  });
  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]); // Добавяме state за етажите
  const [error, setError] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [refreshData, setRefreshData] = useState(false);
  useEffect(() => {
    fetchBuildingDetails();
  }, [id]);

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`/buildings/${id}/expenses`);
      setExpenses(response.data);
      return response.data;
    } catch (error) {
      console.error('Грешка при зареждане на разходите:', error);
      return [];
    }
  };
  const fetchRefreshes = async () => {
    setRefreshData(!refreshData);
  }

  const calculateSummary = (apartmentsData, expensesData = []) => {
    const totalDeposits = apartmentsData.reduce((sum, apartment) => 
      sum + (apartment.deposits?.reduce((depositSum, deposit) => 
        depositSum + (parseFloat(deposit.amount) || 0), 0) || 0), 0
    );

    const totalUnpaidObligations = apartmentsData.reduce((sum, apartment) => 
      sum + (apartment.obligations?.reduce((obligationSum, obligation) => 
        obligationSum + (!obligation.is_paid ? (parseFloat(obligation.amount) || 0) : 0), 0) || 0), 0
    );

    const totalPaidObligations = apartmentsData.reduce((sum, apartment) => 
      sum + (apartment.obligations?.reduce((obligationSum, obligation) => 
        obligationSum + (obligation.is_paid ? (parseFloat(obligation.amount) || 0) : 0), 0) || 0), 0
    );

    const totalExpenses = expensesData.reduce((sum, expense) => 
      sum + (parseFloat(expense.amount) || 0), 0
    );

    const availableAmount = totalDeposits + totalPaidObligations - totalExpenses;

    setSummary({
      totalDeposits,
      totalObligations: totalUnpaidObligations,
      totalExpenses,
      availableAmount
    });
  };

  const fetchAllApartments = async () => {
    try {
      setLoading(true);
      const [floorsResponse, expensesData] = await Promise.all([
        axios.get(`/buildings/${id}/floors`),
        fetchExpenses()
      ]);
      const floors = floorsResponse.data;

      const apartmentsPromises = floors.map(floor => 
        axios.get(`/floors/${floor.id}/apartments`)
      );
      const apartmentsResponses = await Promise.all(apartmentsPromises);
      
      const allApartments = apartmentsResponses.flatMap(response => response.data);
      const apartmentsWithDetails = await Promise.all(
        allApartments.map(async (apartment) => {
          const [depositsRes, obligationsRes] = await Promise.all([
            axios.get(`/apartments/${apartment.id}/deposits`),
            axios.get(`/apartments/${apartment.id}/obligations`)
          ]);

          return {
            ...apartment,
            deposits: depositsRes.data || [],
            obligations: obligationsRes.data || []
          };
        })
      );

      setApartments(apartmentsWithDetails);
      calculateSummary(apartmentsWithDetails, expensesData);
    } catch (error) {
      console.error('Грешка при зареждане на информацията:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (apartmentId, obligationId, obligationAmount) => {
    try {
      const depositsResponse = await axios.get(`/apartments/${apartmentId}/deposits`);
      const deposits = depositsResponse.data;

      const totalDeposits = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);

      if (totalDeposits >= obligationAmount) {
        for (const deposit of deposits) {
          await axios.delete(`/apartments/${apartmentId}/deposits/${deposit.id}`);
        }
  
        const remainingAmount = totalDeposits - obligationAmount;
        if (remainingAmount > 0) {
          await axios.post(`/apartments/${apartmentId}/deposits`, {
            amount: remainingAmount,
            date: new Date().toISOString().split('T')[0],
            description: 'Остатък след плащане на задължение'
          });
        }
  
        // Обновяване на задължението с paid_from_deposit: true
        await axios.put(`/obligations/${obligationId}`, {
          is_paid: true,
          is_paid_from_deposit: true, // Отбелязваме, че е платено от депозит
          payment_date: new Date().toISOString(),
        });
      } else {

      await axios.put(`/obligations/${obligationId}`, {
        is_paid: true,
        is_paid_from_deposit: false,
        payment_date: new Date().toISOString(),
      });
      }

      fetchAllApartments();
    } catch (error) {
      console.error('Грешка при плащане на задължение:', error);
      alert('Възникна грешка при плащане на задължението!');
    }
  };


  const handleRefreshData = () => {
    fetchBuildingDetails();
  };


  const fetchBuildingDetails = async () => {
    try {
      setLoading(true);
      const buildingResponse = await axios.get(`/buildings/${id}`);
      setBuilding(buildingResponse.data);

      const floorsResponse = await axios.get(`/buildings/${id}/floors`);
      setFloors(floorsResponse.data);

      await fetchAllApartments();
    } catch (error) {
      console.error('Грешка при зареждане на детайли за сградата:', error);
      setError('Възникна грешка при зареждане на детайли за сградата');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm('Сигурни ли сте, че искате да изтриете тази сграда? Всички свързани етажи и апартаменти също ще бъдат изтрити.');
    
    if (!isConfirmed) {
      return;
    }

    try {
      await axios.delete(`/buildings/${id}`);
      navigate('/buildings');
    } catch (error) {
      console.error('Грешка при изтриване на сграда:', error);
      setError('Възникна грешка при изтриване на集团有限公司');
    }
  };

  if (loading) return <div className="loading">Зареждане...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!building) return <div className="error">Сградата не е намерена</div>;

  return (
    <div className="building-details-container">
      <div className="building-header">
        <h2>{building.name}</h2>
        <div className="building-actions">
          <button 
            className="btn btn-edit"
            onClick={() => navigate(`/buildings/${id}/edit`)}
          >
            Редактирай
          </button>
          <button 
            className="btn btn-delete"
            onClick={handleDelete}
          >
            Изтрий
          </button>
          <button
            className="toggle-bulk-obligations"
            onClick={() => setShowBulkObligations(!showBulkObligations)}
          >
            {showBulkObligations ? 'Скрий' : 'Добави задължение към всички апартаменти'}
          </button>
          <button 
            className="btn btn-back"
            onClick={() => navigate('/buildings')}
          >
            Назад
          </button>
        </div>
        {showBulkObligations && (
          <BulkObligations
            buildingId={id}
            onSuccess={() => {
              handleRefreshData();
              setShowBulkObligations(false);
            }}
          />
        )}
      </div>

      <div className="building-info-card">
        <div className="info-group">
          <label>Адрес:</label>
          <p>{building.address}</p>
        </div>
        
        <div className="info-group">
          <label>Брой етажи:</label>
          <p>{building.total_floors}</p>
        </div>

        {building.description && (
          <div className="info-group">
            <label>Описание:</label>
            <p>{building.description}</p>
          </div>
        )}
      </div>

      <div className="summary-section">
        <h3>Обобщение</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Общо депозити:</span>
            <span className="amount">{formatAmount(summary.totalDeposits)} лв.</span>
          </div>
          <div className="summary-item">
            <span>Общо задължения:</span>
            <span className="amount">{formatAmount(summary.totalObligations)} лв.</span>
          </div>
          <div className="summary-item">
            <span>Общо разходи:</span>
            <span className="amount">{formatAmount(summary.totalExpenses)} лв.</span>
          </div>
          <div className="summary-item">
            <span>Налична сума:</span>
            <span className="amount">{formatAmount(summary.availableAmount)} лв.</span>
          </div>
        </div>
      </div>

      <div className="floors-section">
        <h3>Етажи</h3>
        <FloorList 
          buildingId={id} 
          onFloorSelect={(floor) => setSelectedFloor(floor)}
        />
      </div>

      {selectedFloor && (
        <div className="apartments-section">
          <h3>Апартаменти на етаж {selectedFloor.floor_number}</h3>
          {/* При добавяне на депозит или задължение в ApartmentList, ще предадем callback за обновяване: */}
          <ApartmentList
            floorId={selectedFloor.id}
            onDataChange={fetchAllApartments} // Предава се функция, която ще презареди всички апартаменти
          />
        </div>
      )}

      <div className="apartments-section">
        <h3>Апартаменти</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Етаж</th>
                <th>Апартамент №</th>
                <th>Собственик</th>
                <th>Площ (кв.м)</th>
                <th>Депозити</th>
                <th>Задължения</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {apartments.map(apartment => {
                const totalDeposits = apartment.deposits.reduce((sum, deposit) => 
                  sum + parseFloat(deposit.amount || 0), 0
                );
                const unpaidObligations = apartment.obligations.filter(o => !o.is_paid);
                const totalObligations = unpaidObligations.reduce((sum, obligation) => 
                  sum + parseFloat(obligation.amount || 0), 0
                );

                return (
                  <tr key={apartment.id}>
                    <td>{apartment.floor_number}</td>
                    <td>{apartment.apartment_number}</td>
                    <td>{apartment.owner_name}</td>
                    <td>{apartment.area}</td>
                    <td>{formatAmount(totalDeposits)} лв.</td>
                    <td>{formatAmount(totalObligations)} лв.</td>
                    <td>
                      {unpaidObligations.map(obligation => (
                        <button
                          key={obligation.id}
                          onClick={
                          () => {
                            handlePayment(apartment.id, obligation.id, parseFloat(obligation.amount));
                            fetchRefreshes();
                          }
                        }
                          className="payment-button"
                        >
                          Плати {formatAmount(obligation.amount)} лв.
                          <br />
                          <small>Краен срок: {new Date(obligation.due_date).toLocaleDateString()}</small>
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BuildingExpenses 
        buildingId={id} 
        onExpenseChange={() => {
          fetchAllApartments();
        }} 
      />
    </div>
  );
};

export default BuildingDetails;