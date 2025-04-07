import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Header.css';

const Header = () => {
  const location = useLocation();

  return (
    <header className="main-header">
      <nav className="nav-menu">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Начало
        </Link>
        <Link 
          to="/buildings" 
          className={`nav-link ${location.pathname === '/buildings' ? 'active' : ''}`}
        >
          Сгради
        </Link>
        <Link 
          to="/reports" 
          className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
        >
          Справки
        </Link>
      </nav>
    </header>
  );
};

export default Header; 