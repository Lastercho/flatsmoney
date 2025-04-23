import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Изчистване на данните за сесията
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Пренасочване към страницата за вход
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Помощник на домоуправителя</h1>
        <button className="logout-button" onClick={handleLogout}>
          Изход
        </button>
      </div>
    </header>
  );
};

export default Header;