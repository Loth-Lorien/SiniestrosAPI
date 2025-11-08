"use client";
import React, { useState, useEffect } from 'react';
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
  FiLoader,
  FiSearch,
  FiHome
} from 'react-icons/fi';
import DashboardLayout from '../../components/DashboardLayout';

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
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';
const api = axios.create({
  baseURL: API_URL,
});
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth_credentials');
  if (authData) {
    const { username, password } = JSON.parse(authData);
    const basicAuth = btoa(`${username}:${password}`);
    config.headers['Authorization'] = `Basic ${basicAuth}`;
  }
  return config;
});

// Interfaz para sucursales
interface Sucursal {
  IdCentro: string;
  Sucursales: string;
  TipoSucursal: string;
  Zona: string;
  Estado: string;
  Municipio: string;
  total_siniestros: number;
  monto_perdidas: number;
}

export default function EstadisticasPage() {
  // Filtro para mostrar solo sucursales con pérdida
  const [soloConPerdida, setSoloConPerdida] = useState(false);
  const router = useRouter();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2024');
  const [actualizando, setActualizando] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Estados para los datos reales
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasPorTipo, setEstadisticasPorTipo] = useState<EstadisticaPorTipo[]>([]);
  const [estadisticasPorZona, setEstadisticasPorZona] = useState<EstadisticaPorZona[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  // Filtros para sucursales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  // Filtrar sucursales
  const sucursalesFiltradas = sucursales.filter((sucursal: Sucursal) => {
    const matchesSearch = sucursal.Sucursales.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sucursal.IdCentro.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sucursal.Municipio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZona = !selectedZona || sucursal.Zona === selectedZona;
    const matchesEstado = !selectedEstado || sucursal.Estado === selectedEstado;
    const matchesPerdida = !soloConPerdida || sucursal.monto_perdidas > 0;
    return matchesSearch && matchesZona && matchesEstado && matchesPerdida;
  });

  // Calcular total de pérdidas de sucursales filtradas
  const totalPerdidasSucursales: number = sucursalesFiltradas.reduce((acc: number, suc: Sucursal) => acc + (suc.monto_perdidas || 0), 0);

  // Scroll en vez de paginación

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
      const [estadisticasRes, porTipoRes, porZonaRes, sucursalesRes] = await Promise.all([
        api.get<EstadisticasGenerales>('/estadisticas/generales', { timeout: 5000 }),
        api.get<EstadisticaPorTipo[]>('/estadisticas/por-tipo', { timeout: 5000 }),
        api.get<EstadisticaPorZona[]>('/estadisticas/por-zona', { timeout: 5000 }),
        api.get<{ data: Sucursal[] }>('/vista_sucursales', { timeout: 5000 })
      ]);

      setEstadisticasGenerales(estadisticasRes.data);
      setEstadisticasPorTipo(Array.isArray(porTipoRes.data) ? porTipoRes.data : []);
      setEstadisticasPorZona(Array.isArray(porZonaRes.data) ? porZonaRes.data : []);
      setSucursales(Array.isArray(sucursalesRes.data.data) ? sucursalesRes.data.data : []);
    } catch (error: any) {
      console.error('❌ Error cargando datos de estadísticas:', error);
      if (error.code === 'ECONNREFUSED' || error.code === 'TIMEOUT' || 
          (error.response && error.response.status >= 500) ||
          error.message?.includes('Network Error') ||
          error.message?.includes('timeout')) {
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        alert('Servidor no disponible. Serás redirigido al login.');
        router.push('/login');
        return;
      }
      setEstadisticasPorTipo([]);
      setEstadisticasPorZona([]);
      setSucursales([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);


  // Calcular máximo para barra de tipos
  const maxPorTipo = estadisticasPorTipo.length > 0 ? Math.max(...estadisticasPorTipo.map((e: EstadisticaPorTipo) => e.cantidad)) : 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
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
                estadisticasPorTipo.map((item, index) => (
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
                ))
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

        {/* Tabla de Sucursales con filtros y scroll en cuadro fijo */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-lg font-medium text-gray-900">
              Sucursales del Sistema
            </h3>
            <div className="text-sm text-gray-700 font-semibold">
              Total pérdidas: <span className="text-red-600">{totalPerdidasSucursales.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
            </div>
          </div>
          {/* Filtros */}
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID Centro, nombre o municipio..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                <select
                  value={selectedZona}
                  onChange={(e) => setSelectedZona(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="" className="text-gray-600">Todas las zonas</option>
                  {[...new Set(sucursales.map((s: Sucursal) => s.Zona))].sort().map((zona: string) => (
                    <option key={zona} value={zona}>Zona {zona}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="" className="text-gray-600">Todos los estados</option>
                  {[...new Set(sucursales.map((s: Sucursal) => s.Estado))].sort().map((estado: string) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input
                  id="soloConPerdida"
                  type="checkbox"
                  checked={soloConPerdida}
                  onChange={(e) => setSoloConPerdida(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="soloConPerdida" className="ml-2 text-sm text-gray-700">Sucursales con pérdida</label>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Centro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siniestros</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Pérdidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sucursalesFiltradas.length > 0 ? (
                  sucursalesFiltradas.map((sucursal: Sucursal) => (
                    <tr key={sucursal.IdCentro} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sucursal.IdCentro}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiHome className="w-4 h-4 text-gray-400 mr-2" />
                          {sucursal.Sucursales}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {sucursal.TipoSucursal}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div>
                          <div className="flex items-center">
                            <FiMapPin className="w-3 h-3 text-gray-400 mr-1" />
                            {sucursal.Municipio}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {sucursal.Estado} - Zona {sucursal.Zona}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center">
                          <FiAlertTriangle className={`w-4 h-4 mr-2 ${sucursal.total_siniestros > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={`font-medium ${sucursal.total_siniestros > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {sucursal.total_siniestros}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <div className={`font-medium ${sucursal.monto_perdidas > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          ${sucursal.monto_perdidas.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron sucursales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Análisis por Zona Geográfica */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Análisis por Zona Geográfica</h3>
          </div>
          <div className="p-6">
            {estadisticasPorZona.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {estadisticasPorZona.map((zona: EstadisticaPorZona, idx: number) => (
                  <div key={idx} className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Zona {zona.zona}</span>
                      <span className="text-xs text-gray-500">{zona.sucursales_en_zona} sucursales</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Monto total de pérdidas:</span>
                      <span className="font-bold text-red-600">{formatCurrency(zona.monto_total_perdidas)}</span>
                    </div>
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
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Actividad relativa</span>
                        <span>{zona.porcentaje_del_total.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(zona.porcentaje_del_total * 2, 100)}%` }}
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
