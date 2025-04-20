import React from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../Header/Header';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return (
    <>
      <Header />
      <div className="protected-content">
        <main className="page-content">
          {children}
        </main>
      </div>
    </>
  );
};

export default PrivateRoute; 