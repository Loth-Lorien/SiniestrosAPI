// Tipos para la API de Siniestros

// Tipos básicos
export interface TipoSiniestro {
  idTipoSiniestro: number;
  Cuenta: string;
}

export interface TipoPerdida {
  idTipoPerdida: number;
  TipoPerdida: string;
}

export interface Sexo {
  idSexo: string;
  Sexo: string;
}

export interface RangoEdad {
  idRangoEdad: number;
  RangoEdad: string;
}

export interface Sucursal {
  IdCentro: string;
  Sucursales: string;
  idZona: number;
  idEstado: number;
}

export interface Zona {
  idZona: number;
  zona: string;
}

// Detalles de siniestros
export interface DetallePerdida {
  idTipoPerdida: number;
  monto: number;
  recuperado: boolean;
  detalle?: string;
}

export interface DetalleImplicado {
  idSexo: string;
  idRangoEdad: number;
  detalle?: string;
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

// Siniestros
export interface CrearSiniestro {
  idCentro: string;
  fecha: string; // En formato YYYY-MM-DD
  idTipoCuenta: number;
  frustrado: boolean;
  idRealizo: number;
  perdidas: DetallePerdida[];
  implicados: DetalleImplicado[];
}

export interface ActualizarSiniestro {
  idCentro?: string;
  fecha?: string;
  idTipoCuenta?: number;
  frustrado?: boolean;
  idRealizo?: number;
  contemplar?: boolean;
  perdidas?: DetallePerdida[];
  implicados?: DetalleImplicado[];
  eliminar_perdidas?: number[];
  eliminar_implicados?: number[];
}

export interface SiniestroItem {
  idSiniestro: number;
  fecha: string;
  frustrado: boolean;
  montoEstimado: number;
  realizo: string;
  centro: string;
  tipoSiniestro: string;
  perdidas: DetallePerdidaRespuesta[];
  implicados: DetalleImplicadoRespuesta[];
  // Campos de compatibilidad
  implicado?: string;
  tipoPerdida?: string;
  monto?: number;
  recuperado?: boolean;
  detalle?: string;
}

// Respuestas de API
export interface RespuestaSimple {
  estatus: boolean;
  mensaje: string;
}

export interface RespuestaConsultaSiniestro extends RespuestaSimple {
  siniestro?: SiniestroItem;
}

export interface RespuestaListaSiniestro extends RespuestaSimple {
  siniestros: SiniestroItem[];
}

// Estadísticas
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
  ultimo_siniestro?: string;
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

// Usuario y autenticación
export interface Usuario {
  IdUsuarios: number;
  NombreUsuario: string;
  NivelUsuarioId: number;
  Estatus: number;
}

// Filtros para consultas
export interface FiltrosSiniestros {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_siniestro?: number;
  sucursal?: string;
  frustrado?: boolean;
}

export interface FiltrosEstadisticas {
  fecha_inicio?: string;
  fecha_fin?: string;
  año?: number;
  limite?: number;
}
