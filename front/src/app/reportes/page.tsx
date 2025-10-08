'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState } from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiCalendar,
  FiFilter,
  FiSearch,
  FiPrinter,
  FiMail,
  FiEye,
  FiClock,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';

interface ReporteMock {
  id: number;
  nombre: string;
  tipo: string;
  fechaCreacion: string;
  estado: 'generando' | 'completado' | 'error';
  tamaño: string;
  creadoPor: string;
  parametros: {
    periodo: string;
    sucursales: string[];
    tiposSiniestro: string[];
  };
}

// Reportes de ejemplo
const reportesMock: ReporteMock[] = [
  {
    id: 1,
    nombre: 'Reporte Mensual Octubre 2024',
    tipo: 'Análisis Mensual',
    fechaCreacion: '2024-10-07T10:30:00',
    estado: 'completado',
    tamaño: '2.4 MB',
    creadoPor: 'Juan Pérez',
    parametros: {
      periodo: 'Octubre 2024',
      sucursales: ['Centro', 'Norte'],
      tiposSiniestro: ['Robo con violencia', 'Fraude electrónico']
    }
  },
  {
    id: 2,
    nombre: 'Estadísticas por Sucursal Q3 2024',
    tipo: 'Análisis por Sucursal',
    fechaCreacion: '2024-10-06T15:45:00',
    estado: 'completado',
    tamaño: '1.8 MB',
    creadoPor: 'María García',
    parametros: {
      periodo: 'Q3 2024',
      sucursales: ['Todas'],
      tiposSiniestro: ['Todos']
    }
  },
  {
    id: 3,
    nombre: 'Reporte Semanal en Proceso',
    tipo: 'Análisis Semanal',
    fechaCreacion: '2024-10-07T12:15:00',
    estado: 'generando',
    tamaño: '-',
    creadoPor: 'Carlos López',
    parametros: {
      periodo: 'Semana 40',
      sucursales: ['Sur', 'Este'],
      tiposSiniestro: ['Hurto menor']
    }
  }
];

const tiposReporte = [
  { value: 'mensual', label: 'Reporte Mensual' },
  { value: 'semanal', label: 'Reporte Semanal' },
  { value: 'sucursal', label: 'Análisis por Sucursal' },
  { value: 'tipo_siniestro', label: 'Análisis por Tipo' },
  { value: 'personalizado', label: 'Reporte Personalizado' }
];

const sucursalesDisponibles = [
  'Sucursal Centro',
  'Sucursal Norte', 
  'Sucursal Sur',
  'Sucursal Este',
  'Sucursal Oeste'
];

const tiposSiniestroDisponibles = [
  'Robo con violencia',
  'Fraude electrónico',
  'Hurto menor',
  'Falsificación',
  'Otros'
];

export default function ReportesPage() {
  const [mostrarNuevoReporte, setMostrarNuevoReporte] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [nuevoReporte, setNuevoReporte] = useState({
    tipo: '',
    nombre: '',
    periodo: '',
    sucursales: [] as string[],
    tiposSiniestro: [] as string[]
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'generando':
        return <FiClock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'error':
        return <FiAlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'generando':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const reportesFiltrados = reportesMock.filter(reporte => {
    const matchesSearch = reporte.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reporte.creadoPor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !filtroTipo || reporte.tipo === filtroTipo;
    return matchesSearch && matchesTipo;
  });

  const handleGenerarReporte = () => {
    console.log('Generando reporte:', nuevoReporte);
    // Aquí iría la lógica para generar el reporte
    setMostrarNuevoReporte(false);
    setNuevoReporte({
      tipo: '',
      nombre: '',
      periodo: '',
      sucursales: [],
      tiposSiniestro: []
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes e Informes</h1>
            <p className="text-gray-600 mt-2">
              Genera y gestiona reportes detallados de siniestros
            </p>
          </div>
          
          <button 
            onClick={() => setMostrarNuevoReporte(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiFileText className="w-4 h-4 mr-2" />
            Nuevo Reporte
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="Análisis Mensual">Análisis Mensual</option>
                <option value="Análisis Semanal">Análisis Semanal</option>
                <option value="Análisis por Sucursal">Análisis por Sucursal</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroTipo('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Reportes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Reportes Generados ({reportesFiltrados.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {reportesFiltrados.map((reporte) => (
              <div key={reporte.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FiFileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{reporte.nombre}</h4>
                        <p className="text-sm text-gray-600">{reporte.tipo}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reporte.estado)}`}>
                        {getEstadoIcon(reporte.estado)}
                        <span className="ml-1 capitalize">{reporte.estado}</span>
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Creado por:</span>
                        <div className="flex items-center mt-1">
                          <FiUser className="w-4 h-4 text-gray-400 mr-1" />
                          {reporte.creadoPor}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Fecha:</span>
                        <div className="flex items-center mt-1">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                          {formatDate(reporte.fechaCreacion)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Tamaño:</span>
                        <div className="mt-1">{reporte.tamaño}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Parámetros:</span>
                        <div className="mt-1 text-xs">
                          <div>Periodo: {reporte.parametros.periodo}</div>
                          <div>Sucursales: {reporte.parametros.sucursales.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {reporte.estado === 'completado' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                        <FiPrinter className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                        <FiMail className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Nuevo Reporte */}
        {mostrarNuevoReporte && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Generar Nuevo Reporte</h3>
                <button 
                  onClick={() => setMostrarNuevoReporte(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Reporte
                  </label>
                  <select
                    value={nuevoReporte.tipo}
                    onChange={(e) => setNuevoReporte({...nuevoReporte, tipo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposReporte.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Reporte
                  </label>
                  <input
                    type="text"
                    value={nuevoReporte.nombre}
                    onChange={(e) => setNuevoReporte({...nuevoReporte, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej. Reporte Mensual Octubre 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <input
                    type="text"
                    value={nuevoReporte.periodo}
                    onChange={(e) => setNuevoReporte({...nuevoReporte, periodo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej. Octubre 2024, Q3 2024, Semana 40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursales (Opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {sucursalesDisponibles.map(sucursal => (
                      <label key={sucursal} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={nuevoReporte.sucursales.includes(sucursal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNuevoReporte({
                                ...nuevoReporte,
                                sucursales: [...nuevoReporte.sucursales, sucursal]
                              });
                            } else {
                              setNuevoReporte({
                                ...nuevoReporte,
                                sucursales: nuevoReporte.sucursales.filter(s => s !== sucursal)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{sucursal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Siniestro (Opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposSiniestroDisponibles.map(tipo => (
                      <label key={tipo} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={nuevoReporte.tiposSiniestro.includes(tipo)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNuevoReporte({
                                ...nuevoReporte,
                                tiposSiniestro: [...nuevoReporte.tiposSiniestro, tipo]
                              });
                            } else {
                              setNuevoReporte({
                                ...nuevoReporte,
                                tiposSiniestro: nuevoReporte.tiposSiniestro.filter(t => t !== tipo)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setMostrarNuevoReporte(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarReporte}
                  disabled={!nuevoReporte.tipo || !nuevoReporte.nombre}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Generar Reporte
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
                <strong>Funcionalidad de demostración</strong> - Los reportes mostrados son ejemplos.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Una vez conectado con la API, podrás generar reportes reales en PDF y Excel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
