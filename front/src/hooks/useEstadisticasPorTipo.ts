import { useState, useEffect } from 'react';
import { estadisticasService } from '@/lib/services';
import type { EstadisticasPorTipo, FiltrosEstadisticas } from '../types';

interface UseEstadisticasPorTipoReturn {
  estadisticas: EstadisticasPorTipo[];
  loading: boolean;
  error: string | null;
  refetch: (filtros?: FiltrosEstadisticas) => Promise<void>;
}

export function useEstadisticasPorTipo(filtros?: FiltrosEstadisticas): UseEstadisticasPorTipoReturn {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPorTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = async (newFiltros?: FiltrosEstadisticas) => {
    try {
      setLoading(true);
      setError(null);
      const data = await estadisticasService.getEstadisticasPorTipo(newFiltros || filtros);
      setEstadisticas(data);
    } catch (err) {
      console.error('Error fetching estadísticas por tipo:', err);
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
