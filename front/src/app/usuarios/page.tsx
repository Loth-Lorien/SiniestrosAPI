'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import { useState } from 'react';
import { 
  FiUsers, 
  FiPlus, 
  FiSearch, 
  FiFilter,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiAlertTriangle,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

interface UsuarioMock {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'supervisor' | 'operador';
  sucursal: string;
  fechaCreacion: string;
  ultimoAcceso: string;
  activo: boolean;
  avatar?: string;
}

// Datos de ejemplo de usuarios
const usuariosMock: UsuarioMock[] = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@siniestros.com',
    telefono: '+34 666 123 456',
    rol: 'admin',
    sucursal: 'Oficina Central',
    fechaCreacion: '2024-01-15',
    ultimoAcceso: '2024-10-07T10:30:00',
    activo: true
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'García',
    email: 'maria.garcia@siniestros.com',
    telefono: '+34 666 789 123',
    rol: 'supervisor',
    sucursal: 'Sucursal Norte',
    fechaCreacion: '2024-02-20',
    ultimoAcceso: '2024-10-06T15:45:00',
    activo: true
  },
  {
    id: 3,
    nombre: 'Carlos',
    apellido: 'López',
    email: 'carlos.lopez@siniestros.com',
    telefono: '+34 666 456 789',
    rol: 'operador',
    sucursal: 'Sucursal Sur',
    fechaCreacion: '2024-03-10',
    ultimoAcceso: '2024-10-05T09:15:00',
    activo: true
  },
  {
    id: 4,
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@siniestros.com',
    telefono: '+34 666 321 654',
    rol: 'operador',
    sucursal: 'Sucursal Este',
    fechaCreacion: '2024-04-05',
    ultimoAcceso: '2024-09-28T16:20:00',
    activo: false
  },
  {
    id: 5,
    nombre: 'Luis',
    apellido: 'Rodríguez',
    email: 'luis.rodriguez@siniestros.com',
    telefono: '+34 666 987 321',
    rol: 'supervisor',
    sucursal: 'Sucursal Oeste',
    fechaCreacion: '2024-05-12',
    ultimoAcceso: '2024-10-07T08:45:00',
    activo: true
  }
];

const roles = [
  { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  { value: 'supervisor', label: 'Supervisor', color: 'bg-blue-100 text-blue-800' },
  { value: 'operador', label: 'Operador', color: 'bg-green-100 text-green-800' }
];

const sucursalesDisponibles = [
  'Oficina Central',
  'Sucursal Norte',
  'Sucursal Sur',
  'Sucursal Este',
  'Sucursal Oeste'
];

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioMock | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'operador',
    sucursal: '',
    password: '',
    confirmPassword: ''
  });

  // Filtrar usuarios
  const usuariosFiltrados = usuariosMock.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = !filtroRol || usuario.rol === filtroRol;
    const matchesActivo = !filtroActivo || 
                         (filtroActivo === 'activo' && usuario.activo) ||
                         (filtroActivo === 'inactivo' && !usuario.activo);
    
    return matchesSearch && matchesRol && matchesActivo;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getRolInfo = (rol: string) => {
    return roles.find(r => r.value === rol) || roles[2];
  };

  const handleGuardarUsuario = () => {
    console.log('Guardando usuario:', usuarioEditando ? 'Editando' : 'Nuevo', nuevoUsuario);
    // Aquí iría la lógica para guardar/editar usuario
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setNuevoUsuario({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      rol: 'operador',
      sucursal: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleEditarUsuario = (usuario: UsuarioMock) => {
    setUsuarioEditando(usuario);
    setNuevoUsuario({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      sucursal: usuario.sucursal,
      password: '',
      confirmPassword: ''
    });
    setMostrarFormulario(true);
  };

  const handleToggleActivo = (id: number) => {
    console.log('Cambiando estado del usuario:', id);
    // Aquí iría la lógica para activar/desactivar usuario
  };

  const handleEliminarUsuario = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      console.log('Eliminando usuario:', id);
      // Aquí iría la lógica para eliminar usuario
    }
  };

  const getUserInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-2">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
          
          <button 
            onClick={() => {
              setUsuarioEditando(null);
              setNuevoUsuario({
                nombre: '',
                apellido: '',
                email: '',
                telefono: '',
                rol: 'operador',
                sucursal: '',
                password: '',
                confirmPassword: ''
              });
              setMostrarFormulario(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{usuariosMock.length}</p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-3xl font-bold text-green-600">
                  {usuariosMock.filter(u => u.activo).length}
                </p>
              </div>
              <FiUserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-3xl font-bold text-purple-600">
                  {usuariosMock.filter(u => u.rol === 'admin').length}
                </p>
              </div>
              <FiShield className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactivos</p>
                <p className="text-3xl font-bold text-red-600">
                  {usuariosMock.filter(u => !u.activo).length}
                </p>
              </div>
              <FiUserX className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-900"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="" className="text-gray-600">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.value} value={rol.value}>{rol.label}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroRol('');
                setFiltroActivo('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Usuarios ({usuariosFiltrados.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {getUserInitials(usuario.nombre, usuario.apellido)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellido}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRolInfo(usuario.rol).color}`}>
                          {getRolInfo(usuario.rol).label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiMail className="w-4 h-4 mr-2" />
                          {usuario.email}
                        </div>
                        <div className="flex items-center">
                          <FiPhone className="w-4 h-4 mr-2" />
                          {usuario.telefono}
                        </div>
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 mr-2" />
                          {usuario.sucursal}
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          Último acceso: {formatDateTime(usuario.ultimoAcceso)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditarUsuario(usuario)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActivo(usuario.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        usuario.activo
                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                    >
                      {usuario.activo ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEliminarUsuario(usuario.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Formulario Usuario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button 
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                    placeholder="Nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.apellido}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                    placeholder="Apellido"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={nuevoUsuario.telefono}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                    placeholder="+34 666 123 456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={nuevoUsuario.rol}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.map(rol => (
                      <option key={rol.value} value={rol.value}>{rol.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal *
                  </label>
                  <select
                    value={nuevoUsuario.sucursal}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, sucursal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar sucursal</option>
                    {sucursalesDisponibles.map(sucursal => (
                      <option key={sucursal} value={sucursal}>{sucursal}</option>
                    ))}
                  </select>
                </div>

                {!usuarioEditando && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={mostrarPassword ? 'text' : 'password'}
                          value={nuevoUsuario.password}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassword(!mostrarPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {mostrarPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña *
                      </label>
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        value={nuevoUsuario.confirmPassword}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                        placeholder="Confirmar contraseña"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarUsuario}
                  disabled={!nuevoUsuario.nombre || !nuevoUsuario.apellido || !nuevoUsuario.email || !nuevoUsuario.sucursal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información sobre datos de ejemplo */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Gestión de usuarios de demostración</strong> - Los usuarios mostrados son ejemplos.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Una vez conectado con la API, podrás gestionar usuarios reales con autenticación completa.
              </p>
            </div>
          </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
