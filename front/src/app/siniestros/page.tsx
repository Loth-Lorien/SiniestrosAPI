'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import BoletinGenerator from '../../components/BoletinGenerator';
import { 
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX,
  FiFileText,
  FiUpload
} from 'react-icons/fi';

interface Siniestro {
  IdSiniestro: number;
  IdCentro: string;
  Fecha: string;
  Hora?: string;
  TipoSiniestro: string;
  IdTipoCuenta: number;
  Frustrado: boolean;
  Contemplar: boolean;
  Sucursal: string;
  Usuario: string;
  MontoTotal: number;
  CantidadDetalles: number;
  CantidadImplicados: number;
}

interface TipoSiniestro {
  idTipoSiniestro: number;
  Cuenta: string;
}

interface Sucursal {
  IdCentro: string;
  Sucursales: string;
  idZona: number;
  idEstado: number;
}

interface TipoPerdida {
  idTipoPerdida: number;
  TipoPerdida: string;
}

interface RangoEdad {
  idRangoEdad: number;
  RangoEdad: string;
}

interface Sexo {
  idSexo: string;
  Sexo: string;
}

interface Perdida {
  idDetalle?: number;  // ✅ Opcional para actualizaciones
  idTipoPerdida: number;
  monto: number;
  recuperado: boolean;
  detalle: string;
}

interface Implicado {
  idImplicado?: number;  // ✅ Opcional para actualizaciones
  idSexo: string;
  idRangoEdad: number;
  detalle: string;
}

interface NuevoSiniestro {
  idCentro: string;
  fecha: string;
  hora?: string;
  idTipoCuenta: number;
  frustrado: boolean;
  finalizado?: boolean;
  detalle?: string;
  idRealizo: number;
  perdidas: Perdida[];
  implicados: Implicado[];
  boletin?: {
    boletin?: string;
    rutaFoto?: string;
  };
}

interface EditarSiniestro {
  idCentro?: string;
  fecha?: string;
  hora?: string;
  idTipoCuenta?: number;
  frustrado?: boolean;
  finalizado?: boolean;
  detalle?: string;
  idRealizo?: number;
  perdidas?: Perdida[];
  implicados?: Implicado[];
}

export default function SiniestrosPage() {
  const router = useRouter();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  // Modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingSiniestroId, setEditingSiniestroId] = useState<number | null>(null);
  
  // Modal de detalle/visualización
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [siniestroDetalle, setSiniestroDetalle] = useState<any>(null);
  
  // Modal de generación de boletín
  const [showBoletinModal, setShowBoletinModal] = useState(false);
  const [boletinSiniestroId, setBoletinSiniestroId] = useState<number | null>(null);
  
  // Modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSiniestroId, setDeletingSiniestroId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Opciones para el formulario
  const [tiposSiniestro, setTiposSiniestro] = useState<TipoSiniestro[]>([]);
  const [tiposPerdida, setTiposPerdida] = useState<TipoPerdida[]>([]);
  const [rangosEdad, setRangosEdad] = useState<RangoEdad[]>([]);
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Estados para manejo de archivos de boletín
  const [selectedFoto, setSelectedFoto] = useState<File | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Formulario de nuevo siniestro
  const [nuevoSiniestro, setNuevoSiniestro] = useState<NuevoSiniestro>({
    idCentro: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    idTipoCuenta: 0,
    frustrado: false,
    finalizado: false,
    detalle: '',
    idRealizo: 1,
    perdidas: [{
      idTipoPerdida: 0,
      monto: 0,
      recuperado: false,
      detalle: ''
    }],
    implicados: [{
      idSexo: '',
      idRangoEdad: 0,
      detalle: ''
    }],
    boletin: {
      boletin: '',
      rutaFoto: ''
    }
  });

  // Formulario de editar siniestro
  const [editarSiniestro, setEditarSiniestro] = useState<EditarSiniestro>({});

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  // Cargar opciones del formulario cuando el componente se monta
  useEffect(() => {
    if (!loading) {
      loadFormOptions();
    }
  }, [loading]);

  const checkAuth = () => {
    const authData = localStorage.getItem('auth_credentials');
    if (!authData) {
      router.push('/login');
      return false;
    }
    return true;
  };

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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log('📊 Cargando datos de siniestros...');

      // Cargar siniestros con timeout
      const siniestrosResponse = await fetch('http://localhost:8000/siniestros', {
        headers,
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (!siniestrosResponse.ok) {
        if (siniestrosResponse.status === 401) {
          localStorage.removeItem('auth_credentials');
          localStorage.removeItem('user_data');
          router.push('/login');
          return;
        }
        throw new Error(`Error cargando siniestros: ${siniestrosResponse.status}`);
      }

      const siniestrosData = await siniestrosResponse.json();
      // Ahora el backend ya envía fecha y hora por separado
      setSiniestros(siniestrosData.data || []);

      // Cargar tipos de siniestro


      console.log('✅ Datos cargados exitosamente');

    } catch (err: any) {
      console.error('❌ Error cargando datos de siniestros:', err);
      
      // Si es un error de red (backend apagado), redirigir al login
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error('🔴 Backend no disponible - redirigiendo al login');
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        setError('Servidor no disponible. Redirigiendo al login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      // Si es timeout
      if (err.name === 'TimeoutError') {
        console.error('⏰ Timeout del servidor - redirigiendo al login');
        localStorage.removeItem('auth_credentials');
        localStorage.removeItem('user_data');
        setError('Servidor no responde. Redirigiendo al login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Cargar opciones para el formulario
  const loadFormOptions = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      console.log('📥 Cargando opciones del formulario...');

      // Cargar todos los datos en paralelo
      const [tiposSiniestroRes, tiposPerdidaRes, sexosRes, rangosEdadRes, sucursalesRes] = await Promise.all([
        fetch('http://localhost:8000/tiposiniestro', { 
          headers,
          signal: AbortSignal.timeout(5000) 
        }),
        fetch('http://localhost:8000/tiposperdida', { 
          headers,
          signal: AbortSignal.timeout(5000) 
        }),
        fetch('http://localhost:8000/sexos', { 
          headers,
          signal: AbortSignal.timeout(5000) 
        }),
        fetch('http://localhost:8000/rangosedad', { 
          headers,
          signal: AbortSignal.timeout(5000) 
        }),
        fetch('http://localhost:8000/sucursales', { 
          headers,
          signal: AbortSignal.timeout(5000) 
        })
      ]);

      // Verificar que todas las respuestas sean exitosas
      if (!tiposSiniestroRes.ok || !tiposPerdidaRes.ok || !sexosRes.ok || !rangosEdadRes.ok || !sucursalesRes.ok) {
        throw new Error('Error cargando una o más opciones del formulario');
      }

      // Parsear respuestas
      const tiposSiniestroData = await tiposSiniestroRes.json();
      const tiposPerdidaData = await tiposPerdidaRes.json();
      const sexosData = await sexosRes.json();
      const rangosEdadData = await rangosEdadRes.json();
      const sucursalesData = await sucursalesRes.json();

      // Actualizar estados
      setTiposSiniestro(tiposSiniestroData);
      setTiposPerdida(tiposPerdidaData);
      setSexos(sexosData);
      setRangosEdad(rangosEdadData);
      setSucursales(sucursalesData);

      console.log('✅ Opciones del formulario cargadas exitosamente');
      console.log('Tipos de siniestro:', tiposSiniestroData.length);
      console.log('Tipos de pérdida:', tiposPerdidaData.length);
      console.log('Sexos:', sexosData.length);
      console.log('Rangos de edad:', rangosEdadData.length);
      console.log('Sucursales:', sucursalesData.length);

    } catch (error) {
      console.error('❌ Error cargando opciones del formulario:', error);
      setError('Error cargando opciones del formulario');
    }
  };

  // Crear nuevo siniestro
  const handleCreateSiniestro = async () => {
    setCreating(true);
    
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log('📝 Creando nuevo siniestro...');
      console.log('Datos del siniestro:', nuevoSiniestro);

      const response = await fetch('http://localhost:8000/siniestros', {
        method: 'POST',
        headers,
        body: JSON.stringify(nuevoSiniestro),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error creando siniestro: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Siniestro creado exitosamente:', result);

      // Crear boletín si se proporcionó información
      if (nuevoSiniestro.boletin?.boletin && nuevoSiniestro.boletin.boletin.trim() !== '') {
        try {
          console.log('📄 Creando boletín para el siniestro...');
          
          // Crear boletín
          const boletinResponse = await fetch('http://localhost:8000/boletines', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              idSiniestro: result.idSiniestro,
              boletin: nuevoSiniestro.boletin.boletin
            }),
          });

          if (boletinResponse.ok) {
            console.log('✅ Boletín creado exitosamente');
            
            // Subir foto si se seleccionó una
            if (selectedFoto) {
              const formData = new FormData();
              formData.append('foto', selectedFoto);

              const authHeaders = getAuthHeaders();
              const fotoResponse = await fetch(`http://localhost:8000/boletines/${result.idSiniestro}/foto`, {
                method: 'POST',
                headers: authHeaders || undefined,
                body: formData,
              });

              if (fotoResponse.ok) {
                console.log('✅ Foto del boletín subida exitosamente');
              } else {
                console.warn('⚠️ Error subiendo foto del boletín');
              }
            }
          } else {
            console.warn('⚠️ Error creando boletín');
          }
        } catch (boletinError) {
          console.warn('⚠️ Error en proceso de boletín:', boletinError);
        }
      }

      // Resetear formulario
      setNuevoSiniestro({
        idCentro: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        idTipoCuenta: 0,
        frustrado: false,
        finalizado: false,
        detalle: '',
        idRealizo: 1,
        perdidas: [{
          idTipoPerdida: 0,
          monto: 0,
          recuperado: false,
          detalle: ''
        }],
        implicados: [{
          idSexo: '',
          idRangoEdad: 0,
          detalle: ''
        }],
        boletin: {
          boletin: '',
          rutaFoto: ''
        }
      });

      // Resetear foto seleccionada
      setSelectedFoto(null);
      if (fotoInputRef.current) {
        fotoInputRef.current.value = '';
      }

      setShowCreateModal(false);
      await loadData(); // Recargar la lista

    } catch (error: any) {
      console.error('❌ Error creando siniestro:', error);
      setError(error.message || 'Error creando siniestro');
    } finally {
      setCreating(false);
    }
  };

  // Agregar nueva pérdida
  const addPerdida = () => {
    setNuevoSiniestro(prev => ({
      ...prev,
      perdidas: [...prev.perdidas, {
        idTipoPerdida: 0,
        monto: 0,
        recuperado: false,
        detalle: ''
      }]
    }));
  };

  // Remover pérdida
  const removePerdida = (index: number) => {
    if (nuevoSiniestro.perdidas.length > 1) {
      setNuevoSiniestro(prev => ({
        ...prev,
        perdidas: prev.perdidas.filter((_, i) => i !== index)
      }));
    }
  };

  // Agregar nuevo implicado
  const addImplicado = () => {
    setNuevoSiniestro(prev => ({
      ...prev,
      implicados: [...prev.implicados, {
        idSexo: '',
        idRangoEdad: 0,
        detalle: ''
      }]
    }));
  };

  // Remover implicado
  const removeImplicado = (index: number) => {
    if (nuevoSiniestro.implicados.length > 1) {
      setNuevoSiniestro(prev => ({
        ...prev,
        implicados: prev.implicados.filter((_, i) => i !== index)
      }));
    }
  };

  // Cargar siniestro para editar
  const handleEditClick = async (siniestroId: number) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      console.log(`📝 Cargando siniestro ${siniestroId} para editar...`);

      const response = await fetch(`http://localhost:8000/siniestros/${siniestroId}`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Error cargando siniestro: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Respuesta completa del backend:', data);
      
      // El backend devuelve los datos en data.siniestro
      const siniestro = data.siniestro;
      console.log('📄 Datos del siniestro:', siniestro);

      if (!siniestro) {
        throw new Error('No se encontraron datos del siniestro');
      }

      // Preparar datos para edición
      setEditarSiniestro({
        idCentro: siniestro.idCentro || '',
        fecha: siniestro.fecha || '',
        idTipoCuenta: siniestro.idTipoCuenta || 0,
        frustrado: siniestro.frustrado || false,
        perdidas: siniestro.perdidas?.map((p: any) => ({
          idDetalle: p.idDetalle, // ✅ Incluir ID para actualización
          idTipoPerdida: p.idTipoPerdida || 0,
          monto: p.monto || 0,
          recuperado: p.recuperado || false,
          detalle: p.detalle || ''
        })) || [{
          // Nueva pérdida sin ID (se creará)
          idTipoPerdida: 0,
          monto: 0,
          recuperado: false,
          detalle: ''
        }],
        implicados: siniestro.implicados?.map((i: any) => ({
          idImplicado: i.idImplicado, // ✅ Incluir ID para actualización
          idSexo: i.idSexo || '',
          idRangoEdad: i.idRangoEdad || 0,
          detalle: i.detalle || ''
        })) || [{
          // Nuevo implicado sin ID (se creará)
          idSexo: '',
          idRangoEdad: 0,
          detalle: ''
        }]
      });

      setEditingSiniestroId(siniestroId);
      setShowEditModal(true);

    } catch (error: any) {
      console.error('❌ Error cargando siniestro para editar:', error);
      setError(error.message || 'Error cargando siniestro');
    }
  };

  // Ver detalle completo de siniestro
  const handleViewDetail = async (siniestroId: number) => {
    try {
      setLoadingDetail(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      console.log(`👁️ Cargando detalle completo del siniestro ${siniestroId}...`);

      const response = await fetch(`http://localhost:8000/siniestros/${siniestroId}`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Error cargando detalle: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Detalle completo cargado:', data);

      setSiniestroDetalle(data.siniestro);
      setShowDetailModal(true);

    } catch (error: any) {
      console.error('❌ Error cargando detalle del siniestro:', error);
      setError(error.message || 'Error cargando detalle del siniestro');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Confirmar eliminación de siniestro
  const handleDeleteClick = (siniestroId: number) => {
    setDeletingSiniestroId(siniestroId);
    setShowDeleteModal(true);
  };

  // Eliminar siniestro
  const handleDeleteSiniestro = async () => {
    if (!deletingSiniestroId) return;
    
    setDeleting(true);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log(`🗑️ Eliminando siniestro ${deletingSiniestroId}...`);

      const response = await fetch(`http://localhost:8000/siniestros/${deletingSiniestroId}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        // Manejar errores específicos
        if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar siniestros. Solo los administradores y coordinadores pueden hacerlo.');
        } else if (response.status === 404) {
          throw new Error('El siniestro no fue encontrado.');
        } else {
          throw new Error(`Error eliminando siniestro: ${response.status} - ${errorData}`);
        }
      }

      const result = await response.json();
      console.log('✅ Siniestro eliminado exitosamente:', result);

      // Cerrar modal y recargar datos
      setShowDeleteModal(false);
      setDeletingSiniestroId(null);
      await loadData();
      
      // Mostrar mensaje de éxito
      alert('Siniestro eliminado exitosamente');

    } catch (error: any) {
      console.error('❌ Error eliminando siniestro:', error);
      setError(error.message || 'Error eliminando siniestro');
      
      // Mostrar alerta específica para errores de permisos
      if (error.message.includes('permisos')) {
        alert(error.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Actualizar siniestro
  const handleUpdateSiniestro = async () => {
    if (!editingSiniestroId) return;
    
    setEditing(true);
    
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      if (!headers) {
        throw new Error('No hay credenciales válidas');
      }

      console.log('📝 Actualizando siniestro...', editingSiniestroId);
      console.log('Datos de actualización:', editarSiniestro);

      const response = await fetch(`http://localhost:8000/siniestros/${editingSiniestroId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editarSiniestro),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error actualizando siniestro: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Siniestro actualizado exitosamente:', result);

      // Resetear formulario
      setEditarSiniestro({});
      setEditingSiniestroId(null);
      setShowEditModal(false);
      await loadData(); // Recargar la lista

    } catch (error: any) {
      console.error('❌ Error actualizando siniestro:', error);
      setError(error.message || 'Error actualizando siniestro');
    } finally {
      setEditing(false);
    }
  };

  // Funciones para manejar pérdidas en edición
  const addPerdidaEdit = () => {
    setEditarSiniestro(prev => ({
      ...prev,
      perdidas: [...(prev.perdidas || []), {
        idTipoPerdida: 0,
        monto: 0,
        recuperado: false,
        detalle: ''
      }]
    }));
  };

  const removePerdidaEdit = (index: number) => {
    if ((editarSiniestro.perdidas?.length || 0) > 1) {
      setEditarSiniestro(prev => ({
        ...prev,
        perdidas: prev.perdidas?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Funciones para manejo de boletín
  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFoto(file);
    }
  };

  const handleGenerarBoletin = async (siniestroId: number) => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`http://localhost:8000/boletines/${siniestroId}/pdf`, {
        method: 'GET',
        headers: authHeaders || undefined,
      });

      if (!response.ok) {
        throw new Error('Error generando boletín PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boletin-siniestro-${siniestroId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando boletín:', error);
      alert('Error al generar el boletín PDF');
    }
  };

  // Funciones para manejar implicados en edición
  const addImplicadoEdit = () => {
    setEditarSiniestro(prev => ({
      ...prev,
      implicados: [...(prev.implicados || []), {
        idSexo: '',
        idRangoEdad: 0,
        detalle: ''
      }]
    }));
  };

  const removeImplicadoEdit = (index: number) => {
    if ((editarSiniestro.implicados?.length || 0) > 1) {
      setEditarSiniestro(prev => ({
        ...prev,
        implicados: prev.implicados?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Filtrar siniestros
  const filteredSiniestros = siniestros.filter(siniestro => {
    const matchesSearch = siniestro.TipoSiniestro.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         siniestro.IdSiniestro.toString().includes(searchTerm) ||
                         siniestro.Sucursal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipo || siniestro.TipoSiniestro === selectedTipo;
    const matchesSucursal = !selectedSucursal || siniestro.Sucursal === selectedSucursal;
    const matchesEstado = !selectedEstado || (siniestro.Frustrado ? 'frustrado' : 'completado') === selectedEstado;

    return matchesSearch && matchesTipo && matchesSucursal && matchesEstado;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resuelto':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando siniestros...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Siniestros</h1>
            <p className="text-gray-600 mt-2">
              {filteredSiniestros.length} de {siniestros.length} siniestros registrados
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Nuevo Siniestro
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros de búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID o descripción..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Siniestro
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="" className="text-gray-600">Todos los tipos</option>
                {[...new Set(siniestros.map(s => s.TipoSiniestro))].sort().map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal
              </label>
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="" className="text-gray-600">Todas las sucursales</option>
                {[...new Set(siniestros.map(s => s.Sucursal))].sort().map((sucursal) => (
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="" className="text-gray-600">Todos los estados</option>
                <option value="frustrado">Frustrado</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Siniestros */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Siniestros ({filteredSiniestros.length})
            </h3>
          </div>
          
          {filteredSiniestros.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSiniestros.map((siniestro) => (
                    <tr key={siniestro.IdSiniestro} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {siniestro.IdSiniestro}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          <div className="font-medium">{siniestro.TipoSiniestro}</div>
                          <div className="text-xs text-gray-500">Centro: {siniestro.IdCentro}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatDate(siniestro.Fecha)}</div>
                          {siniestro.Hora && (
                            <div className="text-xs text-gray-400 mt-1">{siniestro.Hora}</div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          siniestro.Frustrado ? 'bg-red-100 text-red-800 border-red-200' : 
                          siniestro.Contemplar ? 'bg-green-100 text-green-800 border-green-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {siniestro.Frustrado ? 'Frustrado' : siniestro.Contemplar ? 'Contemplado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{siniestro.Sucursal}</div>
                          <div className="text-xs text-gray-400">Usuario: {siniestro.Usuario}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <div>
                          <div className="font-medium text-red-600">${siniestro.MontoTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{siniestro.CantidadDetalles} detalles</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewDetail(siniestro.IdSiniestro)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalle completo"
                            disabled={loadingDetail}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleGenerarBoletin(siniestro.IdSiniestro)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Generar boletín PDF"
                          >
                            <FiFileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(siniestro.IdSiniestro)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar siniestro"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(siniestro.IdSiniestro)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar siniestro (Solo administradores y coordinadores)"
                            disabled={deleting}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron siniestros
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {siniestros.length === 0 
                  ? 'No hay siniestros registrados' 
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        {filteredSiniestros.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredSiniestros.length}
              </div>
              <div className="text-sm text-gray-600">Total mostrados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredSiniestros.filter((s) => s.Frustrado).length}
              </div>
              <div className="text-sm text-gray-600">Frustrados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredSiniestros.filter((s) => s.Contemplar).length}
              </div>
              <div className="text-sm text-gray-600">Contemplados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">
                ${filteredSiniestros.reduce((total, s) => total + s.MontoTotal, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Pérdidas</div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación de siniestro */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Siniestro</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateSiniestro(); }}>
                {/* Información básica */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sucursal *
                      </label>
                      <select
                        required
                        value={nuevoSiniestro.idCentro}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, idCentro: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-600">Seleccione una sucursal</option>
                        {sucursales.map(sucursal => (
                          <option key={sucursal.IdCentro} value={sucursal.IdCentro} className="text-gray-900">
                            {sucursal.IdCentro} - {sucursal.Sucursales}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        required
                        value={nuevoSiniestro.fecha}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, fecha: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={nuevoSiniestro.hora || ''}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, hora: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Siniestro *
                      </label>
                      <select
                        required
                        value={nuevoSiniestro.idTipoCuenta}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, idTipoCuenta: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value={0} className="text-gray-600">Seleccione tipo de siniestro</option>
                        {tiposSiniestro.map(tipo => (
                          <option key={tipo.idTipoSiniestro} value={tipo.idTipoSiniestro} className="text-gray-900">
                            {tipo.Cuenta}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={nuevoSiniestro.frustrado}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, frustrado: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Siniestro frustrado</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={nuevoSiniestro.finalizado || false}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, finalizado: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Siniestro finalizado</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detalle adicional
                      </label>
                      <textarea
                        value={nuevoSiniestro.detalle || ''}
                        onChange={(e) => setNuevoSiniestro(prev => ({ ...prev, detalle: e.target.value }))}
                        rows={3}
                        placeholder="Ingrese detalles adicionales del siniestro..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Información del Boletín */}
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Información del Boletín (Opcional)</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción del Boletín
                        </label>
                        <textarea
                          value={nuevoSiniestro.boletin?.boletin || ''}
                          onChange={(e) => setNuevoSiniestro(prev => ({ 
                            ...prev, 
                            boletin: { 
                              ...prev.boletin, 
                              boletin: e.target.value 
                            } 
                          }))}
                          rows={4}
                          placeholder="Descripción detallada del siniestro para el boletín..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Foto del Siniestro
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFotoChange}
                            className="hidden"
                            ref={fotoInputRef}
                          />
                          <button
                            type="button"
                            onClick={() => fotoInputRef.current?.click()}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-gray-700"
                          >
                            <FiUpload className="w-4 h-4 mr-2" />
                            {selectedFoto ? 'Cambiar foto' : 'Seleccionar foto'}
                          </button>
                          {selectedFoto && (
                            <span className="text-sm text-gray-600">{selectedFoto.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Pérdidas */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Pérdidas</h3>
                    <button
                      type="button"
                      onClick={addPerdida}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      + Agregar Pérdida
                    </button>
                  </div>

                  {nuevoSiniestro.perdidas.map((perdida, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">Pérdida {index + 1}</h4>
                        {nuevoSiniestro.perdidas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePerdida(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Pérdida *
                          </label>
                          <select
                            required
                            value={perdida.idTipoPerdida}
                            onChange={(e) => {
                              const nuevasPerdidas = [...nuevoSiniestro.perdidas];
                              nuevasPerdidas[index].idTipoPerdida = parseInt(e.target.value);
                              setNuevoSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value={0} className="text-gray-600">Seleccione tipo</option>
                            {tiposPerdida.map(tipo => (
                              <option key={tipo.idTipoPerdida} value={tipo.idTipoPerdida} className="text-gray-900">
                                {tipo.TipoPerdida}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={perdida.monto}
                            onChange={(e) => {
                              const nuevasPerdidas = [...nuevoSiniestro.perdidas];
                              nuevasPerdidas[index].monto = parseFloat(e.target.value) || 0;
                              setNuevoSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center mt-6">
                            <input
                              type="checkbox"
                              checked={perdida.recuperado}
                              onChange={(e) => {
                                const nuevasPerdidas = [...nuevoSiniestro.perdidas];
                                nuevasPerdidas[index].recuperado = e.target.checked;
                                setNuevoSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Recuperado</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Detalle
                        </label>
                        <input
                          type="text"
                          value={perdida.detalle}
                          onChange={(e) => {
                            const nuevasPerdidas = [...nuevoSiniestro.perdidas];
                            nuevasPerdidas[index].detalle = e.target.value;
                            setNuevoSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Detalle de la pérdida"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Implicados */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Implicados</h3>
                    <button
                      type="button"
                      onClick={addImplicado}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      + Agregar Implicado
                    </button>
                  </div>

                  {nuevoSiniestro.implicados.map((implicado, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">Implicado {index + 1}</h4>
                        {nuevoSiniestro.implicados.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImplicado(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sexo *
                          </label>
                          <select
                            required
                            value={implicado.idSexo}
                            onChange={(e) => {
                              const nuevosImplicados = [...nuevoSiniestro.implicados];
                              nuevosImplicados[index].idSexo = e.target.value;
                              setNuevoSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value="" className="text-gray-600">Seleccione sexo</option>
                            {sexos.map(sexo => (
                              <option key={sexo.idSexo} value={sexo.idSexo} className="text-gray-900">
                                {sexo.Sexo}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rango de Edad *
                          </label>
                          <select
                            required
                            value={implicado.idRangoEdad}
                            onChange={(e) => {
                              const nuevosImplicados = [...nuevoSiniestro.implicados];
                              nuevosImplicados[index].idRangoEdad = parseInt(e.target.value);
                              setNuevoSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value={0} className="text-gray-600">Seleccione rango</option>
                            {rangosEdad.map(rango => (
                              <option key={rango.idRangoEdad} value={rango.idRangoEdad} className="text-gray-900">
                                {rango.RangoEdad}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Detalle
                        </label>
                        <input
                          type="text"
                          value={implicado.detalle}
                          onChange={(e) => {
                            const nuevosImplicados = [...nuevoSiniestro.implicados];
                            nuevosImplicados[index].detalle = e.target.value;
                            setNuevoSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Información adicional del implicado"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Siniestro'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de siniestro */}
      {showEditModal && editarSiniestro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Editar Siniestro #{editingSiniestroId}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditarSiniestro({});
                    setEditingSiniestroId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateSiniestro(); }}>
                {/* Información básica */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sucursal
                      </label>
                      <select
                        value={editarSiniestro.idCentro || ''}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, idCentro: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-600">Seleccione una sucursal</option>
                        {sucursales.map(sucursal => (
                          <option key={sucursal.IdCentro} value={sucursal.IdCentro} className="text-gray-900">
                            {sucursal.IdCentro} - {sucursal.Sucursales}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={editarSiniestro.fecha || ''}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, fecha: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={editarSiniestro.hora || ''}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, hora: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Siniestro
                      </label>
                      <select
                        value={editarSiniestro.idTipoCuenta || 0}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, idTipoCuenta: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value={0} className="text-gray-600">Seleccione tipo de siniestro</option>
                        {tiposSiniestro.map(tipo => (
                          <option key={tipo.idTipoSiniestro} value={tipo.idTipoSiniestro} className="text-gray-900">
                            {tipo.Cuenta}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editarSiniestro.frustrado || false}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, frustrado: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Siniestro frustrado</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editarSiniestro.finalizado || false}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, finalizado: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Siniestro finalizado</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detalle adicional
                      </label>
                      <textarea
                        value={editarSiniestro.detalle || ''}
                        onChange={(e) => setEditarSiniestro(prev => ({ ...prev, detalle: e.target.value }))}
                        rows={3}
                        placeholder="Ingrese detalles adicionales del siniestro..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Pérdidas */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Pérdidas</h3>
                    <button
                      type="button"
                      onClick={addPerdidaEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      + Agregar Pérdida
                    </button>
                  </div>

                  {editarSiniestro.perdidas?.map((perdida, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">Pérdida {index + 1}</h4>
                        {(editarSiniestro.perdidas?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removePerdidaEdit(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Pérdida
                          </label>
                          <select
                            value={perdida.idTipoPerdida || 0}
                            onChange={(e) => {
                              const nuevasPerdidas = [...(editarSiniestro.perdidas || [])];
                              nuevasPerdidas[index].idTipoPerdida = parseInt(e.target.value);
                              setEditarSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value={0} className="text-gray-600">Seleccione tipo</option>
                            {tiposPerdida.map(tipo => (
                              <option key={tipo.idTipoPerdida} value={tipo.idTipoPerdida} className="text-gray-900">
                                {tipo.TipoPerdida}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={perdida.monto || 0}
                            onChange={(e) => {
                              const nuevasPerdidas = [...(editarSiniestro.perdidas || [])];
                              nuevasPerdidas[index].monto = parseFloat(e.target.value) || 0;
                              setEditarSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center mt-6">
                            <input
                              type="checkbox"
                              checked={perdida.recuperado || false}
                              onChange={(e) => {
                                const nuevasPerdidas = [...(editarSiniestro.perdidas || [])];
                                nuevasPerdidas[index].recuperado = e.target.checked;
                                setEditarSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Recuperado</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Detalle
                        </label>
                        <input
                          type="text"
                          value={perdida.detalle || ''}
                          onChange={(e) => {
                            const nuevasPerdidas = [...(editarSiniestro.perdidas || [])];
                            nuevasPerdidas[index].detalle = e.target.value;
                            setEditarSiniestro(prev => ({ ...prev, perdidas: nuevasPerdidas }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Detalle de la pérdida"
                        />
                      </div>
                    </div>
                  )) || []}
                </div>

                {/* Implicados */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Implicados</h3>
                    <button
                      type="button"
                      onClick={addImplicadoEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      + Agregar Implicado
                    </button>
                  </div>

                  {editarSiniestro.implicados?.map((implicado, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">Implicado {index + 1}</h4>
                        {(editarSiniestro.implicados?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImplicadoEdit(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sexo
                          </label>
                          <select
                            value={implicado.idSexo || ''}
                            onChange={(e) => {
                              const nuevosImplicados = [...(editarSiniestro.implicados || [])];
                              nuevosImplicados[index].idSexo = e.target.value;
                              setEditarSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value="" className="text-gray-600">Seleccione sexo</option>
                            {sexos.map(sexo => (
                              <option key={sexo.idSexo} value={sexo.idSexo} className="text-gray-900">
                                {sexo.Sexo}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rango de Edad
                          </label>
                          <select
                            value={implicado.idRangoEdad || 0}
                            onChange={(e) => {
                              const nuevosImplicados = [...(editarSiniestro.implicados || [])];
                              nuevosImplicados[index].idRangoEdad = parseInt(e.target.value);
                              setEditarSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            <option value={0} className="text-gray-600">Seleccione rango</option>
                            {rangosEdad.map(rango => (
                              <option key={rango.idRangoEdad} value={rango.idRangoEdad} className="text-gray-900">
                                {rango.RangoEdad}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Detalle
                        </label>
                        <input
                          type="text"
                          value={implicado.detalle || ''}
                          onChange={(e) => {
                            const nuevosImplicados = [...(editarSiniestro.implicados || [])];
                            nuevosImplicados[index].detalle = e.target.value;
                            setEditarSiniestro(prev => ({ ...prev, implicados: nuevosImplicados }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Información adicional del implicado"
                        />
                      </div>
                    </div>
                  )) || []}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditarSiniestro({});
                      setEditingSiniestroId(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {editing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Siniestro'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle del siniestro */}
      {showDetailModal && siniestroDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Detalle del Siniestro #{siniestroDetalle.idSiniestro}</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSiniestroDetalle(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Información básica del siniestro */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Panel izquierdo - Información general */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Información General
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Fecha:</span>
                        <span className="text-gray-900">
                          {new Date(siniestroDetalle.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Hora:</span>
                        <span className="text-gray-900">
                          {siniestroDetalle.hora || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Sucursal:</span>
                        <span className="text-gray-900">{siniestroDetalle.centro}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Tipo de Siniestro:</span>
                        <span className="text-gray-900">{siniestroDetalle.tipoSiniestro}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Realizado por:</span>
                        <span className="text-gray-900">{siniestroDetalle.realizo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Estado:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          siniestroDetalle.frustrado 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {siniestroDetalle.frustrado ? 'Frustrado' : 'Consumado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Monto Total Estimado:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${siniestroDetalle.montoEstimado?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel derecho - Resumen rápido */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Resumen Ejecutivo
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{siniestroDetalle.perdidas?.length || 0}</div>
                        <div className="text-sm text-gray-600">Pérdidas Registradas</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{siniestroDetalle.implicados?.length || 0}</div>
                        <div className="text-sm text-gray-600">Implicados</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pérdidas detalladas */}
              {siniestroDetalle.perdidas && siniestroDetalle.perdidas.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Pérdidas Registradas
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {siniestroDetalle.perdidas.map((perdida: any, index: number) => (
                      <div key={index} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-gray-800">{perdida.tipoPerdida}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            perdida.recuperado 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {perdida.recuperado ? 'Recuperado' : 'No Recuperado'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monto:</span>
                            <span className="font-bold text-red-600">
                              ${perdida.monto?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
                            </span>
                          </div>
                          {perdida.detalle && (
                            <div>
                              <span className="text-gray-600">Detalle:</span>
                              <p className="text-gray-800 text-sm mt-1">{perdida.detalle}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Implicados detallados */}
              {siniestroDetalle.implicados && siniestroDetalle.implicados.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    Implicados
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {siniestroDetalle.implicados.map((implicado: any, index: number) => (
                      <div key={index} className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Implicado #{index + 1}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sexo:</span>
                            <span className="text-gray-900">{implicado.sexo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Edad:</span>
                            <span className="text-gray-900">{implicado.rangoEdad}</span>
                          </div>
                          {implicado.detalle && (
                            <div>
                              <span className="text-gray-600">Detalle:</span>
                              <p className="text-gray-800 text-sm mt-1">{implicado.detalle}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de cierre */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setBoletinSiniestroId(siniestroDetalle.idSiniestro);
                    setShowBoletinModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiFileText className="w-5 h-5" />
                  Generar Boletín
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSiniestroDetalle(null);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingSiniestroId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-600 flex items-center">
                  <FiTrash2 className="w-6 h-6 mr-2" />
                  Confirmar Eliminación
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingSiniestroId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={deleting}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FiTrash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ¿Eliminar Siniestro #{deletingSiniestroId}?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <strong>Advertencia:</strong> Se eliminarán permanentemente:
                      </p>
                      <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                        <li>El siniestro completo</li>
                        <li>Todas las pérdidas asociadas</li>
                        <li>Todos los implicados registrados</li>
                      </ul>
                    </div>
                  </div>
                </div>


              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingSiniestroId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSiniestro}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      Eliminar Siniestro
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de generación de boletín */}
      {showBoletinModal && boletinSiniestroId && (
        <BoletinGenerator
          idSiniestro={boletinSiniestroId}
          onClose={() => {
            setShowBoletinModal(false);
            setBoletinSiniestroId(null);
          }}
          onSuccess={() => {
            setShowBoletinModal(false);
            setBoletinSiniestroId(null);
            // Recargar lista de siniestros
            loadData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
