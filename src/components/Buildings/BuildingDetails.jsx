import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import BuildingExpenses from './BuildingExpenses';
import '../../styles/BuildingDetails.css';
import ApartmentList from '../Apartments/ApartmentList';
import FloorList from '../Floors/FloorList';

const BuildingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    totalObligations: 0,
    totalExpenses: 0,
    availableAmount: 0
  });
  const [building, setBuilding] = useState(null);
  const [error, setError] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(null);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });

  useEffect(() => {
    fetchBuildingDetails();
  }, [id]);

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const fetchExpenses = async () => {
    try {
      const response = await axiosInstance.get(`/buildings/${id}/expenses`);
      setExpenses(response.data);
      return response.data;
    } catch (error) {
      console.error('Грешка при зареждане на разходите:', error);
      return [];
    }
  };

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
        axiosInstance.get(`/buildings/${id}/floors`),
        fetchExpenses()
      ]);
      const floors = floorsResponse.data;

      const apartmentsPromises = floors.map(floor => 
        axiosInstance.get(`/floors/${floor.id}/apartments`)
      );
      const apartmentsResponses = await Promise.all(apartmentsPromises);
      
      const allApartments = apartmentsResponses.flatMap(response => response.data);
      const apartmentsWithDetails = await Promise.all(
        allApartments.map(async (apartment) => {
          const [depositsRes, obligationsRes] = await Promise.all([
            axiosInstance.get(`/apartments/${apartment.id}/deposits`),
            axiosInstance.get(`/apartments/${apartment.id}/obligations`)
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
      // Взимаме всички депозити за апартамента
      const depositsResponse = await axiosInstance.get(`/apartments/${apartmentId}/deposits`);
      const deposits = depositsResponse.data;
      
      // Изчисляваме общата сума на депозитите
      const totalDeposits = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);

      // Ако има достатъчно депозити, използваме ги за плащането
      if (totalDeposits >= obligationAmount) {
        // Маркираме старите депозити като изтрити
        for (const deposit of deposits) {
          await axiosInstance.delete(`/apartments/${apartmentId}/deposits/${deposit.id}`);
        }

        // Създаваме нов депозит с остатъчната сума
        const remainingAmount = totalDeposits - obligationAmount;
        if (remainingAmount > 0) {
          await axiosInstance.post(`/apartments/${apartmentId}/deposits`, {
            amount: remainingAmount,
            date: new Date().toISOString().split('T')[0],
            description: 'Остатък след плащане на задължение'
          });
        }
      }

      // Маркираме задължението като платено
      await axiosInstance.put(`/obligations/${obligationId}`, {
        is_paid: true,
        payment_date: new Date().toISOString()
      });

      fetchAllApartments();
    } catch (error) {
      console.error('Грешка при плащане на задължение:', error);
      alert('Възникна грешка при плащане на задължението!');
    }
  };

  const fetchBuildingDetails = async () => {
    try {
      const response = await axiosInstance.get(`/buildings/${id}`);
      setBuilding(response.data);
      fetchAllApartments();
    } catch (err) {
      console.error('Error fetching building details:', err);
      setError('Грешка при зареждане на детайлите за сградата');
      setLoading(false);
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
            className="btn btn-back"
            onClick={() => navigate('/buildings')}
          >
            Назад
          </button>
        </div>
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
          <ApartmentList floorId={selectedFloor.id} />
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
                          onClick={() => handlePayment(apartment.id, obligation.id, parseFloat(obligation.amount))}
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