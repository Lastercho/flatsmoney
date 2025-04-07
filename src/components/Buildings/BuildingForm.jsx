import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import '../../styles/BuildingForm.css';

const BuildingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_floors: '',
    description: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    console.log('Token before submit:', token); // Debug logging

    if (!token) {
      setError('Моля, влезте отново в системата');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('/buildings', formData);
      console.log('Building created:', response.data);
      navigate('/buildings');
    } catch (err) {
      console.error('Error creating building:', err.response?.data || err);
      setError(err.response?.data?.message || 'Грешка при създаване на сградата');
    }
  };

  return (
    <div className="building-form-container">
      <div className="building-form-header">
        <h2>Добави нова сграда</h2>
      </div>

      <form onSubmit={handleSubmit} className="building-form">
        <div className="form-group">
          <label htmlFor="name">Име на сградата</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Въведете име на сградата"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Адрес</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Въведете адрес"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="total_floors">Брой етажи</label>
          <input
            type="number"
            id="total_floors"
            name="total_floors"
            value={formData.total_floors}
            onChange={handleChange}
            placeholder="Въведете брой етажи"
            required
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Въведете описание на сградата"
            rows="4"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            Създай сграда
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/buildings')}
          >
            Отказ
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuildingForm; 