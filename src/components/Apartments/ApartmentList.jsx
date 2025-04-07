import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/ApartmentList.css';

const ApartmentList = ({ floorId }) => {
  const [apartments, setApartments] = useState([]);
  const [floor, setFloor] = useState(null);
  const [newApartment, setNewApartment] = useState({
    apartment_number: '',
    owner_name: '',
    area: ''
  });
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [newDeposit, setNewDeposit] = useState({
    amount: '',
    date: '',
    description: ''
  });
  const [newObligation, setNewObligation] = useState({
    amount: '',
    due_date: '',
    description: ''
  });

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
    if (floorId) {
      fetchApartments();
      fetchFloorInfo();
    }
  }, [floorId]);

  useEffect(() => {
    if (selectedApartment) {
      fetchDepositsAndObligations();
    }
  }, [selectedApartment]);

  const fetchApartments = async () => {
    try {
      const response = await axiosInstance.get(`/floors/${floorId}/apartments`);
      setApartments(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на апартаментите:', error);
    }
  };

  const fetchFloorInfo = async () => {
    try {
      const response = await axiosInstance.get(`/floors/${floorId}`);
      setFloor(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на информацията за етажа:', error);
    }
  };

  const fetchDepositsAndObligations = async () => {
    try {
      const [depositsRes, obligationsRes] = await Promise.all([
        axiosInstance.get(`/apartments/${selectedApartment.id}/deposits`),
        axiosInstance.get(`/apartments/${selectedApartment.id}/obligations`)
      ]);
      setDeposits(depositsRes.data);
      setObligations(obligationsRes.data);
    } catch (error) {
      console.error('Грешка при зареждане на депозити и задължения:', error);
    }
  };

  const handleSubmitApartment = async (e) => {
    e.preventDefault();

    // Валидация на входните данни
    if (!newApartment.apartment_number.trim()) {
      alert('Моля, въведете номер на апартамента');
      return;
    }
    if (!newApartment.owner_name.trim()) {
      alert('Моля, въведете име на собственика');
      return;
    }
    if (!newApartment.area || parseFloat(newApartment.area) <= 0) {
      alert('Моля, въведете валидна площ (положително число)');
      return;
    }

    // Проверяваме дали вече има апартамент с този номер
    const existingApartment = apartments.find(
      apt => apt.apartment_number === newApartment.apartment_number
    );
    if (existingApartment) {
      alert('Апартамент с този номер вече съществува на този етаж');
      return;
    }

    try {
      const response = await axiosInstance.post(`/floors/${floorId}/apartments`, {
        ...newApartment,
        floor_id: floorId,
        apartment_number: newApartment.apartment_number.trim(),
        owner_name: newApartment.owner_name.trim(),
        area: parseFloat(newApartment.area)
      });
      
      setNewApartment({ apartment_number: '', owner_name: '', area: '' });
      fetchApartments();
      alert('Апартаментът е добавен успешно!');
    } catch (error) {
      console.error('Грешка при добавяне на апартамент:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else if (error.response?.status === 404) {
        alert('Етажът не е намерен. Моля, опреснете страницата.');
      } else if (error.response?.status === 409) {
        alert('Апартамент с този номер вече съществува на този етаж');
      } else {
        alert('Възникна грешка при добавяне на апартамента!');
      }
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/apartments/${selectedApartment.id}/deposits`, newDeposit);
      setNewDeposit({ amount: '', date: '', description: '' });
      fetchDepositsAndObligations();
    } catch (error) {
      console.error('Грешка при добавяне на депозит:', error);
    }
  };

  const handleSubmitObligation = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/apartments/${selectedApartment.id}/obligations`, newObligation);
      setNewObligation({ amount: '', due_date: '', description: '' });
      fetchDepositsAndObligations();
    } catch (error) {
      console.error('Грешка при добавяне на задължение:', error);
    }
  };

  const handleDeleteApartment = async (id) => {
    try {
      const response = await axiosInstance.delete(`http://localhost:5000/api/apartments/${id}`);
      alert(response.data.message);
      fetchApartments();
      if (selectedApartment && selectedApartment.id === id) {
        setSelectedApartment(null);
        setDeposits([]);
        setObligations([]);
      }
    } catch (error) {
      console.error('Грешка при изтриване на апартамент:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Възникна грешка при изтриване на апартамента!');
      }
    }
  };

  if (!floorId) {
    return <div className="apartment-list">Моля, изберете етаж</div>;
  }

  return (
    <div className="apartment-list">
      <h2>Управление на апартаменти - Етаж {floor?.floor_number}</h2>
      
      <form onSubmit={handleSubmitApartment} className="apartment-form">
        <input
          type="text"
          placeholder="Номер на апартамент"
          value={newApartment.apartment_number}
          onChange={(e) => setNewApartment({...newApartment, apartment_number: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Име на собственика"
          value={newApartment.owner_name}
          onChange={(e) => setNewApartment({...newApartment, owner_name: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Площ (кв.м)"
          value={newApartment.area}
          onChange={(e) => setNewApartment({...newApartment, area: e.target.value})}
          min="0.01"
          step="0.01"
          required
        />
        <button type="submit">Добави апартамент</button>
      </form>

      <div className="apartments-grid">
        {apartments.map(apartment => (
          <div 
            key={apartment.id} 
            className={`apartment-card ${selectedApartment?.id === apartment.id ? 'selected' : ''}`}
            onClick={() => setSelectedApartment(apartment)}
          >
            <h3>Апартамент {apartment.apartment_number}</h3>
            <p>Собственик: {apartment.owner_name}</p>
            <p>Площ: {apartment.area} кв.м</p>
            <button onClick={(e) => {
              e.stopPropagation();
              handleDeleteApartment(apartment.id);
            }}>Изтрий</button>
          </div>
        ))}
      </div>

      {selectedApartment && (
        <div className="apartment-details">
          <h3>Детайли за апартамент {selectedApartment.apartment_number}</h3>
          
          <div className="deposits-section">
            <h4>Депозити</h4>
            <form onSubmit={handleSubmitDeposit} className="deposit-form">
              <input
                type="number"
                placeholder="Сума"
                value={newDeposit.amount}
                onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
              />
              <input
                type="date"
                value={newDeposit.date}
                onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
              />
              <input
                type="text"
                placeholder="Описание"
                value={newDeposit.description}
                onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
              />
              <button type="submit">Добави депозит</button>
            </form>

            <div className="deposits-list">
              {deposits.map(deposit => (
                <div key={deposit.id} className="deposit-item">
                  <p>Сума: {deposit.amount} лв.</p>
                  <p>Дата: {new Date(deposit.date).toLocaleDateString()}</p>
                  <p>Описание: {deposit.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="obligations-section">
            <h4>Задължения</h4>
            <form onSubmit={handleSubmitObligation} className="obligation-form">
              <input
                type="number"
                placeholder="Сума"
                value={newObligation.amount}
                onChange={(e) => setNewObligation({...newObligation, amount: e.target.value})}
              />
              <input
                type="date"
                value={newObligation.due_date}
                onChange={(e) => setNewObligation({...newObligation, due_date: e.target.value})}
              />
              <input
                type="text"
                placeholder="Описание"
                value={newObligation.description}
                onChange={(e) => setNewObligation({...newObligation, description: e.target.value})}
              />
              <button type="submit">Добави задължение</button>
            </form>

            <div className="obligations-list">
              {obligations.filter(obligation => !obligation.is_paid).map(obligation => (
                <div key={obligation.id} className="obligation-item">
                  <p>Сума: {obligation.amount} лв.</p>
                  <p>Краен срок: {new Date(obligation.due_date).toLocaleDateString()}</p>
                  <p>Описание: {obligation.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApartmentList;