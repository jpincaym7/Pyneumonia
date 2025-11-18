/**
 * Modal de confirmación para eliminar diagnóstico
 */
'use client';

import React from 'react';
import { DiagnosisResult } from '@/types/diagnosis';
import { MdWarning, MdDelete, MdScience } from 'react-icons/md';

interface DeleteDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diagnosis: DiagnosisResult | null;
  isLoading?: boolean;
}

export const DeleteDiagnosisModal: React.FC<DeleteDiagnosisModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  diagnosis,
  isLoading = false,
}) => {
  if (!isOpen || !diagnosis) return null;

  const getClassLabel = (predictedClass: string) => {
    const labels: Record<string, string> = {
      NORMAL: 'Normal',
      PNEUMONIA_BACTERIA: 'Neumonía Bacteriana',
      PNEUMONIA_BACTERIAL: 'Neumonía Bacterial',
      PNEUMONIA_VIRAL: 'Neumonía Viral',
    };
    return labels[predictedClass] || predictedClass;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        {/* Overlay con blur */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md" 
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-red-100">
                <MdWarning className="h-7 w-7 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Eliminar Diagnóstico
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <MdScience className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {getClassLabel(diagnosis.predicted_class)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Confianza: {(parseFloat(diagnosis.confidence) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {diagnosis.xray_details && (
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-semibold">Paciente:</span> {diagnosis.xray_details.patient_name}</p>
                  <p><span className="font-semibold">DNI:</span> {diagnosis.xray_details.patient_dni}</p>
                  <p><span className="font-semibold">Fecha:</span> {new Date(diagnosis.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              )}
            </div>

            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm font-semibold text-red-900">
                ¿Estás seguro de eliminar este diagnóstico?
              </p>
              <p className="text-sm text-red-700 mt-1">
                Todos los datos asociados se perderán permanentemente.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-all flex items-center gap-2"
            >
              <MdDelete className="h-5 w-5" />
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
