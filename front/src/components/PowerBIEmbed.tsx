'use client';

import React, { useState } from 'react';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';

interface PowerBIEmbedProps {
  reportUrl: string;
  title?: string;
  height?: string;
  className?: string;
}

export default function PowerBIEmbed({ 
  reportUrl, 
  title = "Power BI Report",
  height = "600px",
  className = ""
}: PowerBIEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Loading state */}
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
          style={{ height }}
        >
          <div className="text-center">
            <FiLoader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Cargando informe de Power BI...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div 
          className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200 p-6"
          style={{ height }}
        >
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar el informe
            </h3>
            <p className="text-red-600 mb-4">
              No se pudo cargar el informe de Power BI. Verifica tu conexión o permisos.
            </p>
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Power BI iframe */}
      <iframe
        title={title}
        src={reportUrl}
        frameBorder="0"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full rounded-lg border border-gray-200 ${loading || error ? 'invisible' : 'visible'}`}
        style={{ height }}
      />
    </div>
  );
}
