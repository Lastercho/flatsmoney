import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Използване на axios от utils
import * as XLSX from 'xlsx';
import '../../styles/Reports.css';
import { convertAmountByDate } from '../../utils/currency';

const PaymentHistoryReport = ({ buildingId, filterType }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [expenseTypes, setExpenseTypes] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' // all, deposits, obligations, expenses
  });
  const reportType = filterType;

  useEffect(() => {
    if (buildingId) {
      const loadData = async () => {
        try {
          setLoading(true);
          const expenseTypesResponse = await axios.get('/expense-types');
          // setExpenseTypes(expenseTypesResponse.data);
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

  // const getExpenseTypeName = (typeId) => {
  //   console.log('Търсене на тип разход с ID:', typeId);
  //   console.log('Налични типове разходи:', expenseTypes);
  //   const type = expenseTypes.find(t => t.id === typeId);
  //   console.log('Намерен тип разход:', type);
  //   return type ? type.name : 'Неизвестен тип';
  // };

  const fetchPaymentHistory = async (types) => {
    try {
      const floorsResponse = await axios.get(`/buildings/${buildingId}/floors`);
      const floors = floorsResponse.data;

      const apartmentsPromises = floors.map(floor =>
        axios.get(`/floors/${floor.id}/apartments`)
      );
      const apartmentsResponses = await Promise.all(apartmentsPromises);

      const allApartments = apartmentsResponses.flatMap(response => response.data);

      const depositsPromises = allApartments.map(apartment =>
        axios.get(`/apartments/${apartment.id}/deposits`).then(response => {
          return response.data.map(deposit => ({
            ...deposit,
            apartment_number: apartment.apartment_number,
            floor_number: apartment.floor_number,
            owner_name: apartment.owner_name,
            type: 'deposit'
          }));
        })
      );

      const obligationsPromises = allApartments.map(apartment =>
        axios.get(`/apartments/${apartment.id}/obligations`).then(response => {
          return response.data.map(obligation => ({
            ...obligation,
            apartment_number: apartment.apartment_number,
            floor_number: apartment.floor_number,
            owner_name: apartment.owner_name,
            type: 'obligation',
            date: obligation.due_date || obligation.date,
            amount: obligation.amount || obligation.amount,
            description: obligation.description || obligation.name,
            is_paid: obligation.is_paid,

          }));
        })
      );

      const expensesResponse = await axios.get(`/buildings/${buildingId}/expenses`);
      const expenses = expensesResponse.data.map(expense => {
        const type = types.find(t => t.id === expense.expense_type_id);
        const expenseTypeName = type ? type.name : 'Неизвестен тип';
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
        Promise.all(obligationsPromises),

      ]);

      const allPayments = [
        ...deposits.flat(),
        ...obligations.flat(),
        ...expenses
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      console.log(reportType)
      if (reportType==='building_expenses'){
        if (payment.type ==='obligation' && !payment.is_paid) return false;
        if (payment.type ==='deposit') return false;
      }
      if (reportType==='unpaid_expenses'){
        if (payment.type ==='obligation' && payment.is_paid) return false;
        if (payment.type ==='deposit') return false;
        if (payment.type ==='expense') return false;
      }
      if (reportType==='payments'){
        if (payment.type ==='obligation' && !payment.is_paid) return false;
      }
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
    const filteredData = filterPayments(payments).map(payment => {
      const dateRef = payment.date || payment.due_date;
      const displayAmount = convertAmountByDate(payment.amount, dateRef);
      return {
        'Тип': getPaymentTypeLabel(payment.type),
        'Дата': formatDate(payment.date),
        'Етаж': payment.floor_number || '-',
        'Апартамент': payment.apartment_number || '-',
        'Собственик': payment.owner_name || '-',
        'Описание': payment.description || '-',
        'Сума': formatAmount(displayAmount) + ' €'
      };
    });

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'История на плащанията');
    XLSX.writeFile(wb, 'История_на_плащанията.xlsx');
  };

  const revertPayment = async (payment) => {
    if (!window.confirm('Сигурни ли сте, че искате да върнете това задължение като неплатено?')) {
      return;
    }

    try {
      // Ако задължението е платено от депозит, възстановяваме депозита
      if (payment.is_paid_from_deposit) {
        await axios.post(`/apartments/${payment.apartment_id}/deposits`, {
          amount: payment.amount,
          date: new Date().toISOString().split('T')[0],
          description: 'Възстановен депозит след връщане на задължение'
        });
      }

      // Връщаме задължението като неплатено
      await axios.put(`/obligations/${payment.id}`, {
        is_paid: false,
        is_paid_from_deposit: false,
        payment_date: null
      });

      // Опресняваме данните
      const updatedPayments = payments.map((p) =>
        p.id === payment.id ? { ...p, is_paid: false, is_paid_from_deposit: false } : p
      );
      setPayments(updatedPayments);

      alert('Задължението беше успешно върнато като неплатено.');
    } catch (error) {
      console.error('Грешка при връщане на задължението като неплатено:', error);
      alert('Възникна грешка при връщане на задължението.');
    }
  };

  if (loading) {
    return <div className="report-container">Зареждане...</div>;
  }

  if (error) {
    return <div className="report-container error">{error}</div>;
  }

  const filteredPayments = filterPayments(payments);
  const totalAmount = filteredPayments.reduce((sum, payment) => {
    const dateRef = payment.date || payment.due_date;
    return sum + (convertAmountByDate(payment.amount, dateRef) || 0);
  }, 0
  );

  return (
    <div className="report-container">
      {reportType==='building_expenses' && (<h2>Финансов отчет на сградата</h2>)}
      {reportType==='unpaid_expenses' && (<h2>Неплатени задължения за избрана сграда</h2>)}
      {reportType==='payments' && (<h2>История на плащанията</h2>)}

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
        <p>Обща сума: {formatAmount(totalAmount)} €</p>
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
                <td>{formatAmount(convertAmountByDate(payment.amount, payment.date || payment.due_date))} €</td>
                {payment.type === 'obligation' && payment.is_paid && (
                  <td>
                    <button
                      className="revert-button"
                      onClick={() => revertPayment(payment)}
                    >
                      Изтрий
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryReport;