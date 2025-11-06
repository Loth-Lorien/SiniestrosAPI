import { useState, useEffect } from 'react';
import { estadisticasService } from '@/lib/services';
import type { EstadisticasGenerales, FiltrosEstadisticas } from '../types';

interface UseEstadisticasGeneralesReturn {
  estadisticas: EstadisticasGenerales | null;
  loading: boolean;
  error: string | null;
  refetch: (filtros?: FiltrosEstadisticas) => Promise<void>;
}

export function useEstadisticasGenerales(filtros?: FiltrosEstadisticas): UseEstadisticasGeneralesReturn {
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = async (newFiltros?: FiltrosEstadisticas) => {
    try {
      setLoading(true);
      setError(null);
      const data = await estadisticasService.getEstadisticasGenerales(newFiltros || filtros);
      setEstadisticas(data);
    } catch (err) {
      console.error('Error fetching estadísticas generales:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas
  };
}
