import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../../styles/Reports.css';

const PaymentHistoryReport = ({ buildingId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' // all, deposits, obligations, expenses
  });

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
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
    if (buildingId) {
      const loadData = async () => {
        try {
          setLoading(true);
          // Първо зареждаме типовете разходи
          const expenseTypesResponse = await axiosInstance.get(import.meta.env.VITE_API_BASE_URL,'/expense-types');
          console.log('Получени типове разходи:', expenseTypesResponse.data);
          setExpenseTypes(expenseTypesResponse.data);
          
          // След това зареждаме историята на плащанията
          await fetchPaymentHistory(expenseTypesResponse.data);
        } catch (err) {
          console.error('Грешка при зареждане на данните:', err);
          setError('Възникна грешка при зареждане на данните');
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [buildingId]);

  const getExpenseTypeName = (typeId) => {
    console.log('Търсене на тип разход с ID:', typeId);
    console.log('Налични типове разходи:', expenseTypes);
    const type = expenseTypes.find(t => t.id === typeId);
    console.log('Намерен тип разход:', type);
    return type ? type.name : 'Неизвестен тип';
  };

  const fetchPaymentHistory = async (types) => {
    try {
      // Вземане на депозити
      const floorsResponse = await axiosInstance.get(import.meta.env.VITE_API_BASE_URL,`/buildings/${buildingId}/floors`);
      const floors = floorsResponse.data;
      
      const apartmentsPromises = floors.map(floor =>
          axiosInstance.get(import.meta.env.VITE_API_BASE_URL,`/floors/${floor.id}/apartments`)
      );
      const apartmentsResponses = await Promise.all(apartmentsPromises);
      
      const allApartments = apartmentsResponses.flatMap(response => response.data);
      
      // Вземане на депозити за всеки апартамент
      const depositsPromises = allApartments.map(apartment =>
          axiosInstance.get(import.meta.env.VITE_API_BASE_URL,`/apartments/${apartment.id}/deposits`)
          .then(response => {
            return response.data.map(deposit => ({
              ...deposit,
              apartment_number: apartment.apartment_number,
              floor_number: apartment.floor_number,
              owner_name: apartment.owner_name,
              type: 'deposit'
            }));
          })
      );
      
      // Вземане на задължения
      const obligationsPromises = allApartments.map(apartment =>
          axiosInstance.get(import.meta.env.VITE_API_BASE_URL,`/apartments/${apartment.id}/obligations`)
          .then(response => {
            return response.data.map(obligation => ({
              ...obligation,
              apartment_number: apartment.apartment_number,
              floor_number: apartment.floor_number,
              owner_name: apartment.owner_name,
              type: 'obligation',
              date: obligation.due_date || obligation.date,
              amount: obligation.amount || obligation.price,
              description: obligation.description || obligation.name
            }));
          })
      );

      // Вземане на разходи
      const expensesResponse = await axiosInstance.get(import.meta.env.VITE_API_BASE_URL,`/buildings/${buildingId}/expenses`);
      console.log('Получени разходи:', expensesResponse.data);
      
      const expenses = expensesResponse.data.map(expense => {
        console.log('Обработка на разход:', expense);
        const type = types.find(t => t.id === expense.expense_type_id);
        const expenseTypeName = type ? type.name : 'Неизвестен тип';
        console.log('Име на тип разход:', expenseTypeName);
        
        return {
          ...expense,
          type: 'expense',
          date: expense.date,
          amount: expense.amount,
          description: `${expenseTypeName} - ${expense.description || expense.name}`,
          apartment_number: '-',
          floor_number: '-',
          owner_name: '-'
        };
      });

      const [deposits, obligations] = await Promise.all([
        Promise.all(depositsPromises),
        Promise.all(obligationsPromises)
      ]);

      const allPayments = [
        ...deposits.flat(),
        ...obligations.flat(),
        ...expenses
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('Всички плащания:', allPayments);
      setPayments(allPayments);
      setError(null);
    } catch (err) {
      console.error('Грешка при зареждане на историята на плащанията:', err);
      setError('Възникна грешка при зареждане на историята на плащанията');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filterPayments = (payments) => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
      const endDate = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;
      const typeMatch = filters.type === 'all' || payment.type === filters.type;

      const dateMatch = (!startDate || paymentDate >= startDate) && 
                       (!endDate || paymentDate <= endDate);

      return dateMatch && typeMatch;
    });
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Няма дата';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Невалидна дата:', dateString);
        return 'Невалидна дата';
      }
      return date.toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Грешка при форматиране на дата:', error, dateString);
      return 'Невалидна дата';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'deposit': return 'Депозит';
      case 'obligation': return 'Задължение';
      case 'expense': return 'Разход';
      default: return type;
    }
  };

  const exportToExcel = () => {
    const filteredData = filterPayments(payments).map(payment => ({
      'Тип': getPaymentTypeLabel(payment.type),
      'Дата': formatDate(payment.date),
      'Етаж': payment.floor_number || '-',
      'Апартамент': payment.apartment_number || '-',
      'Собственик': payment.owner_name || '-',
      'Описание': payment.description || '-',
      'Сума': formatAmount(payment.amount) + ' лв.'
    }));

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'История на плащанията');
    XLSX.writeFile(wb, 'История_на_плащанията.xlsx');
  };

  if (loading) {
    return <div className="report-container">Зареждане...</div>;
  }

  if (error) {
    return <div className="report-container error">{error}</div>;
  }

  const filteredPayments = filterPayments(payments);
  const totalAmount = filteredPayments.reduce((sum, payment) => 
    sum + parseFloat(payment.amount || 0), 0
  );

  return (
    <div className="report-container">
      <h2>История на плащанията</h2>

      <div className="filters-section">
        <div className="filter-group">
          <label>
            От дата:
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            До дата:
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            Тип:
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="all">Всички</option>
              <option value="deposit">Депозити</option>
              <option value="obligation">Задължения</option>
              <option value="expense">Разходи</option>
            </select>
          </label>
        </div>
        <button className="export-button" onClick={exportToExcel}>
          Експорт в Excel
        </button>
      </div>

      <div className="report-summary">
        <h3>Обобщение</h3>
        <p>Общо записи: {filteredPayments.length}</p>
        <p>Обща сума: {formatAmount(totalAmount)} лв.</p>
      </div>

      <div className="report-content">
        <table>
          <thead>
            <tr>
              <th>Тип</th>
              <th>Дата</th>
              <th>Етаж</th>
              <th>Апартамент</th>
              <th>Собственик</th>
              <th>Описание</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment, index) => (
              <tr key={`${payment.type}-${payment.id || index}`}>
                <td>{getPaymentTypeLabel(payment.type)}</td>
                <td>{formatDate(payment.date)}</td>
                <td>{payment.floor_number || '-'}</td>
                <td>{payment.apartment_number || '-'}</td>
                <td>{payment.owner_name || '-'}</td>
                <td>{payment.description || '-'}</td>
                <td>{formatAmount(payment.amount)} лв.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryReport; 