'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiLoader, FiPlay, FiServer, FiWifi } from 'react-icons/fi';
import DashboardLayout from '@/components/DashboardLayout';

interface TestResult {
  nombre: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  mensaje?: string;
  datos?: any;
}

export default function ConectividadCompleta() {
  const [resultados, setResultados] = useState<TestResult[]>([
    { nombre: 'Backend Health Check', url: 'http://127.0.0.1:8000/', status: 'pending' },
    { nombre: 'Inicio/Estado', url: 'http://127.0.0.1:8000/inicio', status: 'pending' },
    { nombre: 'Tipos de Siniestro', url: 'http://127.0.0.1:8000/tiposiniestro', status: 'pending' },
    { nombre: 'Tipos de Pérdida', url: 'http://127.0.0.1:8000/tiposperdida', status: 'pending' },
    { nombre: 'Sucursales', url: 'http://127.0.0.1:8000/sucursales', status: 'pending' },
    { nombre: 'Estadísticas por Tipo (CORREGIDO)', url: 'http://127.0.0.1:8000/estadisticas/por-tipo', status: 'pending' },
    { nombre: 'Estadísticas Generales', url: 'http://127.0.0.1:8000/estadisticas/generales', status: 'pending' },
    { nombre: 'Dashboard Completo', url: 'http://127.0.0.1:8000/dashboard', status: 'pending' }
  ]);

  const [probandoTodo, setProbandoTodo] = useState(false);

  const hasCredentials = () => {
    if (typeof window === 'undefined') return false;
    const authData = localStorage.getItem('auth_credentials');
    return !!authData;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const authData = localStorage.getItem('auth_credentials');
    if (!authData) {
      return { 'Content-Type': 'application/json' };
    }
    
    try {
      const { username, password } = JSON.parse(authData);
      const basicAuth = btoa(`${username}:${password}`);
      return {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  };

  const probarEndpoint = async (index: number) => {
    const test = resultados[index];
    
    // Actualizar estado a loading
    setResultados(prev => prev.map((item, i) => 
      i === index ? { ...item, status: 'loading' } : item
    ));

    try {
      const headers = getAuthHeaders();
      const response = await fetch(test.url, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const datos = await response.json();
        setResultados(prev => prev.map((item, i) => 
          i === index ? { 
            ...item, 
            status: 'success', 
            mensaje: `✅ OK (${response.status})`,
            datos: Array.isArray(datos) ? `${datos.length} elementos` : typeof datos
          } : item
        ));
      } else {
        setResultados(prev => prev.map((item, i) => 
          i === index ? { 
            ...item, 
            status: 'error', 
            mensaje: `❌ Error ${response.status}: ${response.statusText}`
          } : item
        ));
      }
    } catch (error) {
      setResultados(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'error', 
          mensaje: `❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`
        } : item
      ));
    }
  };

  const probarTodo = async () => {
    setProbandoTodo(true);
    
    // Resetear todos los resultados
    setResultados(prev => prev.map(item => ({ ...item, status: 'pending', mensaje: undefined, datos: undefined })));
    
    // Probar cada endpoint secuencialmente
    for (let i = 0; i < resultados.length; i++) {
      await probarEndpoint(i);
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setProbandoTodo(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <FiLoader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-600" />;
      case 'error':
        return <FiX className="w-5 h-5 text-red-600" />;
      default:
        return <FiWifi className="w-5 h-5 text-gray-400" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const resumenEstado = () => {
    const exitosos = resultados.filter(r => r.status === 'success').length;
    const errores = resultados.filter(r => r.status === 'error').length;
    const pendientes = resultados.filter(r => r.status === 'pending').length;
    const cargando = resultados.filter(r => r.status === 'loading').length;
    
    return { exitosos, errores, pendientes, cargando, total: resultados.length };
  };

  const resumen = resumenEstado();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🌐 Test de Conectividad Completo
              </h1>
              <p className="text-gray-600 mb-2">
                Verificación exhaustiva de todos los endpoints de la API corregida
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasCredentials() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${hasCredentials() ? 'text-green-700' : 'text-red-700'}`}>
                  {hasCredentials() ? '🔓 Credenciales cargadas' : '🔒 No hay credenciales - Inicia sesión primero'}
                </span>
              </div>
            </div>
            
            <button
              onClick={probarTodo}
              disabled={probandoTodo}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {probandoTodo ? (
                <FiLoader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FiPlay className="w-5 h-5 mr-2" />
              )}
              {probandoTodo ? 'Probando...' : 'Probar Todo'}
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{resumen.exitosos}</div>
            <div className="text-sm text-green-700">Exitosos</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{resumen.errores}</div>
            <div className="text-sm text-red-700">Errores</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{resumen.cargando}</div>
            <div className="text-sm text-blue-700">Probando</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{resumen.pendientes}</div>
            <div className="text-sm text-gray-700">Pendientes</div>
          </div>
        </div>

        {/* Lista de Tests */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Endpoints de la API</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {resultados.map((test, index) => (
              <div key={index} className={`p-6 transition-colors ${statusColor(test.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {statusIcon(test.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{test.nombre}</h4>
                      <p className="text-sm text-gray-600 font-mono">{test.url}</p>
                      {test.datos && (
                        <p className="text-xs text-gray-500 mt-1">Respuesta: {test.datos}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {test.mensaje && (
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        test.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : test.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {test.mensaje}
                      </span>
                    )}
                    
                    <button
                      onClick={() => probarEndpoint(index)}
                      disabled={test.status === 'loading'}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Probar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info sobre autenticación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <FiServer className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">🔐 Autenticación Activa</h3>
              <p className="text-sm text-blue-800 mb-2">
                Los tests ahora usan las credenciales almacenadas en localStorage para autenticación HTTP Basic.
              </p>
              <p className="text-xs text-blue-700">
                Si obtienes errores 401, asegúrate de haber iniciado sesión primero desde la página de login.
              </p>
            </div>
          </div>
        </div>



        {/* Información técnica */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">ℹ️ Estado del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Backend:</strong> FastAPI en http://127.0.0.1:8000
              <br />
              <strong>Frontend:</strong> Next.js 15.5.4 en http://localhost:3000
              <br />
              <strong>Base de Datos:</strong> MySQL/SQLite con SQLAlchemy
            </div>
            <div>
              <strong>Autenticación:</strong> HTTP Basic Auth
              <br />
              <strong>CORS:</strong> Configurado para desarrollo
              <br />
              <strong>Estado:</strong> {resumen.exitosos === resumen.total ? '✅ Todo funcionando' : '⚠️ Algunos problemas'}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
