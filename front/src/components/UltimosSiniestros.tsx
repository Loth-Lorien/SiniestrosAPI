'use client';

import { useSiniestros } from '../hooks/useApi';
import { SiniestroCompleto } from '../types/api';
import { FiClock, FiMapPin, FiUser, FiDollarSign, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function UltimosSiniestros() {
  const { data: siniestros, loading, error, refresh } = useSiniestros({
    page: 1,
    per_page: 5, // Solo mostramos los últimos 5
    sort_by: 'fecha_siniestro',
    sort_order: 'desc'
  });

  const getSeverityColor = (frustracion: boolean, monto: number) => {
    if (frustracion) return 'bg-yellow-100 text-yellow-800';
    if (monto > 50000) return 'bg-red-100 text-red-800';
    if (monto > 10000) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityText = (frustracion: boolean, monto: number) => {
    if (frustracion) return 'Frustrado';
    if (monto > 50000) return 'Crítico';
    if (monto > 10000) return 'Alto';
    return 'Bajo';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Últimos Siniestros</h3>
          <div className="animate-spin">
            <FiRefreshCw className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Últimos Siniestros</h3>
          <button
            onClick={refresh}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-8">
          <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No se pudieron cargar los siniestros</p>
          <p className="text-sm text-gray-500">
            Verifica la conexión con la API
          </p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Últimos Siniestros</h3>
        <button
          onClick={refresh}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {!siniestros?.items?.length ? (
        <div className="text-center py-8">
          <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay siniestros registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {siniestros.items.map((siniestro: SiniestroCompleto) => (
            <div
              key={siniestro.id}
              className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Información principal */}
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {siniestro.tipo_siniestro}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                        siniestro.frustracion,
                        siniestro.monto_perdidas || 0
                      )}`}
                    >
                      {getSeverityText(siniestro.frustracion, siniestro.monto_perdidas || 0)}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      <span>
                        {new Date(siniestro.fecha_siniestro).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {siniestro.sucursal && (
                      <div className="flex items-center">
                        <FiMapPin className="w-3 h-3 mr-1" />
                        <span>{siniestro.sucursal}</span>
                      </div>
                    )}
                    
                    {siniestro.usuario_registro && (
                      <div className="flex items-center">
                        <FiUser className="w-3 h-3 mr-1" />
                        <span>{siniestro.usuario_registro}</span>
                      </div>
                    )}
                    
                    {siniestro.monto_perdidas && (
                      <div className="flex items-center">
                        <FiDollarSign className="w-3 h-3 mr-1" />
                        <span>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(siniestro.monto_perdidas)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descripción si existe */}
                  {siniestro.descripcion && (
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                      {siniestro.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ver todos */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href="/reportes"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Ver todos los siniestros →
        </a>
      </div>
    </div>
  );
}
