'use client';

/**
 * Modal de confirmación para eliminar módulo
 */

import type { Module } from '@/types/auth';
import { MdWarning, MdCancel } from 'react-icons/md';

interface DeleteConfirmModalProps {
  module: Module;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ module, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 flex items-center gap-3 rounded-t-2xl">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <MdWarning className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Confirmar Eliminación</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el módulo{' '}
            <span className="font-bold text-gray-900">{module.name}</span>?
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <p className="text-sm text-amber-800">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
              El módulo será eliminado permanentemente del sistema.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
          >
            Eliminar Módulo
          </button>
        </div>
      </div>
    </div>
  );
}
