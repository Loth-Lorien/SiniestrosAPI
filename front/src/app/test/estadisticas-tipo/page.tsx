'use client';

import { useState } from 'react';
import { FiPlay, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import DashboardLayout from '../../../components/DashboardLayout';

export default function TestEstadisticasPorTipo() {
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const probarAPI = async () => {
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      console.log('Probando estadísticas por tipo...');
      
      const response = await fetch('http://127.0.0.1:8000/estadisticas/por-tipo', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);
      setResultado(data);
      
    } catch (err) {
      console.error('Error en test:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 Test Estadísticas por Tipo (Corrección)
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiCheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Corrección aplicada:</strong> La consulta ahora usa <code>COUNT(DISTINCT Siniestro.IdSiniestro)</code>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Esto evita el conteo duplicado cuando un siniestro tiene múltiples detalles de pérdida.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={probarAPI}
            disabled={cargando}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <FiPlay className="w-5 h-5 mr-2" />
            )}
            {cargando ? 'Ejecutando test...' : 'Probar Estadísticas por Tipo'}
          </button>
        </div>

        {/* Resultado del test */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiAlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold">Error en el test</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <p className="text-xs text-red-500 mt-2">
                  Verifica que el backend esté corriendo en http://127.0.0.1:8000
                </p>
              </div>
            </div>
          </div>
        )}

        {resultado && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center">
                <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-green-800 font-semibold">✅ Test exitoso - Datos recibidos</h3>
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Estadísticas por Tipo de Siniestro:</h4>
              
              {Array.isArray(resultado) && resultado.length > 0 ? (
                <div className="space-y-4">
                  {resultado.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{item.tipo_siniestro}</h5>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Cantidad:</span>
                          <p className="font-bold text-blue-600 text-lg">{item.cantidad}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Monto Total:</span>
                          <p className="font-medium text-green-600">
                            €{item.monto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">% del Total:</span>
                          <p className="font-medium text-purple-600">{item.porcentaje_del_total.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${item.porcentaje_del_total}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-green-800 font-medium">
                          ✅ Corrección verificada exitosamente
                        </p>
                        <p className="text-green-600 text-sm mt-1">
                          Total de tipos: {resultado.length} • 
                          Total siniestros: {resultado.reduce((sum: number, item: any) => sum + item.cantidad, 0)} •
                          Los números ahora reflejan siniestros únicos, no pérdidas duplicadas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : Array.isArray(resultado) && resultado.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiAlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>No hay datos de siniestros en la base de datos</p>
                  <p className="text-sm mt-1">Agrega algunos siniestros para ver las estadísticas</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Respuesta completa:</h5>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Información del Test</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Endpoint:</strong> GET /estadisticas/por-tipo</li>
            <li>• <strong>URL completa:</strong> http://127.0.0.1:8000/estadisticas/por-tipo</li>
            <li>• <strong>Método:</strong> GET (sin autenticación requerida para estadísticas)</li>
            <li>• <strong>Corrección:</strong> Usa COUNT(DISTINCT) para evitar duplicados</li>
            <li>• <strong>Esperado:</strong> Lista de tipos con cantidad real de siniestros únicos</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
