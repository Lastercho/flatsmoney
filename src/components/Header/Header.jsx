import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserName(userData.name || userData.email || 'Потребител');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('Потребител');
      }
    }
  }, []);

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
        <div className="header-left">
          <h1 className="header-title">Помощник на домоуправителя</h1>
        </div>
        <nav className="nav-menu">
          <NavLink to="/buildings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Сгради
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Справки
          </NavLink>
        </nav>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">Здравей, {userName}</span>
          </div>
          <button 
            className={`theme-toggle-button ${theme === 'dark' ? 'dark' : 'light'}`} 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Превключи към светла тема' : 'Превключи към тъмна тема'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Изход
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
