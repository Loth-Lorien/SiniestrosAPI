'use client';

import { useState } from 'react';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '@/components/DashboardLayout';
import FormularioSiniestro from '@/components/FormularioSiniestro';
import { siniestrosService } from '@/lib/services';
import { CrearSiniestro, ActualizarSiniestro } from '@/types/api';

export default function CrearSiniestroPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const handleSave = async (data: CrearSiniestro | ActualizarSiniestro) => {
    // El FormularioSiniestro ya creó el siniestro y subió la foto
    // Solo mostramos el mensaje de éxito
    setMensaje({
      tipo: 'success',
      texto: `✅ Siniestro creado exitosamente con todos sus datos`
    });
    
    setMostrarFormulario(false);
  };

  const handleCancel = () => {
    setMostrarFormulario(false);
  };

  const resetForm = () => {
    setMostrarFormulario(true);
    setMensaje(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ➕ Crear Nuevo Siniestro
              </h1>
              <p className="text-gray-600">
                Formulario actualizado con campos de fecha/hora, estado finalizado y detalles
              </p>
            </div>
            
            {!mostrarFormulario && (
              <button
                onClick={resetForm}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Nuevo Siniestro
              </button>
            )}
          </div>
        </div>

        {/* Mensaje de resultado */}
        {mensaje && !mostrarFormulario && (
          <div className={`rounded-lg p-6 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`font-medium ${
                mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {mensaje.texto}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetForm}
                  className="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50 transition-colors"
                >
                  Crear Otro
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FiArrowLeft className="w-3 h-3 mr-1" />
                  Ir al Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario ? (
          <FormularioSiniestro
            modo="crear"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-6xl mb-4">
              {mensaje?.tipo === 'success' ? '🎉' : '❌'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {mensaje?.tipo === 'success' ? 'Siniestro Creado Exitosamente' : 'Error al Crear Siniestro'}
            </h3>
            <p className="text-gray-600 mb-6">
              {mensaje?.tipo === 'success' 
                ? 'El siniestro ha sido registrado correctamente en el sistema con todos los detalles proporcionados.'
                : 'Ocurrió un error al procesar la información. Por favor, revise los datos e inténte nuevamente.'
              }
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Crear Otro Siniestro
              </button>
              <button
                onClick={() => window.location.href = '/siniestros'}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ver Lista de Siniestros
              </button>
            </div>
          </div>
        )}

        {/* Información sobre los nuevos campos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🆕 Nuevos Campos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>📅 Fecha y Hora:</strong>
              <br />
              Ahora puedes especificar la fecha y hora exacta del siniestro con controles separados.
            </div>
            <div>
              <strong>✅ Estado Finalizado:</strong>
              <br />
              Marca si el siniestro ha sido completamente procesado y finalizado.
            </div>
            <div>
              <strong>📝 Detalle del Siniestro:</strong>
              <br />
              Campo de texto libre para proporcionar contexto adicional y detalles específicos.
            </div>
          </div>
          <div className="mt-4 text-xs text-blue-700">
            <strong>💡 Tip:</strong> Usa el botón "📅 Fecha/Hora Actual" para establecer automáticamente el momento presente.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
