import axios from 'axios';

// Determine the baseURL based on the environment
let baseURL;

// First check if there's an environment variable defined
if (import.meta.env.VITE_API_BASE_URL) {
  baseURL = import.meta.env.VITE_API_BASE_URL;
  console.log('Using environment variable for baseURL:', baseURL);
} 
// If no environment variable, determine based on hostname
else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development
  baseURL = 'http://localhost:5000/api';
} else {
  // Production environment (Docker container)
  baseURL = 'https://flatback.mandini.eu/api';
}

console.log('Using API baseURL:', baseURL);
const instance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`
  }
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request headers:', config.headers);
    } else {
      console.warn('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;