'use client';

/**
 * Modal de confirmación de eliminación
 */

import type { User } from '@/types/user';
import { MdDelete } from 'react-icons/md';

interface DeleteConfirmModalProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ user, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeInUp">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <MdDelete className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Eliminar Usuario</h3>
              <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <span className="font-semibold">{user.full_name}</span>?
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
