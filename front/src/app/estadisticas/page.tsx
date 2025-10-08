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
  TipoSiniestro: string;
  Cuenta: number;
}

interface Sucursal {
  IdSucursal: number;
  NombreSucursal: string;
  Direccion: string;
  Telefono: string;
  Gerente: string;
  siniestros_count?: number;
  promedio_recuperacion?: number;
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
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

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
      
      const [estadisticasRes, porTipoRes, sucursalesRes] = await Promise.all([
        api.get<EstadisticasGenerales>('/estadisticas/generales', { timeout: 5000 }),
        api.get<EstadisticaPorTipo[]>('/estadisticas/por-tipo', { timeout: 5000 }),
        api.get<Sucursal[]>('/vista_sucursales', { timeout: 5000 })
      ]);

      setEstadisticasGenerales(estadisticasRes.data);
      setEstadisticasPorTipo(Array.isArray(porTipoRes.data) ? porTipoRes.data : []);
      setSucursales(Array.isArray(sucursalesRes.data) ? sucursalesRes.data : []);
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
      setSucursales([]);
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
    ? Math.max(...estadisticasPorTipo.map(item => item.Cuenta), 1)
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2024">Año 2024</option>
              <option value="2023">Año 2023</option>
              <option value="ultimo_trimestre">Último Trimestre</option>
              <option value="ultimo_mes">Último Mes</option>
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
                  const porcentaje = estadisticasGenerales?.total_siniestros ? 
                    ((item.Cuenta / estadisticasGenerales.total_siniestros) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.TipoSiniestro}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{item.Cuenta}</span>
                          <span className="text-gray-500 ml-2">({porcentaje}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${maxPorTipo > 0 ? (item.Cuenta / maxPorTipo) * 100 : 0}%` }}
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

        {/* Estadísticas por Sucursal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Análisis por Sucursal</h3>
              <FiMapPin className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-sm font-medium text-gray-600">Sucursal</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Siniestros</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Gerente</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">% Recuperación</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Progreso</th>
                  </tr>
                </thead>
                <tbody className="space-y-3">
                  {Array.isArray(sucursales) && sucursales.length > 0 ? (
                    sucursales.map((sucursal, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-3 font-medium text-gray-900">{sucursal.NombreSucursal}</td>
                        <td className="py-3 text-gray-700">{sucursal.siniestros_count || 0}</td>
                        <td className="py-3 text-gray-600">{sucursal.Gerente}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {sucursal.promedio_recuperacion?.toFixed(1) || '0'}%
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${Array.isArray(sucursales) && sucursales.length > 0 ? 
                                  ((sucursal.siniestros_count || 0) / Math.max(...sucursales.map(s => s.siniestros_count || 0), 1)) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No hay datos de sucursales disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
