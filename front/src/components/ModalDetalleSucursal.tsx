'use client';

import { useState, useEffect } from 'react';
import { 
  FiX, 
  FiMapPin, 
  FiHome, 
  FiAlertTriangle, 
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
  FiBarChart,
  FiTrendingUp,
  FiActivity,
  FiEye,
  FiPhone,
  FiUsers,
  FiMail,
  FiUser,
  FiShield,
  FiPhoneCall
} from 'react-icons/fi';
import ModalDetalleSiniestro from './ModalDetalleSiniestro';

interface InformacionBasica {
  id_centro: string;
  nombre: string;
  zona: {
    id: number;
    nombre: string;
  };
  estado: {
    id: number;
    nombre: string;
    municipio: string;
  };
  tipo_sucursal: string;
  estado_activo: boolean | null;
  telefono: string | null;
  ext: string | null;
  direccion: string | null;
  horarios: {
    horario_publico: string | null;
    horario_interno: string | null;
    comentario: string | null;
  };
  ubicacion: {
    latitud: number | null;
    longitud: number | null;
    link_mymaps: string | null;
    link_maps: string | null;
  };
}

interface Estadisticas {
  total_siniestros: number;
  monto_total_perdidas: number;
  monto_recuperado: number;
  siniestros_frustrados: number;
  siniestros_finalizados: number;
  siniestros_pendientes: number;
  siniestros_no_frustrados: number;
  siniestros_año_actual: number;
  siniestros_mes_actual: number;
}

interface SiniestroPorTipo {
  tipo: string;
  cantidad: number;
  monto_perdidas: number;
}

interface UltimoSiniestro {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  frustrado: boolean;
  finalizado: boolean;
  monto_perdidas: number;
}

interface PersonalOperativo {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  cargo: string;
  id_cargo: string;
  detalle: string | null;
  estatus: number;
}

interface ContactoEmergencia {
  id: number;
  nombre: string;
  telefono1: string;
  telefono2: string | null;
  detalle: string | null;
  tipo_servicio: string;
  id_tipo_servicio: string;
  descripcion_tipo: string;
}

interface DetalleSucursal {
  informacion_basica: InformacionBasica;
  estadisticas: Estadisticas;
  siniestros_por_tipo: SiniestroPorTipo[];
  ultimos_siniestros: UltimoSiniestro[];
  personal_operativo: PersonalOperativo[];
  contactos_emergencia: ContactoEmergencia[];
}

interface ModalDetalleSucursalProps {
  isOpen: boolean;
  onClose: () => void;
  idCentro: string;
}


export default function ModalDetalleSucursal({ isOpen, onClose, idCentro }: ModalDetalleSucursalProps) {
  const [detalle, setDetalle] = useState<DetalleSucursal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSiniestroModal, setShowSiniestroModal] = useState(false);
  const [siniestroDetalle, setSiniestroDetalle] = useState<any>(null);

  const getAuthHeaders = () => {
    const authData = localStorage.getItem('auth_credentials');
    if (!authData) return null;
    try {
      const { username, password } = JSON.parse(authData);
      const basicAuth = btoa(`${username}:${password}`);
      return {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return null;
    }
  };

  const loadDetalleSucursal = async () => {
    if (!idCentro) return;
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net';
      const response = await fetch(`${API_URL}/sucursal_detalle/${idCentro}`, {
        headers,
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sucursal no encontrada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDetalle(data.data);
    } catch (err: any) {
      console.error('Error cargando detalle de sucursal:', err);
      setError(err.message || 'Error cargando información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && idCentro) {
      loadDetalleSucursal();
    }
  }, [isOpen, idCentro]);

  const handleClose = () => {
    setDetalle(null);
    setError(null);
    setShowSiniestroModal(false);
    setSiniestroDetalle(null);
    onClose();
  };

  const abrirMapa = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Nueva función para ver detalle de siniestro
  const handleViewSiniestroDetail = async (id: number) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net';
      const response = await fetch(`${API_URL}/siniestros/${id}`, {
        headers,
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) {
        throw new Error(`Error cargando detalle: ${response.status}`);
      }
      const data = await response.json();
      setSiniestroDetalle(data.siniestro);
      setShowSiniestroModal(true);
    } catch (error: any) {
      setError(error.message || 'Error cargando detalle del siniestro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiHome className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Detalle de Sucursal</h2>
              <p className="text-blue-100">ID Centro: {idCentro}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando información...</span>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {detalle && (
            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiHome className="w-5 h-5 mr-2" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-gray-900 font-medium">{detalle.informacion_basica.nombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-gray-900">{detalle.informacion_basica.tipo_sucursal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="flex items-center space-x-2">
                      {detalle.informacion_basica.estado_activo === true ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheckCircle className="w-3 h-3 mr-1" />
                          Activa
                        </span>
                      ) : detalle.informacion_basica.estado_activo === false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FiXCircle className="w-3 h-3 mr-1" />
                          Inactiva
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ND
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zona</label>
                    <p className="text-gray-900">Zona {detalle.informacion_basica.zona.nombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado/Municipio</label>
                    <p className="text-gray-900">{detalle.informacion_basica.estado.nombre} - {detalle.informacion_basica.estado.municipio}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <p className="text-gray-900">{detalle.informacion_basica.direccion || 'No disponible'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <div className="flex items-center space-x-1">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">
                        {detalle.informacion_basica.telefono || 'No disponible'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ext.</label>
                    <p className="text-gray-900">{detalle.informacion_basica.ext || 'No disponible'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ubicación</label>
                    <div className="flex items-center space-x-2">
                      {detalle.informacion_basica.ubicacion.latitud && detalle.informacion_basica.ubicacion.longitud ? (
                        <span className="text-gray-900 text-sm">
                          {detalle.informacion_basica.ubicacion.latitud.toFixed(6)}, {detalle.informacion_basica.ubicacion.longitud.toFixed(6)}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">No disponible</span>
                      )}
                      {detalle.informacion_basica.ubicacion.link_mymaps && (
                        <button
                          onClick={() => abrirMapa(detalle.informacion_basica.ubicacion.link_mymaps)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver en MyMaps"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horario Público</label>
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">
                        {detalle.informacion_basica.horarios.horario_publico || 'No disponible'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horario Interno</label>
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">
                        {detalle.informacion_basica.horarios.horario_interno || 'No disponible'}
                      </p>
                    </div>
                  </div>
                  {detalle.informacion_basica.horarios.comentario && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <label className="text-sm font-medium text-gray-500">Comentarios de Horario</label>
                      <p className="text-gray-900 text-sm bg-gray-100 p-2 rounded">
                        {detalle.informacion_basica.horarios.comentario}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Operativo */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUsers className="w-5 h-5 mr-2" />
                  Personal Operativo
                </h3>
                {detalle.personal_operativo && detalle.personal_operativo.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detalle.personal_operativo.map((persona) => (
                      <div key={persona.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-3">
                          <FiUser className="w-5 h-5 text-blue-600 mr-2" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{persona.nombre}</h4>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {persona.cargo}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <FiPhone className="w-4 h-4 mr-2" />
                            <span>{persona.telefono}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiMail className="w-4 h-4 mr-2" />
                            <span className="truncate">{persona.correo}</span>
                          </div>
                          {persona.detalle && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                              {persona.detalle}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay personal operativo registrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No se encontró personal operativo asignado a esta sucursal.
                    </p>
                  </div>
                )}
              </div>

              {/* Contactos de Seguridad Pública */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiShield className="w-5 h-5 mr-2" />
                  Contactos de Seguridad Pública
                </h3>
                {detalle.contactos_emergencia && detalle.contactos_emergencia.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detalle.contactos_emergencia.map((contacto) => (
                      <div key={contacto.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-3">
                          <FiPhoneCall className="w-5 h-5 text-red-600 mr-2" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{contacto.nombre}</h4>
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                              {contacto.tipo_servicio}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <FiPhone className="w-4 h-4 mr-2" />
                            <span className="font-medium">{contacto.telefono1}</span>
                          </div>
                          {contacto.telefono2 && (
                            <div className="flex items-center text-gray-600">
                              <FiPhone className="w-4 h-4 mr-2" />
                              <span>{contacto.telefono2}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {contacto.descripcion_tipo}
                          </div>
                          {contacto.detalle && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                              {contacto.detalle}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiShield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay contactos de emergencia registrados
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No se encontraron contactos de seguridad pública para este estado.
                    </p>
                  </div>
                )}
              </div>

              {/* Estadísticas Generales */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiBarChart className="w-5 h-5 mr-2" />
                  Estadísticas Generales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{detalle.estadisticas.total_siniestros}</div>
                    <div className="text-sm text-gray-600">Total Siniestros</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">${detalle.estadisticas.monto_total_perdidas.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Pérdidas Totales</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${detalle.estadisticas.monto_recuperado.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Monto Recuperado</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{detalle.estadisticas.siniestros_frustrados}</div>
                    <div className="text-sm text-gray-600">Frustrados</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{detalle.estadisticas.siniestros_pendientes}</div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">{detalle.estadisticas.siniestros_no_frustrados}</div>
                    <div className="text-sm text-gray-600">No Frustrados</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">{detalle.estadisticas.siniestros_finalizados}</div>
                    <div className="text-xs text-gray-600">Finalizados</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">{detalle.estadisticas.siniestros_año_actual}</div>
                    <div className="text-xs text-gray-600">Este Año</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">{detalle.estadisticas.siniestros_mes_actual}</div>
                    <div className="text-xs text-gray-600">Este Mes</div>
                  </div>
                </div>
              </div>

              {/* Siniestros por Tipo */}
              {detalle.siniestros_por_tipo.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiActivity className="w-5 h-5 mr-2" />
                    Siniestros por Tipo
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pérdidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detalle.siniestros_por_tipo.map((tipo, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{tipo.tipo}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{tipo.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">${tipo.monto_perdidas.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Últimos Siniestros */}
              {detalle.ultimos_siniestros.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiTrendingUp className="w-5 h-5 mr-2" />
                    Últimos Siniestros
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pérdidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detalle.ultimos_siniestros.map((siniestro) => (
                          <tr key={siniestro.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center space-x-2">
                              {siniestro.id}
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalle del siniestro"
                                onClick={() => handleViewSiniestroDetail(siniestro.id)}
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center">
                                <FiCalendar className="w-3 h-3 mr-1 text-gray-400" />
                                {siniestro.fecha}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center">
                                <FiClock className="w-3 h-3 mr-1 text-gray-400" />
                                {siniestro.hora}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{siniestro.tipo}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {siniestro.frustrado && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    Frustrado
                                  </span>
                                )}
                                {siniestro.finalizado && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Finalizado
                                  </span>
                                )}
                                {!siniestro.frustrado && !siniestro.finalizado && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              ${siniestro.monto_perdidas.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de detalle de siniestro */}
        <ModalDetalleSiniestro
          isOpen={showSiniestroModal}
          onClose={() => { setShowSiniestroModal(false); setSiniestroDetalle(null); }}
          siniestroDetalle={siniestroDetalle}
        />

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
