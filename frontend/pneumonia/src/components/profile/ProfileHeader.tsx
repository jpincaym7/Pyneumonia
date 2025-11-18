/**
 * Componente de header del perfil
 */

import React from 'react';
import { MdEdit, MdSave, MdCancel } from 'react-icons/md';
import { User, AuthSession } from '@/types/auth';

interface ProfileHeaderProps {
  user: User;
  group: AuthSession | null;
  isEditing: boolean;
  isSaving: boolean;
  onEditToggle: () => void;
  onSave: () => void;
}

// Función auxiliar para obtener iniciales
const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') {
    return 'U';
  }
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  group,
  isEditing,
  isSaving,
  onEditToggle,
  onSave,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>
      <div className="px-8 pb-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl ring-8 ring-white">
              {getInitials(user.full_name || '')}
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
          </div>

          {/* Información básica */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mt-4 md:mt-0">
              {user.full_name || 'Usuario'}
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              {user.email}
            </p>
            {group && (
              <span className="inline-block mt-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                {group.name}
              </span>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={onEditToggle}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                <MdEdit className="w-5 h-5" />
                Editar Perfil
              </button>
            ) : (
              <>
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSave className="w-5 h-5" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={onEditToggle}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdCancel className="w-5 h-5" />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
