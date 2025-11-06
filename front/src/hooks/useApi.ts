import { useState, useEffect } from 'react';
import { estadisticasService, siniestrosService } from '@/lib/services';
import {
  EstadisticasGenerales,
  EstadisticasPorTipo,
  EstadisticasPorSucursal,
  EstadisticasPorMes,
  DashboardCompleto,
  KPIsEjecutivos,
  FiltrosEstadisticas,
  FiltrosSiniestros,
  PaginatedResponse,
  SiniestroCompleto
} from '@/types/api';

// Hook para estadísticas generales
export const useEstadisticasGenerales = (filtros?: FiltrosEstadisticas) => {
  const [data, setData] = useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await estadisticasService.getEstadisticasGenerales(filtros);
        setData(result);
        setError(null);
      } catch (err) {
        setError('Error al cargar estadísticas generales');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros?.fecha_inicio, filtros?.fecha_fin]);

  return { data, loading, error };
};

// Hook para estadísticas por tipo
export const useEstadisticasPorTipo = (filtros?: FiltrosEstadisticas) => {
  const [data, setData] = useState<EstadisticasPorTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await estadisticasService.getEstadisticasPorTipo(filtros);
        setData(result);
        setError(null);
      } catch (err) {
        setError('Error al cargar estadísticas por tipo');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros?.fecha_inicio, filtros?.fecha_fin]);

  return { data, loading, error };
};

// Hook para estadísticas por sucursal
export const useEstadisticasPorSucursal = (filtros?: FiltrosEstadisticas) => {
  const [data, setData] = useState<EstadisticasPorSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await estadisticasService.getEstadisticasPorSucursal(filtros);
        setData(result);
        setError(null);
      } catch (err) {
        setError('Error al cargar estadísticas por sucursal');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros?.fecha_inicio, filtros?.fecha_fin, filtros?.limite]);

  return { data, loading, error };
};

// Hook para estadísticas por mes
export const useEstadisticasPorMes = (año?: number) => {
  const [data, setData] = useState<EstadisticasPorMes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await estadisticasService.getEstadisticasPorMes(año);
        setData(result);
        setError(null);
      } catch (err) {
        setError('Error al cargar estadísticas por mes');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [año]);

  return { data, loading, error };
};

// Hook para dashboard completo
export const useDashboard = (filtros?: FiltrosEstadisticas) => {
  const [data, setData] = useState<DashboardCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const result = await estadisticasService.getDashboard(filtros);
      setData(result);
      setError(null);
    } catch (err: any) {
      // Si es error de autenticación, redirigir al login
      if (err.response?.status === 401) {
        console.log('🚫 useDashboard: Error 401 detectado, limpiando autenticación');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        return;
      }
      
      // Si es error de conexión, usar datos de ejemplo
      if (err.code === 'ERR_NETWORK') {
        setError('Error al cargar dashboard');
        
        // Datos de ejemplo para mostrar mientras no hay conexión
        const mockDashboard: DashboardCompleto = {
          estadisticas_generales: {
            total_siniestros: 156,
            siniestros_frustrados: 45,
            siniestros_consumados: 111,
            porcentaje_frustrados: 28.8,
            monto_total_perdidas: 1250000,
            monto_total_recuperado: 890000,
            porcentaje_recuperacion: 71.2
          },
          por_tipo_siniestro: [
            {
              tipo_siniestro: "Robo con violencia",
              cantidad: 67,
              monto_total: 750000,
              porcentaje_del_total: 42.9
            },
            {
              tipo_siniestro: "Fraude electrónico",
              cantidad: 34,
              monto_total: 320000,
              porcentaje_del_total: 21.8
            },
            {
              tipo_siniestro: "Hurto simple",
              cantidad: 28,
              monto_total: 125000,
              porcentaje_del_total: 17.9
            },
            {
              tipo_siniestro: "Falsificación",
              cantidad: 19,
              monto_total: 55000,
              porcentaje_del_total: 12.2
            },
            {
              tipo_siniestro: "Otros",
              cantidad: 8,
              monto_total: 25000,
              porcentaje_del_total: 5.1
            }
          ],
          por_sucursal: [
            {
              sucursal: "Sucursal Centro",
              zona: "Zona Centro",
              cantidad_siniestros: 45,
              monto_total: 580000,
              ultimo_siniestro: "2024-01-15"
            },
            {
              sucursal: "Sucursal Norte",
              zona: "Zona Norte",
              cantidad_siniestros: 38,
              monto_total: 420000,
              ultimo_siniestro: "2024-01-14"
            },
            {
              sucursal: "Sucursal Sur",
              zona: "Zona Sur",
              cantidad_siniestros: 32,
              monto_total: 180000,
              ultimo_siniestro: "2024-01-13"
            },
            {
              sucursal: "Sucursal Este",
              zona: "Zona Este",
              cantidad_siniestros: 25,
              monto_total: 70000,
              ultimo_siniestro: "2024-01-12"
            },
            {
              sucursal: "Sucursal Oeste",
              zona: "Zona Oeste",
              cantidad_siniestros: 16,
              monto_total: 50000,
              ultimo_siniestro: "2024-01-11"
            }
          ],
          por_mes: [
            {
              año: 2024,
              mes: 1,
              mes_nombre: "Enero",
              cantidad_siniestros: 25,
              monto_total: 180000,
              monto_recuperado: 120000
            },
            {
              año: 2024,
              mes: 2,
              mes_nombre: "Febrero",
              cantidad_siniestros: 32,
              monto_total: 220000,
              monto_recuperado: 150000
            },
            {
              año: 2024,
              mes: 3,
              mes_nombre: "Marzo",
              cantidad_siniestros: 28,
              monto_total: 165000,
              monto_recuperado: 100000
            }
          ],
          por_tipo_perdida: [],
          sucursales_mas_afectadas: [],
          tendencia_mensual: []
        };
        
        setData(mockDashboard);
      } else {
        setError('Error al cargar dashboard');
        console.error('Error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [filtros?.fecha_inicio, filtros?.fecha_fin]);

  return { data, loading, error, refresh };
};

// Hook para KPIs ejecutivos
export const useKPIs = () => {
  const [data, setData] = useState<KPIsEjecutivos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const result = await estadisticasService.getKPIs();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Error al cargar KPIs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
};

// Hook genérico para manejar estados de carga
export const useApiCall = <T>(apiCall: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      const result = await apiCall();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Error en la llamada API');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    execute();
  }, dependencies);

  return { data, loading, error, retry: execute };
};

// Hook para estado de conexión con la API
export const useApiStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const { sistemService } = await import('../lib/services');
      const result = await sistemService.testConexion();
      setIsConnected(result.conectado);
      setLastCheck(new Date());
    } catch (err) {
      setIsConnected(false);
      console.error('Error checking API connection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Verificar conexión cada 5 minutos
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    isConnected, 
    loading, 
    lastCheck, 
    checkConnection 
  };
};

// Hook para listar siniestros con paginación
export const useSiniestros = (filtros?: FiltrosSiniestros) => {
  const [data, setData] = useState<PaginatedResponse<SiniestroCompleto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular respuesta paginada si no hay API disponible
      const mockData: PaginatedResponse<SiniestroCompleto> = {
        items: [],
        total: 0,
        page: filtros?.page || 1,
        per_page: filtros?.per_page || 10,
        pages: 0
      };
      
      try {
        // Intentar usar la API real (aquí se implementaría la llamada real)
        // const result = await siniestrosService.listarSiniestros(filtros);
        // setData(result);
        
        // Por ahora usar datos simulados
        setData(mockData);
      } catch (apiError) {
        // Si la API no está disponible, usar datos de ejemplo
        const ejemploSiniestros: SiniestroCompleto[] = [
          {
            id: 1,
            fecha_siniestro: '2024-01-15',
            tipo_siniestro: 'Robo con violencia',
            sucursal: 'Sucursal Centro',
            usuario_registro: 'admin',
            frustracion: false,
            monto_perdidas: 25000,
            monto_recuperado: 15000,
            descripcion: 'Robo durante horario laboral',
            estado: 'Investigando',
            fecha_creacion: '2024-01-15T10:30:00',
            fecha_actualizacion: '2024-01-16T14:20:00'
          },
          {
            id: 2,
            fecha_siniestro: '2024-01-14',
            tipo_siniestro: 'Fraude electrónico',
            sucursal: 'Sucursal Norte',
            usuario_registro: 'operador1',
            frustracion: true,
            monto_perdidas: 0,
            monto_recuperado: 0,
            descripcion: 'Intento de fraude detectado a tiempo',
            estado: 'Cerrado',
            fecha_creacion: '2024-01-14T09:15:00'
          },
          {
            id: 3,
            fecha_siniestro: '2024-01-13',
            tipo_siniestro: 'Hurto simple',
            sucursal: 'Sucursal Sur',
            usuario_registro: 'supervisor2',
            frustracion: false,
            monto_perdidas: 5000,
            monto_recuperado: 0,
            descripcion: 'Hurto de equipo menor',
            estado: 'En proceso',
            fecha_creacion: '2024-01-13T16:45:00'
          }
        ].slice(0, filtros?.per_page || 5);
        
        setData({
          items: ejemploSiniestros,
          total: ejemploSiniestros.length,
          page: filtros?.page || 1,
          per_page: filtros?.per_page || 5,
          pages: 1
        });
      }
    } catch (err) {
      setError('Error al cargar siniestros');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [
    filtros?.page,
    filtros?.per_page,
    filtros?.tipo,
    filtros?.sucursal,
    filtros?.fecha_inicio,
    filtros?.fecha_fin,
    filtros?.frustrado,
    filtros?.sort_by,
    filtros?.sort_order
  ]);

  return { data, loading, error, refresh };
};
