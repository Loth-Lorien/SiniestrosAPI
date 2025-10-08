'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiHome,
  FiFileText, 
  FiUsers,
  FiBarChart,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';

interface UserData {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
}

interface EstadisticasGenerales {
  total_siniestros: number;
  siniestros_frustrados: number;
  siniestros_consumados: number;
  porcentaje_frustrados: number;
  monto_total_perdidas: number;
  monto_total_recuperado: number;
  porcentaje_recuperacion: number;
}

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

import DashboardLayout from '../../components/DashboardLayout';

export default function DashboardRealPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<EstadisticasGenerales | null>(null);
  const [recentSiniestros, setRecentSiniestros] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('auth_credentials');
      const userData = localStorage.getItem('user_data');
      
      if (!authData || !userData) {
        console.log('❌ No hay datos de autenticación, redirigiendo...');
        router.push('/login');
        return false;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('✅ Usuario autenticado:', parsedUser);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
        return false;
      }
    };

    if (checkAuth()) {
      loadDashboardData();
    }
  }, [router]);

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

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log('📊 Cargando datos del dashboard...');

      // Cargar estadísticas generales
      const statsResponse = await fetch('http://localhost:8000/estadisticas/generales', {
        headers
      });

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          localStorage.removeItem('auth_credentials');
          localStorage.removeItem('user_data');
          router.push('/login');
          return;
        }
        throw new Error(`Error cargando estadísticas: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      console.log('📊 Datos de estadísticas recibidos:', statsData);
      setStats(statsData);

      // Cargar siniestros recientes (intentar con y sin parámetros)
      try {
        const siniestrosResponse = await fetch('http://localhost:8000/siniestros', {
          headers
        });

        if (siniestrosResponse.ok) {
          const siniestrosData = await siniestrosResponse.json();
          // Tomar solo los primeros 5 en el frontend
          const recentData = Array.isArray(siniestrosData.data) ? siniestrosData.data.slice(0, 5) : [];
          setRecentSiniestros(recentData);
        }
      } catch (err) {
        console.log('Siniestros no disponibles:', err);
      }

      console.log('✅ Datos cargados exitosamente');

    } catch (err: any) {
      console.error('❌ Error cargando dashboard:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Siniestros</h1>
            <p className="text-gray-600 mt-2">
              Sistema en tiempo real con estadísticas actualizadas
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Estadísticas Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <FiFileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Siniestros</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(stats.total_siniestros || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <FiX className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Frustrados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(stats.siniestros_frustrados || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Consumados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(stats.siniestros_consumados || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <FiBarChart className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pérdidas Totales</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${(stats.monto_total_perdidas || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <FiRefreshCw className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Recuperación</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(stats.porcentaje_recuperacion || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <FiAlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Frustrados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(stats.porcentaje_frustrados || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Siniestros Recientes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Siniestros Recientes
              </h3>
              <button 
                onClick={() => router.push('/siniestros')}
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                <FiEye className="w-4 h-4 mr-1" />
                Ver todos
              </button>
            </div>
          </div>
          
          <div className="overflow-hidden">
            {recentSiniestros.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentSiniestros.map((siniestro) => (
                  <div key={siniestro.IdSiniestro} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${
                              siniestro.Frustrado ? 'bg-red-400' : 
                              siniestro.Contemplar ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {siniestro.TipoSiniestro}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {siniestro.IdSiniestro} • Centro: {siniestro.IdCentro}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {formatDate(siniestro.Fecha)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {siniestro.Sucursal}
                          </p>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          siniestro.Frustrado ? 'bg-red-100 text-red-800 border-red-200' : 
                          siniestro.Contemplar ? 'bg-green-100 text-green-800 border-green-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {siniestro.Frustrado ? 'Frustrado' : siniestro.Contemplar ? 'Contemplado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay siniestros recientes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Los siniestros aparecerán aquí cuando se registren
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => router.push('/siniestros')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <FiFileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Gestionar Siniestros</h3>
                <p className="text-sm text-gray-500">Ver, crear y editar siniestros</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/sucursales')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <FiUsers className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Sucursales</h3>
                <p className="text-sm text-gray-500">Administrar sucursales del sistema</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/estadisticas')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <FiBarChart className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Estadísticas</h3>
                <p className="text-sm text-gray-500">Reportes y análisis detallados</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Sistema de Siniestros • Conectado a API en tiempo real</p>
          <p className="mt-1">
            Frontend: Next.js 15 • Backend: FastAPI • Autenticación: HTTP Basic Auth
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
