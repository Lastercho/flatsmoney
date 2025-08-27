import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Използване на axios от utils
import '../../styles/BuildingExpenses.css';
import { convertAndFormat } from '../../utils/currency';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // показваме последните 10 записа

  useEffect(() => {
    if (buildingId) {
      fetchExpenses();
      fetchExpenseTypes();
    }
  }, [buildingId]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`/buildings/${buildingId}/expenses`);
      setExpenses(response.data);
      setCurrentPage(1); // винаги показваме най-новите при зареждане
      setError(null);
    } catch (err) {
      console.error('Грешка при зареждане на разходите:', err);
      setError('Възникна грешка при зареждане на разходите');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axios.get('/expense-types');
      setExpenseTypes(response.data);
      setError(null);
    } catch (err) {
      console.error('Грешка при зареждане на типовете разходи:', err);
      setError('Възникна грешка при зареждане на типовете разходи');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`/buildings/${buildingId}/expenses`, newExpense);
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
      console.error('Грешка при добавяне на разход:', err);
      alert('Възникна грешка при добавяне на разхода');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете този разход?')) {
      return;
    }

    try {
      await axios.delete(`/buildings/${buildingId}/expenses/${expenseId}`);
      await fetchExpenses();
      if (onExpenseChange) {
        onExpenseChange();
      }
      alert('Разходът е изтрит успешно!');
    } catch (err) {
      console.error('Грешка при изтриване на разход:', err);
      alert('Възникна грешка при изтриване на разхода');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bg-BG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Derived data: sort and paginate
  const sortedExpenses = [...expenses].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (db !== da) return db - da; // най-новите първо
    // tiebreaker by id if numeric
    const aid = typeof a.id === 'number' ? a.id : parseInt(a.id, 10);
    const bid = typeof b.id === 'number' ? b.id : parseInt(b.id, 10);
    if (!isNaN(aid) && !isNaN(bid)) return bid - aid;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentExpenses = sortedExpenses.slice(startIndex, startIndex + pageSize);

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
          onChange={(e) => setNewExpense({ ...newExpense, expense_type_id: e.target.value })}
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
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          min="0.01"
          step="0.01"
          required
        />

        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Описание"
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
        />

        <button type="submit">Добави разход</button>
      </form>

      <div className="expenses-list">
        {sortedExpenses.length === 0 ? (
          <div className="empty">Няма разходи</div>
        ) : (
          <>
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
                {currentExpenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td>{expense.expense_type_name}</td>
                    <td>{convertAndFormat(expense.amount, expense.date)} €</td>
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

            <div className="pagination" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Предишни
              </button>
              <span>Страница {safePage} от {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Следващи
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuildingExpenses;