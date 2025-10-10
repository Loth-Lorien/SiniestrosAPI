'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiUser, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiLoader,
  FiCheckCircle,
  FiDatabase
} from 'react-icons/fi';

export default function LoginRealPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Test de conectividad al cargar la página
  useEffect(() => {
    const testConnection = async () => {
      setTestingConnection(true);
      try {
        const response = await fetch('http://localhost:8000/', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Backend no disponible');
        }
      } catch (error) {
        setError('No se puede conectar con el backend. ¿Está corriendo en puerto 8000?');
      } finally {
        setTestingConnection(false);
      }
    };

    testConnection();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.usuario || !formData.password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login con HTTP Basic Auth...');
      
      // Crear credenciales HTTP Basic Auth
      const basicAuth = btoa(`${formData.usuario}:${formData.password}`);
      
      // Probar autenticación con un endpoint protegido
      const response = await fetch('http://localhost:8000/usuarios', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales inválidas');
        }
        throw new Error(`Error del servidor: ${response.status}`);
      }

      // Login exitoso - guardar credenciales y datos de usuario
      const userInfo = {
        id: Date.now(),
        usuario: formData.usuario,
        nombre: formData.usuario.charAt(0).toUpperCase() + formData.usuario.slice(1),
        rol: 'Usuario Autenticado'
      };

      // Guardar en localStorage
      localStorage.setItem('auth_credentials', JSON.stringify({
        username: formData.usuario,
        password: formData.password
      }));
      localStorage.setItem('user_data', JSON.stringify(userInfo));
      
      console.log('✅ Login exitoso, redirigiendo al dashboard...');
      
      // Redirigir al dashboard principal
      router.push('/dashboard');
      
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCredentials = () => {
    setFormData({
      usuario: 'admin',
      password: 'admin'
    });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <FiDatabase className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sistema de Siniestros
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Login con API Real - HTTP Basic Auth
          </p>
          
          {/* Estado de conexión */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            {testingConnection ? (
              <>
                <FiLoader className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-600">Verificando backend...</span>
              </>
            ) : error && error.includes('Backend no disponible') ? (
              <>
                <FiAlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Backend desconectado</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Backend conectado</span>
              </>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Campo Usuario */}
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.usuario}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su usuario"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Botón de Login */}
            <div>
              <button
                type="submit"
                disabled={loading || Boolean(error && error.includes('Backend no disponible'))}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                    Autenticando...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Separador */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O</span>
              </div>
            </div>
          </div>

          {/* Botón de Demo */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleDemoCredentials}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Usar credenciales de prueba
            </button>
          </div>

          {/* Info de credenciales */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Credenciales sugeridas:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>Usuario: <code className="bg-blue-100 px-1 rounded">admin</code></div>
              <div>Contraseña: <code className="bg-blue-100 px-1 rounded">admin</code></div>
              <p className="mt-2 text-blue-600">
                * Usa las credenciales de tu base de datos
              </p>
            </div>
          </div>
        </div>

        {/* Info técnica */}
        <div className="text-center text-xs text-gray-500">
          <p>Autenticación HTTP Basic • FastAPI Backend</p>
          <p>Frontend: localhost:3000 • Backend: localhost:8000</p>
        </div>
      </div>
    </div>
  );
}
