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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing again
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('/buildings', formData);
      console.log('Building created:', response.data);
      setSuccessMessage('Сградата е създадена успешно!');
      setTimeout(() => {
        navigate('/buildings');
      }, 1500);
    } catch (err) {
      console.error('Error creating building:', err.response?.data || err);
      setError(err.response?.data?.message || 'Грешка при създаване на сградата');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-content">
        <div className="building-form-container">
          <div className="building-form-header">
            <h2>Добави нова сграда</h2>
            <p className="form-subtitle">Попълнете информацията за новата сграда</p>
          </div>

          {successMessage && (
            <div className="success-message">
              <span>✓</span> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="building-form">
            <div className="form-group">
              <label htmlFor="name">
                Име на сградата <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Въведете име на сградата"
                required
                className={error && !formData.name ? 'input-error' : ''}
              />
              <small className="form-helper-text">Например: "Блок 15" или "Сграда Хоризонт"</small>
            </div>

            <div className="form-group">
              <label htmlFor="address">
                Адрес <span className="required">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Въведете адрес"
                required
                className={error && !formData.address ? 'input-error' : ''}
              />
              <small className="form-helper-text">Пълен адрес на сградата</small>
            </div>

            <div className="form-group">
              <label htmlFor="total_floors">
                Брой етажи <span className="required">*</span>
              </label>
              <input
                type="number"
                id="total_floors"
                name="total_floors"
                value={formData.total_floors}
                onChange={handleChange}
                placeholder="Въведете брой етажи"
                required
                min="1"
                className={error && !formData.total_floors ? 'input-error' : ''}
              />
              <small className="form-helper-text">Минимум 1 етаж</small>
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
              <small className="form-helper-text">Допълнителна информация за сградата (незадължително)</small>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Създаване...' : 'Създай сграда'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/buildings')}
                disabled={isSubmitting}
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BuildingForm;
