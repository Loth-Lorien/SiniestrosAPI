import { useState, useEffect } from 'react';
import { tiposService } from '../lib/services';
import type { 
  TipoSiniestro, 
  TipoPerdida, 
  Sexo, 
  RangoEdad, 
  Sucursal, 
  Zona 
} from '../types';

interface UseDatosMaestrosReturn {
  tiposSiniestro: TipoSiniestro[];
  tiposPerdida: TipoPerdida[];
  sexos: Sexo[];
  rangosEdad: RangoEdad[];
  sucursales: Sucursal[];
  zonas: Zona[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDatosMaestros(): UseDatosMaestrosReturn {
  const [tiposSiniestro, setTiposSiniestro] = useState<TipoSiniestro[]>([]);
  const [tiposPerdida, setTiposPerdida] = useState<TipoPerdida[]>([]);
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [rangosEdad, setRangosEdad] = useState<RangoEdad[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatosMaestros = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ejecutar todas las consultas en paralelo
      const [
        tiposSiniestroData,
        tiposPerdidaData,
        sexosData,
        rangosEdadData,
        sucursalesData,
        zonasData
      ] = await Promise.all([
        tiposService.getTiposSiniestro(),
        tiposService.getTiposPerdida(),
        tiposService.getSexos(),
        tiposService.getRangosEdad(),
        tiposService.getSucursales(),
        tiposService.getZonas()
      ]);

      setTiposSiniestro(tiposSiniestroData);
      setTiposPerdida(tiposPerdidaData);
      setSexos(sexosData.map(s => ({
        ...s,
        idSexo: String(s.idSexo)
      })));
      setRangosEdad(rangosEdadData);
      setSucursales(
        sucursalesData.map((s: any) => ({
          ...s,
          idEstado: s.idEstado ?? 0 // Asigna un valor por defecto si falta
        }))
      );
      setZonas(zonasData);
    } catch (err) {
      console.error('Error fetching datos maestros:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  return {
    tiposSiniestro,
    tiposPerdida,
    sexos,
    rangosEdad,
    sucursales,
    zonas,
    loading,
    error,
    refetch: fetchDatosMaestros
  };
}
