import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import PrivateRoute from "./components/Auth/PrivateRoute";
import AuthGuard from "./components/Auth/AuthGuard.jsx";
import "./styles/App.css";

// Lazy load components
const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const Buildings = lazy(() => import("./components/Buildings/Buildings"));
const BuildingDetails = lazy(() => import("./components/Buildings/BuildingDetails"));
const BuildingForm = lazy(() => import("./components/Buildings/BuildingForm"));
const Reports = lazy(() => import("./pages/Reports"));

// Loading component
const Loading = () => <div className="loading">Зареждане...</div>;

const App = React.memo(() => {
  return (
    <ThemeProvider>
      <div className="app">
        <Suspense fallback={<Loading />}>
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
        </Suspense>
      </div>
    </ThemeProvider>
  );
});

export default App;
