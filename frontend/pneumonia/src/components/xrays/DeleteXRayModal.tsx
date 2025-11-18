/**
 * Modal de confirmación para eliminar radiografía
 */
'use client';

import React from 'react';
import { XRayImage } from '@/types/xray';
import { MdWarning, MdDelete, MdImage } from 'react-icons/md';

interface DeleteXRayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  xray: XRayImage | null;
  isLoading?: boolean;
}

export const DeleteXRayModal: React.FC<DeleteXRayModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  xray,
  isLoading = false,
}) => {
  if (!isOpen || !xray) return null;

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
                  Eliminar Radiografía
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <MdImage className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{xray.patient_name}</p>
                  <p className="text-xs text-gray-600">DNI: {xray.patient_dni}</p>
                </div>
              </div>
              {xray.image_url && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={xray.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm font-semibold text-red-900">
                ¿Estás seguro de eliminar esta radiografía?
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
