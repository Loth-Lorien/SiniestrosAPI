'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  FiMapPin, 
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiMap,
  FiHome,
  FiAlertTriangle,
  FiX,
  FiEye,
  FiEdit3,
  FiPlus
} from 'react-icons/fi';

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

export default function SucursalesPage() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const authData = localStorage.getItem('auth_credentials');
    if (!authData) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => {
    const authData = localStorage.getItem('auth_credentials');
    if (!authData) return null;
    
    try {
      const { username, password } = JSON.parse(authData);
      const basicAuth = btoa(`${username}:${password}`);
      return {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log('🏢 Cargando datos de sucursales...');

      // Cargar sucursales con timeout
      const sucursalesResponse = await fetch('http://localhost:8000/vista_sucursales', {
        headers,
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (!sucursalesResponse.ok) {
        if (sucursalesResponse.status === 401) {
          localStorage.removeItem('auth_credentials');
          localStorage.removeItem('user_data');
          router.push('/login');
          return;
        }
        throw new Error(`Error cargando sucursales: ${sucursalesResponse.status}`);
      }

      const sucursalesData = await sucursalesResponse.json();
      setSucursales(sucursalesData.data || []);

      console.log('✅ Datos de sucursales cargados exitosamente');

    } catch (err: any) {
      console.error('❌ Error cargando datos de sucursales:', err);
      
      // Si es un error de red (backend apagado), redirigir al login
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error('🔴 Backend no disponible - redirigiendo al login');
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        setError('Servidor no disponible. Redirigiendo al login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      // Si es timeout
      if (err.name === 'TimeoutError') {
        console.error('⏰ Timeout del servidor - redirigiendo al login');
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        setError('Servidor no responde. Redirigiendo al login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtrar sucursales
  const filteredSucursales = sucursales.filter(sucursal => {
    const matchesSearch = sucursal.Sucursales.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sucursal.IdCentro.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sucursal.Municipio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZona = !selectedZona || sucursal.Zona === selectedZona;
    const matchesEstado = !selectedEstado || sucursal.Estado === selectedEstado;

    return matchesSearch && matchesZona && matchesEstado;
  });



  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando sucursales...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Sucursales</h1>
              <p className="text-gray-600 mt-2">
                {filteredSucursales.length} de {sucursales.length} sucursales registradas
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <FiPlus className="w-4 h-4 mr-2" />
                Nueva Sucursal
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros de búsqueda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID Centro o nombre..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona
                </label>
                <select
                  value={selectedZona}
                  onChange={(e) => setSelectedZona(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las zonas</option>
                  {[...new Set(sucursales.map(s => s.Zona))].sort().map((zona) => (
                    <option key={zona} value={zona}>
                      Zona {zona}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  {[...new Set(sucursales.map(s => s.Estado))].sort().map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Sucursales */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Sucursales ({filteredSucursales.length})
              </h3>
            </div>
            
            {filteredSucursales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Centro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sucursal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Siniestros
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Pérdidas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSucursales.map((sucursal) => (
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
                            <FiAlertTriangle className={`w-4 h-4 mr-2 ${
                              sucursal.total_siniestros > 0 ? 'text-red-500' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              sucursal.total_siniestros > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {sucursal.total_siniestros}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <div className={`font-medium ${
                            sucursal.monto_perdidas > 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            ${sucursal.monto_perdidas.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="Ver detalles">
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900" title="Editar">
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                            <button className="text-purple-600 hover:text-purple-900" title="Ver ubicación">
                              <FiMapPin className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiHome className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron sucursales
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {sucursales.length === 0 
                    ? 'No hay sucursales registradas' 
                    : 'Intenta ajustar los filtros de búsqueda'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Estadísticas por zona */}
          {filteredSucursales.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredSucursales.length}
                </div>
                <div className="text-sm text-gray-600">Total mostradas</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">
                  {filteredSucursales.filter((s) => s.TipoSucursal === 'Principal').length}
                </div>
                <div className="text-sm text-gray-600">Principales</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredSucursales.reduce((total, s) => total + s.total_siniestros, 0)}
                </div>
                <div className="text-sm text-gray-600">Siniestros Total</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-red-600">
                  ${filteredSucursales.reduce((total, s) => total + s.monto_perdidas, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Pérdidas Total</div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
