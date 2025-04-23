import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Buildings from './components/Buildings/Buildings';
import BuildingDetails from './components/Buildings/BuildingDetails';
import BuildingForm from './components/Buildings/BuildingForm';
import PrivateRoute from './components/Auth/PrivateRoute';
import './styles/App.css';
import AuthGuard from "./components/Auth/AuthGuard.jsx";

function App() {
    return (
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
                </Route>
                <Route path="/" element={<Login />} />
            </Routes>
        </div>
    );
}

export default App;