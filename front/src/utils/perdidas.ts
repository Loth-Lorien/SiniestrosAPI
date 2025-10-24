/**
 * Utilidades para cálculo correcto de pérdidas en siniestros
 * Solo se suman las pérdidas NO recuperadas
 */

interface Perdida {
  monto: number;
  recuperado: boolean;
}

/**
 * Calcula el monto total de pérdidas excluyendo las recuperadas
 * @param perdidas Array de pérdidas del siniestro
 * @returns Monto total de pérdidas no recuperadas
 */
export function calcularMontoPerdidasReales(perdidas: Perdida[]): number {
  if (!Array.isArray(perdidas)) return 0;
  
  return perdidas
    .filter(p => !p.recuperado) // Solo pérdidas NO recuperadas
    .reduce((total, p) => total + (p.monto || 0), 0);
}

/**
 * Calcula el monto total recuperado
 * @param perdidas Array de pérdidas del siniestro
 * @returns Monto total recuperado
 */
export function calcularMontoRecuperado(perdidas: Perdida[]): number {
  if (!Array.isArray(perdidas)) return 0;
  
  return perdidas
    .filter(p => p.recuperado) // Solo pérdidas recuperadas
    .reduce((total, p) => total + (p.monto || 0), 0);
}

/**
 * Calcula el monto bruto total (antes de considerar recuperaciones)
 * @param perdidas Array de pérdidas del siniestro
 * @returns Monto total bruto
 */
export function calcularMontoBruto(perdidas: Perdida[]): number {
  if (!Array.isArray(perdidas)) return 0;
  
  return perdidas.reduce((total, p) => total + (p.monto || 0), 0);
}

/**
 * Calcula estadísticas completas de pérdidas
 * @param perdidas Array de pérdidas del siniestro
 * @returns Objeto con todos los cálculos de pérdidas
 */
export function calcularEstadisticasPerdidas(perdidas: Perdida[]) {
  const montoBruto = calcularMontoBruto(perdidas);
  const montoRecuperado = calcularMontoRecuperado(perdidas);
  const montoPerdidasReales = calcularMontoPerdidasReales(perdidas);
  
  return {
    montoBruto,
    montoRecuperado,
    montoPerdidasReales,
    porcentajeRecuperacion: montoBruto > 0 ? (montoRecuperado / montoBruto) * 100 : 0
  };
}
