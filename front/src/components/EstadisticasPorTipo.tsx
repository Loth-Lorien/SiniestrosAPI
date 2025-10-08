'use client';

import { useEstadisticasPorTipo } from '../hooks/useApi';
import type { EstadisticasPorTipo as EstadisticasPorTipoType, FiltrosEstadisticas } from '../types/api';

interface EstadisticasPorTipoProps {
  filtros?: FiltrosEstadisticas;
  data?: EstadisticasPorTipoType[];
  loading?: boolean;
}

export default function EstadisticasPorTipo({ filtros, data: propData, loading: propLoading }: EstadisticasPorTipoProps) {
  const { data: hookData, loading: hookLoading, error } = useEstadisticasPorTipo(filtros);
  
  // Usar datos del prop si se proporcionan, sino usar el hook
  const estadisticas = propData || hookData;
  const loading = propLoading !== undefined ? propLoading : hookLoading;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Siniestros por Tipo
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !propData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Siniestros por Tipo
        </h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <p className="text-gray-500 text-sm">Mostrando datos de ejemplo</p>
        </div>
      </div>
    );
  }

  if (!estadisticas || estadisticas.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Siniestros por Tipo
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const maxCantidad = Math.max(...estadisticas.map(e => e.cantidad));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Siniestros por Tipo
        </h3>
        <span className="text-sm text-gray-500">
          {estadisticas.length} tipo{estadisticas.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {estadisticas.map((item, index) => (
          <div key={index} className="group">
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                {item.tipo_siniestro}
              </span>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-600">
                  {item.cantidad} caso{item.cantidad !== 1 ? 's' : ''}
                </span>
                <span className="font-medium text-blue-600">
                  {item.porcentaje_del_total.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(item.cantidad / maxCantidad) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Información del Monto */}
            {item.monto_total > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Monto total: {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(item.monto_total)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total de casos:</span>
            <span className="ml-2 font-medium">
              {estadisticas.reduce((sum, item) => sum + item.cantidad, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Monto total:</span>
            <span className="ml-2 font-medium">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(estadisticas.reduce((sum, item) => sum + item.monto_total, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
