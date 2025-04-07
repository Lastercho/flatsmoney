import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/BuildingExpenses.css';

const BuildingExpenses = ({ buildingId, onExpenseChange }) => {
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [newExpense, setNewExpense] = useState({
    expense_type_id: '',
    amount: '',
    date: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    if (buildingId) {
      fetchExpenses();
      fetchExpenseTypes();
    }
  }, [buildingId]);

  const fetchExpenses = async () => {
    try {
      const response = await axiosInstance.get(`/buildings/${buildingId}/expenses`);
      setExpenses(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Неоторизиран достъп. Моля, влезте в системата.');
      } else {
        console.error('Грешка при зареждане на разходите:', err);
        setError('Възникна грешка при зареждане на разходите');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get('/expense-types');
      setExpenseTypes(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Неоторизиран достъп. Моля, влезте в системата.');
      } else {
        console.error('Грешка при зареждане на типовете разходи:', err);
        setError('Възникна грешка при зареждане на типовете разходи');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post(`/buildings/${buildingId}/expenses`, newExpense);
      setNewExpense({
        expense_type_id: '',
        amount: '',
        date: '',
        description: ''
      });
      await fetchExpenses();
      if (onExpenseChange) {
        onExpenseChange();
      }
      alert('Разходът е добавен успешно!');
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Неоторизиран достъп. Моля, влезте в системата.');
      } else {
        console.error('Грешка при добавяне на разход:', err);
        alert(err.response?.data?.error || 'Възникна грешка при добавяне на разхода');
      }
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете този разход?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/buildings/${buildingId}/expenses/${expenseId}`);
      await fetchExpenses();
      if (onExpenseChange) {
        onExpenseChange();
      }
      alert('Разходът е изтрит успешно!');
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Неоторизиран достъп. Моля, влезте в системата.');
      } else {
        console.error('Грешка при изтриване на разход:', err);
        alert('Възникна грешка при изтриване на разхода');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="building-expenses">Зареждане...</div>;
  }

  if (error) {
    return <div className="building-expenses error">{error}</div>;
  }

  return (
    <div className="building-expenses">
      <h2>Разходи на сградата</h2>

      <form onSubmit={handleSubmit} className="expense-form">
        <select
          value={newExpense.expense_type_id}
          onChange={(e) => setNewExpense({...newExpense, expense_type_id: e.target.value})}
          required
        >
          <option value="">Изберете тип разход</option>
          {expenseTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Сума"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
          min="0.01"
          step="0.01"
          required
        />

        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
          required
        />

        <input
          type="text"
          placeholder="Описание"
          value={newExpense.description}
          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
        />

        <button type="submit">Добави разход</button>
      </form>

      <div className="expenses-list">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип разход</th>
              <th>Сума</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.expense_type_name}</td>
                <td>{parseFloat(expense.amount).toFixed(2)} лв.</td>
                <td>{expense.description}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="delete-button"
                  >
                    Изтрий
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildingExpenses;