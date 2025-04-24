import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Buildings from './components/Buildings/Buildings';
import BuildingDetails from './components/Buildings/BuildingDetails';
import BuildingForm from './components/Buildings/BuildingForm';
import Reports from './pages/Reports';
import PrivateRoute from './components/Auth/PrivateRoute';
import './styles/App.css';
import AuthGuard from "./components/Auth/AuthGuard.jsx";
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <div className="app">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route element={<AuthGuard />}>
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
                        <Route
                            path="/reports"
                            element={
                                <PrivateRoute>
                                    <Reports />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/buildings" replace />} />
                    </Route>
                    <Route path="/" element={<Login />} />
                </Routes>
            </div>
        </ThemeProvider>
    );
}

export default App;
