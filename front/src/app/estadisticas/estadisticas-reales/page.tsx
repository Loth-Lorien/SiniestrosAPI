'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useState, useEffect } from 'react';
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
  FiCheckCircle
} from 'react-icons/fi';
import { estadisticasService } from '../../../lib/services';
import type { 
  EstadisticasGenerales,
  EstadisticasPorTipo,
  EstadisticasPorSucursal,
  EstadisticasPorMes,
  DashboardCompleto 
} from '../../../types/api';

export default function EstadisticasRealesPage() {
  const [dashboard, setDashboard] = useState<DashboardCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros = {
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined
      };

      const dashboardData = await estadisticasService.getDashboard(filtros);
      setDashboard(dashboardData);
      
      console.log('Dashboard cargado:', dashboardData);
      
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = async () => {
    setActualizando(true);
    await cargarDatos();
    setActualizando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading && !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <FiAlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-semibold">Error al cargar datos</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={cargarDatos}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboard?.estadisticas_generales;
  const porTipo = dashboard?.por_tipo_siniestro || [];
  const porSucursal = dashboard?.por_sucursal || [];
  const porMes = dashboard?.por_mes || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Estadísticas Reales</h1>
            <p className="text-gray-600 mt-2">
              Datos en tiempo real desde la API • Conteo corregido por siniestro
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Fecha inicio"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Fecha fin"
              />
            </div>

            <button 
              onClick={handleActualizar}
              disabled={actualizando}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${actualizando ? 'animate-spin' : ''}`} />
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Indicador de datos reales */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-800">
                <strong>✅ Conectado a API real</strong> - Los datos mostrados provienen directamente de la base de datos.
              </p>
              <p className="text-xs text-green-600 mt-1">
                Problema del conteo duplicado corregido. Ahora cuenta siniestros únicos, no pérdidas individuales.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Siniestros</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_siniestros}</p>
                </div>
                <FiAlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Frustrados</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.siniestros_frustrados}</p>
                  <p className="text-xs text-gray-500">{stats.porcentaje_frustrados.toFixed(1)}%</p>
                </div>
                <FiBarChart className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Total Pérdidas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.monto_total_perdidas)}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">% Recuperación</p>
                  <p className="text-3xl font-bold text-green-600">{stats.porcentaje_recuperacion.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{formatCurrency(stats.monto_total_recuperado)}</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estadísticas por Tipo - DATOS REALES CORREGIDOS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">🎯 Siniestros por Tipo</h3>
                <p className="text-xs text-green-600 mt-1">✅ Conteo corregido - Siniestros únicos</p>
              </div>
              <FiPieChart className="w-5 h-5 text-gray-500" />
            </div>
            
            {porTipo.length > 0 ? (
              <div className="space-y-4">
                {porTipo.map((item, index) => {
                  const maxCantidad = Math.max(...porTipo.map(t => t.cantidad));
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
                          style={{ width: `${(item.cantidad / maxCantidad) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Monto total: {formatCurrency(item.monto_total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiAlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No hay datos de siniestros por tipo</p>
                <p className="text-xs mt-1">Verifica que existan siniestros en el período seleccionado</p>
              </div>
            )}
          </div>

          {/* Tendencia Mensual */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📈 Tendencia Mensual</h3>
                <p className="text-xs text-blue-600 mt-1">Año actual • Datos reales</p>
              </div>
              <FiCalendar className="w-5 h-5 text-gray-500" />
            </div>
            
            {porMes.length > 0 ? (
              <div className="space-y-3">
                {porMes.slice(-6).map((item, index) => {
                  const maxSiniestros = Math.max(...porMes.map(m => m.cantidad_siniestros));
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 text-sm font-medium text-gray-600">{item.mes_nombre}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 w-32">
                          <div 
                            className="bg-green-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${(item.cantidad_siniestros / maxSiniestros) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{item.cantidad_siniestros}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(item.monto_total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiCalendar className="w-8 h-8 mx-auto mb-2" />
                <p>No hay datos mensuales disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas por Sucursal */}
        {porSucursal.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🏢 Análisis por Sucursal</h3>
                  <p className="text-xs text-blue-600 mt-1">Top {porSucursal.length} sucursales con más siniestros</p>
                </div>
                <FiMapPin className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 text-sm font-medium text-gray-600">Sucursal</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Zona</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Siniestros</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Monto Total</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Último Siniestro</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Progreso</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-3">
                    {porSucursal.map((sucursal, index) => {
                      const maxCantidad = Math.max(...porSucursal.map(s => s.cantidad_siniestros));
                      return (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0">
                          <td className="py-3 font-medium text-gray-900">{sucursal.sucursal}</td>
                          <td className="py-3 text-gray-700">{sucursal.zona}</td>
                          <td className="py-3 font-bold text-gray-900">{sucursal.cantidad_siniestros}</td>
                          <td className="py-3 text-gray-700">{formatCurrency(sucursal.monto_total)}</td>
                          <td className="py-3 text-gray-700">
                            {sucursal.ultimo_siniestro ? new Date(sucursal.ultimo_siniestro).toLocaleDateString('es-ES') : 'N/A'}
                          </td>
                          <td className="py-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(sucursal.cantidad_siniestros / maxCantidad) * 100}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>🔧 Corrección aplicada</strong> - Las estadísticas ahora usan <code>COUNT(DISTINCT Siniestro.IdSiniestro)</code>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Antes: Contaba pérdidas duplicadas por JOIN • Ahora: Cuenta siniestros únicos correctamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
