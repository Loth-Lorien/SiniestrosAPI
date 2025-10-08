'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';

interface Siniestro {
  IdSiniestro: number;
  IdCentro: string;
  Fecha: string;
  TipoSiniestro: string;
  IdTipoCuenta: number;
  Frustrado: boolean;
  Contemplar: boolean;
  Sucursal: string;
  Usuario: string;
  MontoTotal: number;
  CantidadDetalles: number;
  CantidadImplicados: number;
}

interface TipoSiniestro {
  id: number;
  nombre: string;
}

interface Sucursal {
  id: number;
  nombre: string;
  zona: string;
}

export default function SiniestrosPage() {
  const router = useRouter();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
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

      console.log('📊 Cargando datos de siniestros...');

      // Cargar siniestros con timeout
      const siniestrosResponse = await fetch('http://localhost:8000/siniestros', {
        headers,
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (!siniestrosResponse.ok) {
        if (siniestrosResponse.status === 401) {
          localStorage.removeItem('auth_credentials');
          localStorage.removeItem('user_data');
          router.push('/login');
          return;
        }
        throw new Error(`Error cargando siniestros: ${siniestrosResponse.status}`);
      }

      const siniestrosData = await siniestrosResponse.json();
      setSiniestros(siniestrosData.data || []);

      // Cargar tipos de siniestro


      console.log('✅ Datos cargados exitosamente');

    } catch (err: any) {
      console.error('❌ Error cargando datos de siniestros:', err);
      
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

  // Filtrar siniestros
  const filteredSiniestros = siniestros.filter(siniestro => {
    const matchesSearch = siniestro.TipoSiniestro.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         siniestro.IdSiniestro.toString().includes(searchTerm) ||
                         siniestro.Sucursal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipo || siniestro.TipoSiniestro === selectedTipo;
    const matchesSucursal = !selectedSucursal || siniestro.Sucursal === selectedSucursal;
    const matchesEstado = !selectedEstado || (siniestro.Frustrado ? 'frustrado' : 'completado') === selectedEstado;

    return matchesSearch && matchesTipo && matchesSucursal && matchesEstado;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resuelto':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando siniestros...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Siniestros</h1>
            <p className="text-gray-600 mt-2">
              {filteredSiniestros.length} de {siniestros.length} siniestros registrados
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
              Nuevo Siniestro
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  placeholder="ID o descripción..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Siniestro
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los tipos</option>
                {[...new Set(siniestros.map(s => s.TipoSiniestro))].sort().map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal
              </label>
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las sucursales</option>
                {[...new Set(siniestros.map(s => s.Sucursal))].sort().map((sucursal) => (
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
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
                <option value="frustrado">Frustrado</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Siniestros */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Siniestros ({filteredSiniestros.length})
            </h3>
          </div>
          
          {filteredSiniestros.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSiniestros.map((siniestro) => (
                    <tr key={siniestro.IdSiniestro} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{siniestro.IdSiniestro}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          <div className="font-medium">{siniestro.TipoSiniestro}</div>
                          <div className="text-xs text-gray-500">Centro: {siniestro.IdCentro}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(siniestro.Fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          siniestro.Frustrado ? 'bg-red-100 text-red-800 border-red-200' : 
                          siniestro.Contemplar ? 'bg-green-100 text-green-800 border-green-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {siniestro.Frustrado ? 'Frustrado' : siniestro.Contemplar ? 'Contemplado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{siniestro.Sucursal}</div>
                          <div className="text-xs text-gray-400">Usuario: {siniestro.Usuario}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <div>
                          <div className="font-medium text-red-600">${siniestro.MontoTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{siniestro.CantidadDetalles} detalles</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FiTrash2 className="w-4 h-4" />
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
              <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron siniestros
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {siniestros.length === 0 
                  ? 'No hay siniestros registrados' 
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        {filteredSiniestros.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredSiniestros.length}
              </div>
              <div className="text-sm text-gray-600">Total mostrados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredSiniestros.filter((s) => s.Frustrado).length}
              </div>
              <div className="text-sm text-gray-600">Frustrados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredSiniestros.filter((s) => s.Contemplar).length}
              </div>
              <div className="text-sm text-gray-600">Contemplados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">
                ${filteredSiniestros.reduce((total, s) => total + s.MontoTotal, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Pérdidas</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
