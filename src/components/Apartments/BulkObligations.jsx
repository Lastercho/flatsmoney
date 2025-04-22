
import React, { useState } from 'react';
import axios from '../../utils/axios';
import '../../styles/BulkObligations.css';

const BulkObligations = ({ buildingId, onSuccess }) => {
    const [formData, setFormData] = useState({
        amount: '',
        due_date: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.due_date || !formData.description) {
            setMessage({ text: 'Моля, попълнете всички полета', type: 'error' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(`/buildings/${buildingId}/bulk-obligations`, formData);
            setIsLoading(false);
            setMessage({ text: 'Задълженията са добавени успешно!', type: 'success' });
            setFormData({
                amount: '',
                due_date: '',
                description: ''
            });

            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess();
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Грешка при добавяне на задължения:', error);
            setMessage({
                text: error.response?.data?.message || 'Възникна грешка при добавяне на задълженията',
                type: 'error'
            });
        }
    };

    return (
        <div className="bulk-obligations-container">
            <h3>Добавяне на задължение към всички апартаменти</h3>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bulk-obligations-form">
                <div className="form-group">
                    <label htmlFor="amount">Сума (лв.)</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Въведете сума"
                        min="0.01"
                        step="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="due_date">Краен срок</label>
                    <input
                        type="date"
                        id="due_date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Описание</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Напр. Такса общи части, Ремонт покрив и т.н."
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="bulk-obligations-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Добавяне...' : 'Добави задължение към всички апартаменти'}
                </button>
            </form>
        </div>
    );
};

export default BulkObligations;