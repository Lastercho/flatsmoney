import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Използване на axios от utils
import '../../styles/ApartmentList.css';
import fetchRefreshes from '../../utils/fetchRefreshes';

const ApartmentList = ({ floorId , onDataChange}) => {
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
  // const [refreshData, setRefreshData] = useState(false);

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

  // const fetchRefreshes = async () => {
  //   setRefreshData(!refreshData);
  // }
  const fetchApartments = async () => {
    try {
      const response = await axios.get(`/floors/${floorId}/apartments`);
      setApartments(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на апартаментите:', error);
    }
  };

  const fetchFloorInfo = async () => {
    try {
      const response = await axios.get(`/floors/${floorId}`);
      setFloor(response.data);
    } catch (error) {
      console.error('Грешка при зареждане на информацията за етажа:', error);
    }
  };

  const fetchDepositsAndObligations = async () => {
    try {
      const [depositsRes, obligationsRes] = await Promise.all([
        axios.get(`/apartments/${selectedApartment.id}/deposits`),
        axios.get(`/apartments/${selectedApartment.id}/obligations`)
      ]);
      setDeposits(depositsRes.data);
      setObligations(obligationsRes.data);
    } catch (error) {
      console.error('Грешка при зареждане на депозити и задължения:', error);
    }
  };

  const handleSubmitApartment = async (e) => {
    e.preventDefault();

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

    const existingApartment = apartments.find(
      apt => apt.apartment_number === newApartment.apartment_number
    );
    if (existingApartment) {
      alert('Апартамент с този номер вече съществува на този етаж');
      return;
    }

    try {
      await axios.post(`/floors/${floorId}/apartments`, {
        ...newApartment,
        floor_id: floorId,
        apartment_number: newApartment.apartment_number.trim(),
        owner_name: newApartment.owner_name.trim(),
        area: parseFloat(newApartment.area)
      });

      setNewApartment({ apartment_number: '', owner_name: '', area: '' });
      await fetchApartments();
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
      await axios.post(`/apartments/${selectedApartment.id}/deposits`, newDeposit);
      setNewDeposit({ amount: '', date: '', description: '' });

      // Опресняване на данните за конкретния апартамент
      fetchDepositsAndObligations();
      if (onDataChange) onDataChange(); // Извиква callback за опресняване в BuildingDetails
    } catch (error) {
      console.error('Грешка при добавяне на депозит:', error);
    }
  };

  const handleSubmitObligation = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/apartments/${selectedApartment.id}/obligations`, newObligation);
      setNewObligation({ amount: '', due_date: '', description: '' });

      // Опресняване на данните за конкретния апартамент
      fetchDepositsAndObligations();
      if (onDataChange) onDataChange(); // Извиква callback за опресняване в BuildingDetails
    } catch (error) {
      console.error('Грешка при добавяне на задължение:', error);
    }
  };

  const handleDeleteDeposit = async (depositId) => {
    // Show a confirmation dialog
    const isConfirmed = window.confirm('Сигурни ли сте, че искате да изтриете този депозит?');

    if (!isConfirmed) {
      return; // Exit if the user cancels the action
    }

    try {
      await axios.delete(`/apartments/${selectedApartment.id}/deposits/${depositId}`);
      // Refresh the deposits list
      fetchDepositsAndObligations();
      if (onDataChange) onDataChange(); // Invoke callback for refreshing in BuildingDetails
    } catch (error) {
      console.error('Грешка при изтриване на депозит:', error);
      alert('Възникна грешка при изтриване на депозита!');
    }
  };

  const handleDeleteObligation = async (obligationId) => {
    // Show a confirmation dialog
    const isConfirmed = window.confirm('Сигурни ли сте, че искате да изтриете това задължение?');

    if (!isConfirmed) {
      return; // Exit if the user cancels the action
    }

    try {
      await axios.delete(`/apartments/${selectedApartment.id}/obligations/${obligationId}`);
      // Refresh the obligations list
      fetchDepositsAndObligations();
      if (onDataChange) onDataChange(); // Invoke callback for refreshing in BuildingDetails
    } catch (error) {
      
      console.error('Грешка при изтриване на задължение:', error);
      alert('Възникна грешка при изтриване на задължението!');
    }
  };



  const handleDeleteApartment = async (id) => {
    // Show a confirmation dialog
    const isConfirmed = window.confirm('Сигурни ли сте, че искате да изтриете този апартамент?');

    if (!isConfirmed) {
      return; // Exit if the user cancels the action
    }

    try {
      const response = await axios.delete(`/apartments/${id}`);
      alert(response.data.message);
      await fetchApartments();
      if (selectedApartment && selectedApartment.id === id) {
        setSelectedApartment(null);
        setDeposits([]);
        setObligations([]);
      }
    } catch (error) {
      console.error('Грешка при изтриване на апартамент:', error);
      if (error.response?.data?.error) {
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

      {floor && apartments.length < floor.total_apartments && (
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
      )}

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
                onChange={
                (e) =>{
                  setNewDeposit({...newDeposit, amount: e.target.value});
                  fetchRefreshes();
                }
                }
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
                  <p>Дата: {new Date(deposit.date).toLocaleDateString('bg-BG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                  <p>Описание: {deposit.description}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDeposit(deposit.id);
                    }}
                    className="delete-button"
                  >
                    Изтрий
                  </button>
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
                  <p>Краен срок: {new Date(obligation.due_date).toLocaleDateString('bg-BG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                  <p>Описание: {obligation.description}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObligation(obligation.id);
                    }}
                    className="delete-button"
                  >
                    Изтрий
                  </button>
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
