/**
 * Componente para generar boletines desde SVG templates
 * Permite: 
 * - Cargar foto del siniestro
 * - Generar boletín en PDF o imagen
 */

"use client";

import { useState } from "react";

interface BoletinGeneratorProps {
  idSiniestro: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function BoletinGenerator({
  idSiniestro,
  onClose,
  onSuccess,
}: BoletinGeneratorProps) {
  const [formato, setFormato] = useState<"pdf" | "imagen">("pdf");
  const [loading, setLoading] = useState(false);
  const [fotoCargada, setFotoCargada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manejar carga de foto
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append("file", file);

      // Obtener credenciales de autenticación
      const authCredentials = localStorage.getItem('auth_credentials');
      let headers: any = {};
      
      if (authCredentials) {
        try {
          const { username, password } = JSON.parse(authCredentials);
          const basicAuth = btoa(`${username}:${password}`);
          headers.Authorization = `Basic ${basicAuth}`;
        } catch (error) {
          console.error('Error parsing auth credentials:', error);
        }
      }

      // Enviar foto a ruta correcta
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';
      const response = await fetch(
        `${apiUrl}/siniestros/${idSiniestro}/foto/subir`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar la foto");
      }

      const data = await response.json();
      setSuccess("Foto cargada exitosamente");
      setFotoCargada(true);

      // Limpiar después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Generar boletín
  const handleGenerarBoletin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener credenciales de autenticación
      const authCredentials = localStorage.getItem('auth_credentials');
      let headers: any = {};
      
      if (authCredentials) {
        try {
          const { username, password } = JSON.parse(authCredentials);
          const basicAuth = btoa(`${username}:${password}`);
          headers.Authorization = `Basic ${basicAuth}`;
        } catch (error) {
          console.error('Error parsing auth credentials:', error);
        }
      }

      // URL de descarga
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';
      const response = await fetch(
        `${apiUrl}/siniestros/${idSiniestro}/boletin/generar?formato=${formato}`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Error al generar boletín: ${response.statusText}`);
      }

      // Obtener blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boletin-siniestro-${idSiniestro}.${
        formato === "pdf" ? "pdf" : "png"
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess("Boletín descargado exitosamente");
      setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Error in handleGenerarBoletin:', err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Generar Boletín de Siniestro
        </h2>

        {/* Indicador de Siniestro */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Siniestro ID:</span> {idSiniestro}
          </p>
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        {/* Mostrar éxito */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            ✓ {success}
          </div>
        )}

        {/* Carga de Foto */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📸 Cargar Foto
          </label>
          <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-600">
                {fotoCargada
                  ? "✓ Foto cargada"
                  : "Haz clic para seleccionar"}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        {/* Selección de Formato */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📄 Formato de Salida
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="formato"
                value="pdf"
                checked={formato === "pdf"}
                onChange={(e) => setFormato(e.target.value as "pdf" | "imagen")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">PDF</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="formato"
                value="imagen"
                checked={formato === "imagen"}
                onChange={(e) => setFormato(e.target.value as "pdf" | "imagen")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Imagen (PNG)</span>
            </label>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerarBoletin}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "⏳ Procesando..." : "📥 Descargar Boletín"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 disabled:bg-gray-300 transition"
          >
            Cerrar
          </button>
        </div>

        {/* Información Adicional */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <p>
            💡 <strong>Nota:</strong> Se usará el tipo de siniestro y datos
            registrados para generar el boletín automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
