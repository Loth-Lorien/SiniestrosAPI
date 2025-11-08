import axios from 'axios';

// Configuración base de axios para la API de Siniestros
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar autenticación básica si está disponible
api.interceptors.request.use(
  (config) => {
    // Obtener credenciales del localStorage o cookies
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      
      if (username && password) {
        const credentials = btoa(`${username}:${password}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Limpiar credenciales y redirigir al login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        // Podrías agregar aquí lógica de redirección
        console.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
    }
    
    // Manejar otros errores
    const message = error.response?.data?.mensaje || 
                   error.response?.data?.detail || 
                   error.message || 
                   'Error desconocido';
    
    console.error('Error en la API:', message);
    return Promise.reject(error);
  }
);

export default api;

// Funciones de utilidad para autenticación
export const setAuth = (username: string, password: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
  }
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!(localStorage.getItem('username') && localStorage.getItem('password'));
  }
  return false;
};
