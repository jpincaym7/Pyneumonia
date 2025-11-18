/**
 * Tabla de diagnósticos
 */
'use client';

import React from 'react';
import { DiagnosisResult } from '@/types/diagnosis';
import { 
  MdVisibility, 
  MdDelete,
  MdCheckCircle,
  MdWarning,
  MdScience,
  MdDownload
} from 'react-icons/md';
import { generateDiagnosisPDF } from '@/utils/generateDiagnosisPDF';

interface DiagnosisTableProps {
  diagnoses: DiagnosisResult[];
  isLoading: boolean;
  onViewDetails: (diagnosis: DiagnosisResult) => void;
  onMarkReviewed?: (diagnosis: DiagnosisResult) => void;
  onDelete?: (diagnosis: DiagnosisResult) => void;
  compact?: boolean; // Si es true, no muestra el wrapper card y usa estilo más compacto
}

export const DiagnosisTable: React.FC<DiagnosisTableProps> = ({
  diagnoses,
  isLoading,
  onViewDetails,
  onMarkReviewed,
  onDelete,
  compact = false,
}) => {
  const [generatingPDFId, setGeneratingPDFId] = React.useState<string | null>(null);

  const handleDownloadPDF = async (diagnosis: DiagnosisResult) => {
    try {
      setGeneratingPDFId(diagnosis.id);
      await generateDiagnosisPDF(diagnosis);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setGeneratingPDFId(null);
    }
  };
  const getClassBadge = (predictedClass: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      NORMAL: { bg: 'bg-green-100', text: 'text-green-800', label: 'Normal' },
      PNEUMONIA_BACTERIA: { bg: 'bg-red-100', text: 'text-red-800', label: 'Neumonía Bacteriana' },
      PNEUMONIA_BACTERIAL: { bg: 'bg-red-100', text: 'text-red-800', label: 'Neumonía Bacterial' },
      PNEUMONIA_VIRAL: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Neumonía Viral' },
    };

    const badge = badges[predictedClass] || { bg: 'bg-gray-100', text: 'text-gray-800', label: predictedClass };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      analyzing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Analizando' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' },
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatConfidence = (confidence: string) => {
    const conf = parseFloat(confidence) * 100;
    return `${conf.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Cargando diagnósticos...</p>
        </div>
      </div>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <div className={compact ? "p-8 text-center" : "bg-white rounded-xl shadow-md p-12 text-center"}>
        <MdScience className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No hay diagnósticos</h3>
        <p className="text-gray-600">No se encontraron diagnósticos con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "bg-white rounded-xl shadow-md overflow-hidden"}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={compact ? "bg-slate-100" : "bg-gradient-to-r from-blue-600 to-indigo-600"}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Paciente
              </th>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Diagnóstico
              </th>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Confianza
              </th>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Estado
              </th>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Revisión
              </th>
              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Fecha
              </th>
              <th className={`px-6 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                compact ? 'text-slate-700' : 'text-white'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {diagnoses.map((diagnosis) => (
              <tr key={diagnosis.id} className={compact ? "hover:bg-purple-50" : "hover:bg-blue-50 transition-colors"}>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {diagnosis.xray_details?.patient_name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    DNI: {diagnosis.xray_details?.patient_dni || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {getClassBadge(diagnosis.predicted_class)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${parseFloat(diagnosis.confidence) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatConfidence(diagnosis.confidence)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {getStatusBadge(diagnosis.status)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {diagnosis.is_reviewed ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                        <MdCheckCircle className="h-4 w-4" />
                        <span className="text-xs font-semibold">Revisado</span>
                      </div>
                      {diagnosis.reviewed_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(diagnosis.reviewed_at).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full">
                      <MdWarning className="h-4 w-4" />
                      <span className="text-xs font-semibold">Pendiente</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                  {new Date(diagnosis.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(diagnosis)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      title="Ver detalles"
                    >
                      <MdVisibility className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(diagnosis)}
                      disabled={generatingPDFId === diagnosis.id}
                      className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Descargar PDF"
                    >
                      {generatingPDFId === diagnosis.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-700"></div>
                      ) : (
                        <MdDownload className="h-5 w-5" />
                      )}
                    </button>
                    {onMarkReviewed && !diagnosis.is_reviewed && (
                      <button
                        onClick={() => onMarkReviewed(diagnosis)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                        title="Marcar como revisado"
                      >
                        <MdCheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(diagnosis)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <MdDelete className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
