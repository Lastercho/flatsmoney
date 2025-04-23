import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function AuthGuard() {
    const token = localStorage.getItem('token');

    // Optional: Add token validation logic here if necessary
    if (!token) {
        console.log('No valid token found. Redirecting to login...');
        return <Navigate to="/login" />;
    }

    console.log('Token from localStorage:', token);
    return <Outlet />;
}
