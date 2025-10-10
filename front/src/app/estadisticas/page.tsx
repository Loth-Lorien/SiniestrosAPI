'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  FiBarChart, 
  FiTrendingUp, 
  FiCalendar,
  FiMapPin,
  FiAlertTriangle,
  FiDollarSign,
  FiPieChart,
  FiDownload,
  FiRefreshCw,
  FiLoader
} from 'react-icons/fi';

// Interfaces para los datos de la API
interface EstadisticasGenerales {
  total_siniestros: number;
  siniestros_frustrados: number;
  siniestros_consumados: number;
  monto_total_perdidas: number;
  porcentaje_recuperacion: number;
}

interface EstadisticaPorTipo {
  tipo_siniestro: string;
  cantidad: number;
  monto_total: number;
  porcentaje_del_total: number;
}

interface EstadisticaPorZona {
  zona: string;
  cantidad_siniestros: number;
  monto_total_perdidas: number;
  tipo_siniestro_frecuente: string;
  tipo_perdida_frecuente: string;
  sucursales_en_zona: number;
  porcentaje_del_total: number;
}

// Configurar axios
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Interceptor para agregar autenticación
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth_credentials');
  if (authData) {
    const { username, password } = JSON.parse(authData);
    const basicAuth = btoa(`${username}:${password}`);
    config.headers['Authorization'] = `Basic ${basicAuth}`;
  }
  return config;
});

export default function EstadisticasPage() {
  const router = useRouter();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2024');
  const [actualizando, setActualizando] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Estados para los datos reales
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasPorTipo, setEstadisticasPorTipo] = useState<EstadisticaPorTipo[]>([]);
  const [estadisticasPorZona, setEstadisticasPorZona] = useState<EstadisticaPorZona[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Función para cargar datos de la API
  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      const [estadisticasRes, porTipoRes, porZonaRes] = await Promise.all([
        api.get<EstadisticasGenerales>('/estadisticas/generales', { timeout: 5000 }),
        api.get<EstadisticaPorTipo[]>('/estadisticas/por-tipo', { timeout: 5000 }),
        api.get<EstadisticaPorZona[]>('/estadisticas/por-zona', { timeout: 5000 })
      ]);

      console.log('📊 Datos recibidos:');
      console.log('- Estadísticas generales:', estadisticasRes.data);
      console.log('- Por tipo:', porTipoRes.data);
      console.log('- Por zona:', porZonaRes.data);

      setEstadisticasGenerales(estadisticasRes.data);
      setEstadisticasPorTipo(Array.isArray(porTipoRes.data) ? porTipoRes.data : []);
      setEstadisticasPorZona(Array.isArray(porZonaRes.data) ? porZonaRes.data : []);
    } catch (error: any) {
      console.error('❌ Error cargando datos de estadísticas:', error);
      
      // Si es un error de red o timeout (backend apagado)
      if (error.code === 'ECONNREFUSED' || error.code === 'TIMEOUT' || 
          (error.response && error.response.status >= 500) ||
          error.message?.includes('Network Error') ||
          error.message?.includes('timeout')) {
        console.error('🔴 Backend no disponible - redirigiendo al login');
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        alert('Servidor no disponible. Serás redirigido al login.');
        router.push('/login');
        return;
      }
      
      // En caso de error, asegurar que los arrays estén vacíos pero válidos
      setEstadisticasPorTipo([]);
      setEstadisticasPorZona([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const handleActualizar = () => {
    setActualizando(true);
    cargarDatos().finally(() => {
      setActualizando(false);
    });
  };

  const maxPorTipo = Array.isArray(estadisticasPorTipo) && estadisticasPorTipo.length > 0 
    ? Math.max(...estadisticasPorTipo.map(item => item.cantidad), 1)
    : 1;

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas Detalladas</h1>
            <p className="text-gray-600 mt-2">
              Análisis completo de siniestros y tendencias
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="2024" className="text-gray-900">Año 2024</option>
              <option value="2023" className="text-gray-900">Año 2023</option>
              <option value="ultimo_trimestre" className="text-gray-900">Último Trimestre</option>
              <option value="ultimo_mes" className="text-gray-900">Último Mes</option>
            </select>

            <button 
              onClick={handleActualizar}
              disabled={actualizando}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${actualizando ? 'animate-spin' : ''}`} />
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FiDownload className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Siniestros</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticasGenerales?.total_siniestros || 0}</p>
              </div>
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frustrados</p>
                <p className="text-3xl font-bold text-yellow-600">{estadisticasGenerales?.siniestros_frustrados || 0}</p>
                <p className="text-xs text-gray-500">
                  {estadisticasGenerales?.total_siniestros ? 
                    (((estadisticasGenerales.siniestros_frustrados / estadisticasGenerales.total_siniestros) * 100).toFixed(1)) 
                    : '0'}%
                </p>
              </div>
              <FiBarChart className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pérdidas Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(estadisticasGenerales?.monto_total_perdidas || 0)}
                </p>
              </div>
              <FiDollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">% Recuperación</p>
                <p className="text-3xl font-bold text-blue-600">{estadisticasGenerales?.porcentaje_recuperacion?.toFixed(1) || '0'}%</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estadísticas por Tipo */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Siniestros por Tipo</h3>
              <FiPieChart className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="space-y-4">
              {Array.isArray(estadisticasPorTipo) && estadisticasPorTipo.length > 0 ? (
                estadisticasPorTipo.map((item, index) => {
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.tipo_siniestro}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{item.cantidad}</span>
                          <span className="text-gray-500 ml-2">({item.porcentaje_del_total.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${maxPorTipo > 0 ? (item.cantidad / maxPorTipo) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-6">
                  No hay datos de tipos de siniestros disponibles
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas por Estado */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Estados de Siniestros</h3>
              <FiBarChart className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">Consumados</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{estadisticasGenerales?.siniestros_consumados || 0}</div>
                  <div className="text-xs text-gray-500">
                    {estadisticasGenerales?.total_siniestros ? 
                      (((estadisticasGenerales.siniestros_consumados / estadisticasGenerales.total_siniestros) * 100).toFixed(1)) 
                      : '0'}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">Frustrados</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">{estadisticasGenerales?.siniestros_frustrados || 0}</div>
                  <div className="text-xs text-gray-500">
                    {estadisticasGenerales?.total_siniestros ? 
                      (((estadisticasGenerales.siniestros_frustrados / estadisticasGenerales.total_siniestros) * 100).toFixed(1)) 
                      : '0'}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis por Zona */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Análisis por Zona Geográfica</h3>
              <FiMapPin className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mt-1">Distribución de siniestros, pérdidas y tipos por zona</p>
          </div>

          <div className="p-6">
            {Array.isArray(estadisticasPorZona) && estadisticasPorZona.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {estadisticasPorZona.map((zona, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    
                    {/* Header de la zona */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">{zona.zona}</h4>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {zona.porcentaje_del_total.toFixed(1)}%
                      </span>
                    </div>

                    {/* Métricas principales */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{zona.cantidad_siniestros}</div>
                        <div className="text-xs text-gray-500">Siniestros</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          ${zona.monto_total_perdidas.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-500">Pérdidas</div>
                      </div>
                    </div>

                    {/* Información detallada */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm font-medium text-gray-600">Sucursales:</span>
                        <span className="text-sm font-bold text-gray-900">{zona.sucursales_en_zona}</span>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                        <div className="text-xs font-medium text-orange-700 mb-1">Siniestro Frecuente:</div>
                        <div className="text-sm font-bold text-orange-900">{zona.tipo_siniestro_frecuente}</div>
                      </div>
                      
                      <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <div className="text-xs font-medium text-red-700 mb-1">Pérdida Frecuente:</div>
                        <div className="text-sm font-bold text-red-900">{zona.tipo_perdida_frecuente}</div>
                      </div>
                    </div>

                    {/* Barra de progreso relativo */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Actividad relativa</span>
                        <span>{zona.porcentaje_del_total.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${Math.min(zona.porcentaje_del_total * 2, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos por zona</h3>
                <p className="text-gray-500">No se encontraron estadísticas de zona disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <FiAlertTriangle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-800">
                <strong>✅ Estadísticas en Tiempo Real</strong> - Los datos mostrados provienen directamente de la base de datos.
              </p>
              <p className="text-xs text-green-600 mt-1">
                Las estadísticas se actualizan automáticamente y reflejan el estado actual del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
