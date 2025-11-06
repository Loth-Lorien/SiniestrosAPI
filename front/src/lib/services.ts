import apiClient from './axios';
import {
  LoginCredentials,
  LoginResponse,
  CrearSiniestro,
  ActualizarSiniestro,
  RespuestaSimple,
  RespuestaConsultaSiniestro,
  RespuestaListaSiniestro,
  EstadisticasGenerales,
  EstadisticasPorTipo,
  EstadisticasPorSucursal,
  EstadisticasPorMes,
  EstadisticasPorTipoPerdida,
  DashboardCompleto,
  KPIsEjecutivos,
  DetallePerdida,
  DetalleImplicado,
  FiltrosEstadisticas,
  TipoSiniestro,
  TipoPerdida,
  Sucursal,
  Zona,
  Sexo,
  RangoEdad
} from '../types/api';

// ===========================
// Servicios de Autenticación
// ===========================
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('authService: Intentando login para usuario:', credentials.usuario);
      
      // Usar HTTP Basic Auth para probar la autenticación con el backend
      const basicAuth = btoa(`${credentials.usuario}:${credentials.password}`);
      
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/usuarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        }
      });
      
      if (!loginResponse.ok) {
        if (loginResponse.status === 401) {
          throw new Error('Credenciales inválidas');
        }
        throw new Error('Error de conexión con el servidor');
      }
      // Si llegamos aquí, la autenticación fue exitosa
      // Simular datos de usuario (en un sistema real, estos vendrían del backend)
      const response: LoginResponse = {
        access_token: basicAuth, // Usar las credenciales como "token"
        token_type: 'Basic',
        user_info: {
          id: 1,
          usuario: credentials.usuario,
          nombre: credentials.usuario, // En un sistema real, esto vendría del backend
          rol: credentials.usuario === 'admin' ? 'ADMIN' : 'OPER'
        }
      };
      
      // Guardar credenciales y datos de usuario
      localStorage.setItem('auth_credentials', JSON.stringify({
        username: credentials.usuario,
        password: credentials.password
      }));
      localStorage.setItem('user_data', JSON.stringify(response.user_info));
      
      console.log('authService: Login exitoso para usuario:', credentials.usuario);
      
      return response;
      
    } catch (error) {
      console.error('authService: Error en login:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_credentials');
    localStorage.removeItem('user_data');
  },

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      const parsedData = userData ? JSON.parse(userData) : null;
      console.log('authService: getCurrentUser returning:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('authService: Error parsing user data:', error);
      localStorage.removeItem('user_data');
      return null;
    }
  },

  isAuthenticated(): boolean {
    const authCredentials = localStorage.getItem('auth_credentials');
    const userData = localStorage.getItem('user_data');
    return !!(authCredentials && userData);
  },

  getCredentials(): { username: string; password: string } | null {
    try {
      const authCredentials = localStorage.getItem('auth_credentials');
      return authCredentials ? JSON.parse(authCredentials) : null;
    } catch (error) {
      console.error('Error parsing auth credentials:', error);
      return null;
    }
  }
};

// === SERVICIOS DE DATOS MAESTROS ===
export const tiposService = {
  // Tipos de siniestro - Endpoint real del backend
  async getTiposSiniestro(): Promise<TipoSiniestro[]> {
    const response = await apiClient.get('/tiposiniestro');
    return response.data;
  },

  // Tipos de pérdida - Endpoint real del backend
  async getTiposPerdida(): Promise<TipoPerdida[]> {
    const response = await apiClient.get('/tiposperdida');
    return response.data;
  },

  // Sexos - Endpoint real del backend
  async getSexos(): Promise<Sexo[]> {
    const response = await apiClient.get('/sexos');
    return response.data;
  },

  // Rangos de edad - Endpoint real del backend
  async getRangosEdad(): Promise<RangoEdad[]> {
    const response = await apiClient.get('/rangosedad');
    return response.data;
  },

  // Sucursales - Endpoint real del backend
  async getSucursales(): Promise<Sucursal[]> {
    const response = await apiClient.get('/sucursales');
    return response.data;
  },

  // Zonas - Endpoint real del backend
  async getZonas(): Promise<Zona[]> {
    const response = await apiClient.get('/zonas');
    return response.data;
  }
};

// === SERVICIOS DE SINIESTROS ===
export const siniestrosService = {
  // Listar todos los siniestros - Endpoint real del backend
  async getSiniestros(): Promise<any> {
    const response = await apiClient.get('/siniestros');
    return response.data;
  },

  // Crear siniestro
  async crearSiniestro(data: CrearSiniestro): Promise<RespuestaSimple> {
    const response = await apiClient.post('/siniestros', data);
    return response.data;
  },

  // Actualizar siniestro
  async actualizarSiniestro(id: number, data: ActualizarSiniestro): Promise<RespuestaSimple> {
    const response = await apiClient.put(`/siniestros/${id}`, data);
    return response.data;
  },

  // Consultar siniestro por ID
  async getSiniestro(id: number): Promise<RespuestaConsultaSiniestro> {
    const response = await apiClient.get(`/siniestros/${id}`);
    return response.data;
  },

  // Consultar siniestros por tipo
  async getSiniestrosPorTipo(idTipo: number): Promise<RespuestaListaSiniestro> {
    const response = await apiClient.get(`/siniestros/tipo/${idTipo}`);
    return response.data;
  },

  // Consultar siniestros por fecha
  async getSiniestrosPorFecha(fecha: string): Promise<RespuestaListaSiniestro> {
    const response = await apiClient.get(`/siniestros/fecha/${fecha}`);
    return response.data;
  },

  // Eliminar siniestro
  async eliminarSiniestro(id: number): Promise<RespuestaSimple> {
    const response = await apiClient.delete(`/siniestros/${id}`);
    return response.data;
  },

  // Agregar pérdida a siniestro
  async agregarPerdida(idSiniestro: number, perdida: DetallePerdida): Promise<RespuestaSimple> {
    const response = await apiClient.post(`/siniestros/${idSiniestro}/perdidas`, perdida);
    return response.data;
  },

  // Agregar implicado a siniestro
  async agregarImplicado(idSiniestro: number, implicado: DetalleImplicado): Promise<RespuestaSimple> {
    const response = await apiClient.post(`/siniestros/${idSiniestro}/implicados`, implicado);
    return response.data;
  },

  // Eliminar pérdida de siniestro
  async eliminarPerdida(idSiniestro: number, idDetalle: number): Promise<RespuestaSimple> {
    const response = await apiClient.delete(`/siniestros/${idSiniestro}/perdidas/${idDetalle}`);
    return response.data;
  },

  // Eliminar implicado de siniestro
  async eliminarImplicado(idSiniestro: number, idImplicado: number): Promise<RespuestaSimple> {
    const response = await apiClient.delete(`/siniestros/${idSiniestro}/implicados/${idImplicado}`);
    return response.data;
  }
};

// === SERVICIOS DE ESTADÍSTICAS ===
export const estadisticasService = {
  // Estadísticas generales
  async getEstadisticasGenerales(filtros?: FiltrosEstadisticas): Promise<EstadisticasGenerales> {
    const params = new URLSearchParams();
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    
    const response = await apiClient.get(`/estadisticas/generales?${params.toString()}`);
    return response.data;
  },

  // Estadísticas por tipo
  async getEstadisticasPorTipo(filtros?: FiltrosEstadisticas): Promise<EstadisticasPorTipo[]> {
    const params = new URLSearchParams();
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    
    const response = await apiClient.get(`/estadisticas/por-tipo?${params.toString()}`);
    return response.data;
  },

  // Estadísticas por sucursal
  async getEstadisticasPorSucursal(filtros?: FiltrosEstadisticas): Promise<EstadisticasPorSucursal[]> {
    const params = new URLSearchParams();
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limite) params.append('limite', filtros.limite.toString());
    
    const response = await apiClient.get(`/estadisticas/por-sucursal?${params.toString()}`);
    return response.data;
  },

  // Estadísticas por mes
  async getEstadisticasPorMes(año?: number): Promise<EstadisticasPorMes[]> {
    const params = año ? `?año=${año}` : '';
    const response = await apiClient.get(`/estadisticas/por-mes${params}`);
    return response.data;
  },

  // Estadísticas por tipo de pérdida
  async getEstadisticasPorTipoPerdida(filtros?: FiltrosEstadisticas): Promise<EstadisticasPorTipoPerdida[]> {
    const params = new URLSearchParams();
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    
    const response = await apiClient.get(`/estadisticas/por-tipo-perdida?${params.toString()}`);
    return response.data;
  },

  // Dashboard completo
  async getDashboard(filtros?: FiltrosEstadisticas): Promise<DashboardCompleto> {
    const params = new URLSearchParams();
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    
    const response = await apiClient.get(`/dashboard?${params.toString()}`);
    return response.data;
  },

  // Indicadores clave (KPIs)
  async getKPIs(): Promise<KPIsEjecutivos> {
    const response = await apiClient.get('/estadisticas/kpis');
    return response.data;
  }
};

// === SERVICIO DE SALUD ===
export const sistemService = {
  // Verificar estado del sistema
  async getEstado(): Promise<any> {
    const response = await apiClient.get('/');
    return response.data;
  },

  // Verificar estado de salud detallado
  async getHealthCheck(): Promise<any> {
    const response = await apiClient.get('/inicio');
    return response.data;
  },

  // Test de conexión completo
  async testConexion() {
    try {
      const [basicResponse, healthResponse] = await Promise.all([
        this.getEstado(),
        this.getHealthCheck()
      ]);
      
      return { 
        conectado: true, 
        mensaje: 'API disponible',
        status: basicResponse,
        health: healthResponse
      };
    } catch (error) {
      return { 
        conectado: false, 
        mensaje: 'API no disponible', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
};