import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send HTTP-only cookies with cross-site requests
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor for attaching optional JWT token header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
