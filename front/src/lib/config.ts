/**
 * Configuración centralizada de la aplicación
 * Usa variables de entorno con fallbacks apropiados
 */

// URL de la API - Prioridad:
// 1. Variable de entorno NEXT_PUBLIC_API_URL
// 2. Fallback a la URL de Azure App Service (HTTPS)
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net';

// Configuración de autenticación
export const AUTH_CONFIG = {
  tokenKey: 'auth_credentials',
  userDataKey: 'user_data',
  tokenType: 'Basic',
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Sistema de Siniestros',
  version: '1.0.0',
  environment: process.env.NEXT_PUBLIC_ENV || 'production',
};

// Endpoints de la API
export const API_ENDPOINTS = {
  // Autenticación y usuarios
  usuarios: `${API_URL}/usuarios`,
  
  // Datos maestros
  tiposSiniestro: `${API_URL}/tiposiniestro`,
  tiposPerdida: `${API_URL}/tiposperdida`,
  sexos: `${API_URL}/sexos`,
  rangosEdad: `${API_URL}/rangosedad`,
  sucursales: `${API_URL}/sucursales`,
  zonas: `${API_URL}/zonas`,
  
  // Siniestros
  siniestros: `${API_URL}/siniestros`,
  
  // Estadísticas
  estadisticasGenerales: `${API_URL}/estadisticas/generales`,
  estadisticasPorTipo: `${API_URL}/estadisticas/por-tipo`,
  estadisticasPorSucursal: `${API_URL}/estadisticas/por-sucursal`,
  estadisticasPorMes: `${API_URL}/estadisticas/por-mes`,
  
  // Vistas especiales
  vistaSucursales: `${API_URL}/vista_sucursales`,
  
  // Sistema
  health: `${API_URL}/`,
  inicio: `${API_URL}/inicio`,
};

export default {
  API_URL,
  AUTH_CONFIG,
  APP_CONFIG,
  API_ENDPOINTS,
};
