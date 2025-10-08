'use client';

import Link from 'next/link';
import { FiCheckCircle, FiDatabase, FiWifi } from 'react-icons/fi';
import DashboardLayout from '../../components/DashboardLayout';

export default function TestPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 Centro de Pruebas y Diagnósticos
          </h1>
          <p className="text-gray-600 mb-6">
            Herramientas para verificar el funcionamiento del sistema y diagnosticar problemas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/test/conectividad"
              className="group p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <FiWifi className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 group-hover:text-green-700">
                    Test de Conectividad Completo
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Verificar todos los endpoints de la API
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    ✅ Prueba exhaustiva • 8 endpoints
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              href="/test/estadisticas-tipo"
              className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FiDatabase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700">
                    Test Estadísticas por Tipo
                  </h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Verificar corrección del conteo de siniestros
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    🔧 Corrección COUNT(DISTINCT) aplicada
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Limpieza completada</strong> - Se eliminaron páginas duplicadas e innecesarias.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                El proyecto ahora tiene una estructura limpia y organizada con solo las funcionalidades esenciales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
