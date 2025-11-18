/**
 * Modal para confirmar eliminación de orden médica
 */
'use client';

import React from 'react';
import { MdDelete, MdCancel } from 'react-icons/md';
import { MedicalOrder } from '@/types/medical-order';

interface DeleteMedicalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  order?: MedicalOrder;
  isLoading?: boolean;
}

export const DeleteMedicalOrderModal: React.FC<DeleteMedicalOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  isLoading = false,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-red-50">
          <MdDelete className="w-8 h-8 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Eliminar Orden Médica</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar esta orden médica?
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Paciente:</span>{' '}
              <span className="text-gray-900">{order.patient_name}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Razón:</span>{' '}
              <span className="text-gray-900">{order.reason}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Estado:</span>{' '}
              <span className="text-gray-900">{order.status}</span>
            </p>
          </div>

          <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isDeleting || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MdCancel className="w-4 h-4 inline mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <MdDelete className="w-4 h-4" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
