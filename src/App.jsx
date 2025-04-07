import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Buildings from './components/Buildings/Buildings';
import BuildingDetails from './components/Buildings/BuildingDetails';
import BuildingForm from './components/Buildings/BuildingForm';
import PrivateRoute from './components/Auth/PrivateRoute';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/buildings" 
            element={
              <PrivateRoute>
                <Buildings />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/buildings/new" 
            element={
              <PrivateRoute>
                <BuildingForm />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/buildings/:id" 
            element={
              <PrivateRoute>
                <BuildingDetails />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 