'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiSave, FiX, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { CrearSiniestro, ActualizarSiniestro, TipoSiniestro, Sucursal, Usuario } from '../types/api';
import { tiposService, siniestrosService } from '../lib/services';

interface FormularioSiniestroProps {
  modo: 'crear' | 'editar';
  siniestro?: any;
  onSave: (data: CrearSiniestro | ActualizarSiniestro) => void;
  onCancel: () => void;
}

export default function FormularioSiniestro({ modo, siniestro, onSave, onCancel }: FormularioSiniestroProps) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    idCentro: '',
    fecha: '',
    hora: '',
    idTipoCuenta: 0,
    frustrado: false,
    finalizado: false,
    detalle: '',
    idRealizo: 1, // Usuario por defecto
    perdidas: [{ idTipoPerdida: 0, monto: 0, recuperado: false, detalle: '' }],
    implicados: [{ idSexo: '', idRangoEdad: 0, detalle: '' }]
  });

  // Estados para catálogos
  const [tiposSiniestro, setTiposSiniestro] = useState<TipoSiniestro[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tiposPerdida, setTiposPerdida] = useState<any[]>([]);
  const [sexos, setSexos] = useState<any[]>([]);
  const [rangosEdad, setRangosEdad] = useState<any[]>([]);
  
  // Estados de control
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  // Tipos de siniestro que requieren foto (IDs correspondientes en la BD)
  const TIPOS_CON_FOTO = ['Asalto', 'Extorsion', 'Fardero', 'Intruso', 'Sospechoso'];

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoading(true);
        
        const [tiposResp, sucursalesResp, perdidasResp, sexosResp, rangosResp] = await Promise.all([
          tiposService.getTiposSiniestro(),
          tiposService.getSucursales(),
          tiposService.getTiposPerdida(),
          tiposService.getSexos(),
          tiposService.getRangosEdad()
        ]);

        setTiposSiniestro(tiposResp);
        setSucursales(sucursalesResp);
        setTiposPerdida(perdidasResp);
        setSexos(sexosResp);
        setRangosEdad(rangosResp);

        // Si es modo edición, cargar datos del siniestro
        if (modo === 'editar' && siniestro) {
          const fechaSiniestro = new Date(siniestro.fecha);
          const fechaStr = fechaSiniestro.toISOString().split('T')[0];
          const horaStr = fechaSiniestro.toTimeString().split(' ')[0].substring(0, 5);

          setFormData({
            idCentro: siniestro.idCentro || '',
            fecha: fechaStr,
            hora: horaStr,
            idTipoCuenta: siniestro.idTipoCuenta || 0,
            frustrado: siniestro.frustrado || false,
            finalizado: siniestro.finalizado || false,
            detalle: siniestro.detalle || '',
            idRealizo: siniestro.idRealizo || 1,
            perdidas: siniestro.perdidas?.length > 0 ? siniestro.perdidas : [{ idTipoPerdida: 0, monto: 0, recuperado: false, detalle: '' }],
            implicados: siniestro.implicados?.length > 0 ? siniestro.implicados : [{ idSexo: '', idRangoEdad: 0, detalle: '' }]
          });
        }

      } catch (err) {
        console.error('Error cargando catálogos:', err);
        setError('Error al cargar los catálogos necesarios');
      } finally {
        setLoading(false);
      }
    };

    cargarCatalogos();
  }, [modo, siniestro]);

  // Función para obtener la fecha y hora actual
  const getFechaHoraActual = () => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
    return { fecha, hora };
  };

  // Actualizar campo del formulario
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Establecer fecha y hora actual
  const setFechaHoraActual = () => {
    const { fecha, hora } = getFechaHoraActual();
    setFormData(prev => ({
      ...prev,
      fecha,
      hora
    }));
  };

  // Agregar pérdida
  const agregarPerdida = () => {
    setFormData(prev => ({
      ...prev,
      perdidas: [...prev.perdidas, { idTipoPerdida: 0, monto: 0, recuperado: false, detalle: '' }]
    }));
  };

  // Eliminar pérdida
  const eliminarPerdida = (index: number) => {
    setFormData(prev => ({
      ...prev,
      perdidas: prev.perdidas.filter((_, i) => i !== index)
    }));
  };

  // Actualizar pérdida
  const updatePerdida = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      perdidas: prev.perdidas.map((perdida, i) => 
        i === index ? { ...perdida, [field]: value } : perdida
      )
    }));
  };

  // Agregar implicado
  const agregarImplicado = () => {
    setFormData(prev => ({
      ...prev,
      implicados: [...prev.implicados, { idSexo: '', idRangoEdad: 0, detalle: '' }]
    }));
  };

  // Eliminar implicado
  const eliminarImplicado = (index: number) => {
    setFormData(prev => ({
      ...prev,
      implicados: prev.implicados.filter((_, i) => i !== index)
    }));
  };

  // Actualizar implicado
  const updateImplicado = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      implicados: prev.implicados.map((implicado, i) => 
        i === index ? { ...implicado, [field]: value } : implicado
      )
    }));
  };

  // Validar formulario
  const validarFormulario = (): string | null => {
    if (!formData.idCentro) return 'Debe seleccionar una sucursal';
    if (!formData.fecha) return 'Debe especificar la fecha';
    if (!formData.hora) return 'Debe especificar la hora';
    if (!formData.idTipoCuenta) return 'Debe seleccionar un tipo de siniestro';
    if (formData.perdidas.some(p => !p.idTipoPerdida || p.monto <= 0)) {
      return 'Todas las pérdidas deben tener tipo y monto mayor a 0';
    }
    if (formData.implicados.some(i => !i.idSexo || !i.idRangoEdad)) {
      return 'Todos los implicados deben tener sexo y rango de edad';
    }
    return null;
  };

  // Manejar selección de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen no puede superar los 10MB');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      
      setFotoSeleccionada(file);
      
      // Generar vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setVistaPrevia(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Función para verificar si el tipo de siniestro requiere foto
  const requiereFoto = (): boolean => {
    const tipoSeleccionado = tiposSiniestro.find(t => t.idTipoSiniestro === formData.idTipoCuenta);
    return tipoSeleccionado ? TIPOS_CON_FOTO.includes(tipoSeleccionado.Cuenta) : false;
  };

  // Guardar siniestro
  const handleSave = async () => {
    const error = validarFormulario();
    if (error) {
      setError(error);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Combinar fecha y hora
      const fechaCompleta = `${formData.fecha} ${formData.hora}:00`;

      const data = {
        idCentro: formData.idCentro,
        fecha: fechaCompleta,
        idTipoCuenta: formData.idTipoCuenta,
        frustrado: formData.frustrado,
        finalizado: formData.finalizado,
        detalle: formData.detalle || undefined,
        idRealizo: formData.idRealizo,
        perdidas: formData.perdidas,
        implicados: formData.implicados
      };

      let idSiniestro: number | null = null;

      if (modo === 'crear') {
        // Crear nuevo siniestro
        console.log('📤 Creando siniestro...');
        const respuesta = await siniestrosService.crearSiniestro(data as CrearSiniestro);
        
        if (!respuesta.estatus) {
          throw new Error(respuesta.mensaje || 'Error al crear siniestro');
        }

        console.log('✅ Siniestro creado:', respuesta.mensaje);

        // Extraer ID del siniestro del mensaje (ej: "Siniestro creado con Id 123...")
        const idMatch = respuesta.mensaje.match(/Id (\d+)/);
        idSiniestro = idMatch ? parseInt(idMatch[1]) : null;
        
        console.log('🔍 ID extraído del siniestro:', idSiniestro);
      } else {
        // Editar siniestro existente
        idSiniestro = siniestro?.IdSiniestro || null;
        console.log('✏️ Editando siniestro con ID:', idSiniestro);
      }

      // Si hay foto seleccionada y tenemos el ID del siniestro, subirla
      if (fotoSeleccionada && idSiniestro) {
        console.log('📸 Subiendo foto para siniestro ID:', idSiniestro);
        console.log('📸 ¿Requiere foto?:', requiereFoto());
        try {
          await subirFotoSiniestro(idSiniestro);
          console.log('✅ Foto subida exitosamente');
        } catch (fotoError: any) {
          console.error('❌ Error al subir foto:', fotoError);
          setError(`Siniestro creado pero error al subir foto: ${fotoError.message}`);
          // Aún así llamamos onSave para que se muestre el siniestro creado
        }
      } else {
        if (!fotoSeleccionada) console.log('⚠️ No hay foto seleccionada');
        if (!idSiniestro) console.log('⚠️ No se obtuvo ID del siniestro');
      }

      // Notificar que todo terminó correctamente
      onSave(data);
      
    } catch (err: any) {
      console.error('❌ Error guardando siniestro:', err);
      setError(err.message || 'Error al guardar el siniestro');
    } finally {
      setSaving(false);
    }
  };

  // Función auxiliar para subir foto
  const subirFotoSiniestro = async (idSiniestro: number) => {
    try {
      console.log('📸 Iniciando subida de foto...');
      console.log('📸 ID Siniestro:', idSiniestro);
      console.log('📸 Archivo:', fotoSeleccionada?.name, fotoSeleccionada?.size, 'bytes');
      
      const formDataFoto = new FormData();
      formDataFoto.append('file', fotoSeleccionada!);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';
      console.log('🌐 API URL:', apiUrl);
      
      const authCredentials = localStorage.getItem('auth_credentials');
      let headers: any = {};
      
      if (authCredentials) {
        try {
          const { username, password } = JSON.parse(authCredentials);
          const basicAuth = btoa(`${username}:${password}`);
          headers.Authorization = `Basic ${basicAuth}`;
          console.log('🔐 Autenticación configurada');
        } catch (parseError) {
          console.error('❌ Error parsing auth credentials:', parseError);
        }
      } else {
        console.warn('⚠️ No hay credenciales de autenticación');
      }

      const url = `${apiUrl}/siniestros/${idSiniestro}/foto/subir`;
      console.log('📤 Enviando a:', url);

      const fotoResponse = await fetch(url, {
        method: 'POST',
        body: formDataFoto,
        headers,
      });

      console.log('📥 Respuesta:', fotoResponse.status, fotoResponse.statusText);

      if (!fotoResponse.ok) {
        const errorData = await fotoResponse.json().catch(() => ({ detail: 'Error desconocido' }));
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.detail || 'No se pudo subir la foto');
      }
      
      const responseData = await fotoResponse.json();
      console.log('✅ Foto subida exitosamente:', responseData);
      return responseData;
      
    } catch (fotoError: any) {
      console.error('❌ Error subiendo foto:', fotoError);
      throw fotoError; // Propagar el error para que se capture en handleSave
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {modo === 'crear' ? '➕ Crear Nuevo Siniestro' : '✏️ Editar Siniestro'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal *
            </label>
            <select
              value={formData.idCentro}
              onChange={(e) => updateField('idCentro', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar sucursal...</option>
              {sucursales.map(sucursal => (
                <option key={sucursal.IdCentro} value={sucursal.IdCentro}>
                  {sucursal.IdCentro} - {sucursal.Sucursales}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Siniestro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Siniestro *
            </label>
            <select
              value={formData.idTipoCuenta}
              onChange={(e) => updateField('idTipoCuenta', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Seleccionar tipo...</option>
              {tiposSiniestro.map(tipo => (
                <option key={tipo.idTipoSiniestro} value={tipo.idTipoSiniestro}>
                  {tipo.Cuenta}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => updateField('fecha', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => updateField('fecha', getFechaHoraActual().fecha)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Fecha actual"
              >
                <FiCalendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora *
            </label>
            <div className="flex space-x-2">
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => updateField('hora', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => updateField('hora', getFechaHoraActual().hora)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Hora actual"
              >
                <FiClock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Estados del siniestro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frustrado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="frustrado"
              checked={formData.frustrado}
              onChange={(e) => updateField('frustrado', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="frustrado" className="ml-2 block text-sm text-gray-700">
              Siniestro Frustrado
            </label>
          </div>

          {/* Finalizado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="finalizado"
              checked={formData.finalizado}
              onChange={(e) => updateField('finalizado', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="finalizado" className="ml-2 block text-sm text-gray-700">
              Siniestro Finalizado
            </label>
          </div>
        </div>

        {/* Detalle del siniestro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Descripción de los Hechos del Siniestro
          </label>
          <textarea
            value={formData.detalle}
            onChange={(e) => updateField('detalle', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describa detalladamente los hechos del siniestro: qué ocurrió, cuándo, cómo, personas involucradas, etc..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Este campo es importante para el registro y análisis del siniestro.
          </p>
        </div>

        {/* Carga de Foto - Solo para tipos específicos */}
        {requiereFoto() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Foto del Siniestro {requiereFoto() ? '(Requerida)' : '(Opcional)'}
            </label>
            <p className="text-xs text-blue-600 mb-3">
              Este tipo de siniestro requiere evidencia fotográfica para el boletín.
            </p>
            
            {vistaPrevia ? (
              <div className="mb-3">
                <img 
                  src={vistaPrevia} 
                  alt="Vista previa" 
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFotoSeleccionada(null);
                    setVistaPrevia(null);
                  }}
                  className="mt-2 w-full text-sm text-red-600 hover:text-red-800"
                >
                  ❌ Eliminar foto
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-700 font-medium">
                      Haz clic para seleccionar una foto
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG o GIF (máx. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Pérdidas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Pérdidas</h3>
            <button
              type="button"
              onClick={agregarPerdida}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + Agregar Pérdida
            </button>
          </div>

          <div className="space-y-3">
            {formData.perdidas.map((perdida, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <select
                    value={perdida.idTipoPerdida}
                    onChange={(e) => updatePerdida(index, 'idTipoPerdida', parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={0}>Tipo de pérdida...</option>
                    {tiposPerdida.map(tipo => (
                      <option key={tipo.idTipoPerdida} value={tipo.idTipoPerdida}>
                        {tipo.TipoPerdida}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    value={perdida.monto}
                    onChange={(e) => updatePerdida(index, 'monto', parseFloat(e.target.value) || 0)}
                    placeholder="Monto"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={perdida.recuperado}
                    onChange={(e) => updatePerdida(index, 'recuperado', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recuperado</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={perdida.detalle || ''}
                    onChange={(e) => updatePerdida(index, 'detalle', e.target.value)}
                    placeholder="Detalle..."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => eliminarPerdida(index)}
                    className="w-full px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Implicados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Implicados</h3>
            <button
              type="button"
              onClick={agregarImplicado}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              + Agregar Implicado
            </button>
          </div>

          <div className="space-y-3">
            {formData.implicados.map((implicado, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <select
                    value={implicado.idSexo}
                    onChange={(e) => updateImplicado(index, 'idSexo', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Sexo...</option>
                    {sexos.map(sexo => (
                      <option key={sexo.idSexo} value={sexo.idSexo}>
                        {sexo.Sexo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={implicado.idRangoEdad}
                    onChange={(e) => updateImplicado(index, 'idRangoEdad', parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={0}>Rango de edad...</option>
                    {rangosEdad.map(rango => (
                      <option key={rango.idRangoEdad} value={rango.idRangoEdad}>
                        {rango.RangoEdad}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={implicado.detalle || ''}
                    onChange={(e) => updateImplicado(index, 'detalle', e.target.value)}
                    placeholder="Detalle del implicado..."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => eliminarImplicado(index)}
                    className="w-full px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={setFechaHoraActual}
          className="px-6 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
        >
          📅 Fecha/Hora Actual
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <FiSave className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Guardando...' : 'Guardar Siniestro'}
        </button>
      </div>
    </div>
  );
}
