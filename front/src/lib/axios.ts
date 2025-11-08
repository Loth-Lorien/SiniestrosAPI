import axios from 'axios';
import { API_URL } from './config';

// Configuración base del cliente HTTP
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir autenticación HTTP Basic Auth
apiClient.interceptors.request.use(
  (config) => {
    // Obtener credenciales de localStorage
    const authCredentials = localStorage.getItem('auth_credentials');
    
    // Endpoints públicos que no requieren autenticación
    const publicEndpoints = ['/', '/inicio', '/tiposiniestro', '/tiposperdida', '/sexos', '/rangosedad', '/sucursales', '/zonas'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (authCredentials && !isPublicEndpoint) {
      try {
        const { username, password } = JSON.parse(authCredentials);
        const basicAuth = btoa(`${username}:${password}`);
        config.headers.Authorization = `Basic ${basicAuth}`;
      } catch (error) {
        console.error('Error parsing auth credentials:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de autenticación HTTP Basic Auth
    if (error.response?.status === 401) {
      // Limpiar credenciales y datos guardados
      localStorage.removeItem('auth_credentials');
      localStorage.removeItem('user_data');
      
      // Redirigir a login si no estamos ya ahí
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
