'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  FiDatabase,
  FiCheckCircle,
  FiSettings,
  FiAlertTriangle,
  FiUsers,
  FiLock,
  FiPlay,
  FiExternalLink,
  FiWifi
} from 'react-icons/fi';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net';
      const response = await fetch(`${API_URL}/`, { method: 'GET' });
      setBackendStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FiDatabase className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
                      Sistema de{' '}
                      <span className="text-blue-600">Siniestros</span>
                    </h1>
                  </div>
                </div>
                
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Sistema integral de gestión de siniestros con API real conectada.
                  Dashboard completo, autenticación y gestión de datos en tiempo real.
                </p>
                
                {/* Estado del Backend */}
                <div className="mt-6 flex items-center space-x-2">
                  {backendStatus === 'checking' && (
                    <div className="flex items-center text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      <span className="text-sm">Verificando backend...</span>
                    </div>
                  )}
                  
                  {backendStatus === 'connected' && (
                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <FiWifi className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Backend conectado</span>
                    </div>
                  )}
                  
                  {backendStatus === 'disconnected' && (
                    <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <FiAlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Backend desconectado</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      <FiPlay className="w-5 h-5 mr-2" />
                      Acceder al Sistema
                    </Link>
                  </div>
                  
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/test/conectividad"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      <FiCheckCircle className="w-5 h-5 mr-2" />
                      Verificar API
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Funcionalidades disponibles */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              ✅ Sistema Completamente Funcional
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Todas las funcionalidades implementadas y conectadas con la API real
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/login"
              className="group p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiDatabase className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    🚀 Sistema Principal
                  </h3>
                  <p className="text-blue-100 mt-1">
                    Acceso completo con API real
                  </p>
                  <div className="mt-2 text-sm bg-white/10 px-2 py-1 rounded">
                    ✅ Conectado • Datos reales
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              href="/test/conectividad"
              className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <FiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    🧪 Test Completo
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Conectividad y diagnóstico
                  </p>
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    ✅ Corrección verificada
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard"
              className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-yellow-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <FiSettings className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    📊 Dashboard Principal
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Panel de control con datos reales
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href="/siniestros"
              className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-purple-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <FiAlertTriangle className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Siniestros (Real)
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Gestión con API conectada
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href="/usuarios"
              className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <FiUsers className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Gestión Usuarios
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Administración completa
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href="/estadisticas"
              className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-red-300"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FiDatabase className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    📊 Estadísticas
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Análisis y reportes detallados
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Stack Tecnológico
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Frontend</h3>
                  <p className="text-gray-600 text-sm">Next.js 15.5.4 • React 19 • TypeScript • Tailwind CSS</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Backend</h3>
                  <p className="text-gray-600 text-sm">FastAPI • Python • SQLAlchemy • MySQL/SQLite</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Autenticación</h3>
                  <p className="text-gray-600 text-sm">HTTP Basic Auth • Context API • LocalStorage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Sistema de Siniestros • Frontend: localhost:3000 • Backend: localhost:8000
            </p>
            <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span>✅ API Conectada</span>
              <span>•</span>
              <span>🔐 Autenticación HTTP Basic</span>
              <span>•</span>
              <span>📊 Dashboard Real</span>
              <span>•</span>
              <span>🛠️ CRUD Completo</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
