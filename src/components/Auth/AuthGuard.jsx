import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const RATE_LIMIT_WINDOW = 60000; // 1 минута
const MAX_REQUESTS = 10;

export default function AuthGuard() {
    const [isValid, setIsValid] = useState(true);
    const requestCountRef = useRef(0);
    const lastRequestTimeRef = useRef(Date.now());

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setIsValid(false);
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                localStorage.removeItem('token');
                setIsValid(false);
                return;
            }

            const now = Date.now();
            if (now - lastRequestTimeRef.current > RATE_LIMIT_WINDOW) {
                requestCountRef.current = 0;
                lastRequestTimeRef.current = now;
            }

            if (requestCountRef.current >= MAX_REQUESTS) {
                console.warn('Превишен лимит на заявки - моля, изчакайте');
                requestCountRef.current = 0;
                lastRequestTimeRef.current = now;
            } else {
                requestCountRef.current += 1;
            }

            setIsValid(true);
        } catch (error) {
            console.error('Грешка при валидация на токен:', error);
            localStorage.removeItem('token');
            setIsValid(false);
        }
    }, []); // Празен масив от зависимости, защото използваме refs

    if (!isValid) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}
