// ====================================
// TIPOS DE AUTENTICACIÓN
// ====================================

export interface LoginCredentials {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: {
    id: number;
    usuario: string;
    nombre: string;
    rol: string;
  };
}

export interface Usuario {
  IdUsuarios: number;
  NombreUsuario: string;
  Nombre: string;
  IdRol: number;
}

// ====================================
// TIPOS DE SINIESTROS
// ====================================

export interface DetallePerdida {
  idTipoPerdida: number;
  monto: number;
  recuperado: boolean;
  detalle?: string;
}

export interface DetalleImplicado {
  idSexo: string; // Cambiado a string para coincidir con backend
  idRangoEdad: number;
  detalle?: string;
}

export interface CrearSiniestro {
  idCentro: string; // Cambiado a string para coincidir con backend
  fecha: string; // YYYY-MM-DD
  idTipoCuenta: number;
  frustrado: boolean;
  idRealizo: number;
  
  // Múltiples pérdidas (nueva estructura)
  perdidas?: DetallePerdida[];
  
  // Múltiples implicados (nueva estructura)
  implicados?: DetalleImplicado[];
  
  // Campos de compatibilidad (estructura anterior)
  idTipoPerdida?: number;
  monto?: number;
  recuperado?: boolean;
  detalleSiniestro?: string;
  idsexoImplicado?: string; // Cambiado a string para coincidir con backend
  idRangoEdad?: number;
  detalleImplicado?: string;
}

export interface ActualizarSiniestro {
  idCentro?: string; // Cambiado a string para coincidir con backend
  fecha?: string;
  idTipoCuenta?: number;
  frustrado?: boolean;
  idRealizo?: number;
  contemplar?: boolean;
  
  // Nuevas pérdidas e implicados a agregar
  perdidas?: DetallePerdida[];
  implicados?: DetalleImplicado[];
  
  // IDs a eliminar
  eliminar_perdidas?: number[];
  eliminar_implicados?: number[];
  
  // Campos de compatibilidad
  idTipoPerdida?: number;
  monto?: number;
  recuperado?: boolean;
  detalleSiniestro?: string;
  idsexoImplicado?: number;
  idRangoEdad?: number;
  detalleImplicado?: string;
}

export interface DetallePerdidaRespuesta {
  idTipoPerdida: number;
  tipoPerdida: string;
  monto: number;
  recuperado: boolean;
  detalle?: string;
}

export interface DetalleImplicadoRespuesta {
  idImplicado: number;
  sexo: string;
  rangoEdad: string;
  detalle?: string;
}

export interface Siniestro {
  idSiniestro: number;
  fecha: string;
  frustrado: boolean;
  montoEstimado: number;
  realizo: string;
  centro: string;
  tipoSiniestro: string;
  
  // Nuevas estructuras detalladas
  perdidas: DetallePerdidaRespuesta[];
  implicados: DetalleImplicadoRespuesta[];
  
  // Campos de compatibilidad
  implicado?: string;
  tipoPerdida?: string;
  monto?: number;
  recuperado?: boolean;
  detalle?: string;
}

// ====================================
// TIPOS DE RESPUESTAS
// ====================================

export interface RespuestaSimple {
  estatus: boolean;
  mensaje: string;
}

export interface RespuestaConsultaSiniestro {
  estatus: boolean;
  mensaje: string;
  siniestro?: Siniestro;
}

export interface RespuestaListaSiniestro {
  estatus: boolean;
  mensaje: string;
  siniestros: Siniestro[];
}

// ====================================
// TIPOS DE ESTADÍSTICAS
// ====================================

export interface EstadisticasGenerales {
  total_siniestros: number;
  siniestros_frustrados: number;
  siniestros_consumados: number;
  porcentaje_frustrados: number;
  monto_total_perdidas: number;
  monto_total_recuperado: number;
  porcentaje_recuperacion: number;
}

export interface EstadisticasPorTipo {
  tipo_siniestro: string;
  cantidad: number;
  monto_total: number;
  porcentaje_del_total: number;
}

export interface EstadisticasPorSucursal {
  sucursal: string;
  zona: string;
  cantidad_siniestros: number;
  monto_total: number;
  ultimo_siniestro: string;
}

export interface EstadisticasPorMes {
  año: number;
  mes: number;
  mes_nombre: string;
  cantidad_siniestros: number;
  monto_total: number;
  monto_recuperado: number;
}

export interface EstadisticasPorTipoPerdida {
  tipo_perdida: string;
  cantidad: number;
  monto_total: number;
  monto_recuperado: number;
  porcentaje_recuperacion: number;
}

export interface DashboardCompleto {
  estadisticas_generales: EstadisticasGenerales;
  por_tipo_siniestro: EstadisticasPorTipo[];
  por_sucursal: EstadisticasPorSucursal[];
  por_mes: EstadisticasPorMes[];
  por_tipo_perdida: EstadisticasPorTipoPerdida[];
  sucursales_mas_afectadas: EstadisticasPorSucursal[];
  tendencia_mensual: EstadisticasPorMes[];
}

export interface KPIsEjecutivos {
  fecha_reporte: string;
  resumen_ejecutivo: {
    siniestros_mes: number;
    siniestros_semana: number;
    monto_perdido_mes: number;
    porcentaje_recuperacion_mes: number;
    tendencia_vs_mes_anterior: string;
  };
  alertas: {
    sucursal_mas_afectada: {
      nombre: string;
      siniestros: number;
      monto: number;
    };
    tipo_mas_frecuente: {
      tipo: string;
      cantidad: number;
      porcentaje: number;
    };
  };
  comparativas: {
    año_actual: {
      total_siniestros: number;
      monto_total: number;
      recuperacion: number;
    };
    ultimo_mes: {
      total_siniestros: number;
      monto_total: number;
      recuperacion: number;
    };
  };
}

// ====================================
// TIPOS DE CATÁLOGOS
// ====================================

export interface TipoSiniestro {
  idTipoSiniestro: number;
  Cuenta: string;
}

export interface TipoPerdida {
  idTipoPerdida: number;
  TipoPerdida: string;
}

export interface Sucursal {
  IdCentro: string; // Cambiado a string para coincidir con backend
  Sucursales: string;
  idZona: number;
  idEstado?: number;
}

export interface Zona {
  idZona: number;
  zona: string;
}

export interface Sexo {
  idSexo: string; // Cambiado a string para coincidir con backend
  Sexo: string;
}

export interface RangoEdad {
  idRangoEdad: number;
  RangoEdad: string;
}

// ====================================
// TIPOS DE FILTROS
// ====================================

export interface FiltrosEstadisticas {
  fecha_inicio?: string;
  fecha_fin?: string;
  limite?: number;
  año?: number;
}

export interface FiltrosSiniestros {
  tipo?: number;
  sucursal?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  frustrado?: boolean;
  page?: number;
  limit?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ====================================
// TIPOS PARA RESPUESTAS PAGINADAS
// ====================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface SiniestroCompleto {
  id: number;
  fecha_siniestro: string;
  tipo_siniestro: string;
  sucursal?: string;
  usuario_registro?: string;
  frustracion: boolean;
  monto_perdidas?: number;
  monto_recuperado?: number;
  descripcion?: string;
  estado?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}
