import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import '../../styles/BuildingForm.css';

const BuildingEdit = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuildingDetails();
  }, [id]);

  const fetchBuildingDetails = async () => {
    try {
      const response = await axios.get(`/buildings/${id}`);
      setFormData({
        name: response.data.name,
        address: response.data.address,
        total_floors: response.data.total_floors,
        description: response.data.description || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching building details:', err);
      setError('Грешка при зареждане на детайлите за сградата');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axios.put(`/buildings/${id}`, formData);
      setSuccessMessage('Сградата е обновена успешно!');
      setTimeout(() => {
        navigate(`/buildings/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating building:', err.response?.data || err);
      setError(err.response?.data?.message || 'Грешка при обновяване на сградата');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Зареждане на детайли за сградата...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-content">
        <div className="building-form-container">
          <div className="building-form-header">
            <h2>Редактиране на сграда</h2>
            <p className="form-subtitle">Променете информацията за сградата</p>
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
                placeholder="Въведете адрес на сградата"
                required
                className={error && !formData.address ? 'input-error' : ''}
              />
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
                {isSubmitting ? 'Запазване...' : 'Запази промените'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(`/buildings/${id}`)}
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

export default BuildingEdit; 