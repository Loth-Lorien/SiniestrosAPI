'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PowerBIEmbed from '@/components/PowerBIEmbed';
import { FiBarChart2 } from 'react-icons/fi';

export default function PowerBIPage() {
  const powerBIUrl = "https://app.powerbi.com/reportEmbed?reportId=65cfd501-0c3f-4d4a-847f-4a8d52d95cd1&autoAuth=true&ctid=aae74eb5-ef3d-4985-a625-032bcaaff1aa&actionBarEnabled=true&reportCopilotInEmbed=true";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiBarChart2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tablero de Control Sp - Power BI</h1>
                <p className="text-gray-600 mt-1">
                  Panel de análisis y visualización de datos
                </p>
              </div>
            </div>
          </div>
        </div>

  {/* Información adicional eliminada por solicitud */}

        {/* Power BI Embed */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-2">
          <PowerBIEmbed
            reportUrl={powerBIUrl}
            title="Tablero de Control Sp"
            height="550px"
            className="w-full"
          />
        </div>

        {/* Nota al pie */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-3 text-yellow-900 text-sm max-w-xl">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19.07A10 10 0 1 1 19.07 4.93 10 10 0 0 1 4.93 19.07z" /></svg>
            <span>
              En caso de que tenga problemas con la visualización del informe, verifique las credenciales de acceso de Power BI, o comuníquese con el administrador.
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
