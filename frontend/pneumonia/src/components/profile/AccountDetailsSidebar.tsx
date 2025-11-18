/**
 * Componente de detalles de cuenta (sidebar)
 */

import React from 'react';
import { MdCheckCircle, MdSupervisorAccount, MdGroup, MdCalendarToday, MdShield, MdLock, MdNotifications } from 'react-icons/md';

interface AccountDetailsSidebarProps {
  user: {
    username: string;
    is_active: boolean;
    is_superuser: boolean;
    date_joined: string;
  };
  group: string | null;
}

export const AccountDetailsSidebar: React.FC<AccountDetailsSidebarProps> = ({ user, group }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado de la cuenta */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MdCheckCircle className="text-green-500" />
          Estado de Cuenta
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estado</span>
            {user.is_active ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Activa
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                Inactiva
              </span>
            )}
          </div>
          {user.is_superuser && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rol</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <MdSupervisorAccount className="w-3 h-3" />
                Super Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Información de grupo */}
      {group && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdGroup className="text-blue-500" />
            Grupo
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
              {group}
            </span>
          </div>
        </div>
      )}

      {/* Fecha de registro */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MdCalendarToday className="text-indigo-500" />
          Registro
        </h3>
        <p className="text-sm text-gray-600">
          Miembro desde: <span className="font-semibold text-gray-900">{formatDate(user.date_joined)}</span>
        </p>
      </div>

      {/* Consejos de seguridad */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-purple-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MdShield className="text-purple-600" />
          Seguridad
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <MdLock className="text-purple-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Cambia tu contraseña regularmente
            </p>
          </li>
          <li className="flex items-start gap-3">
            <MdNotifications className="text-purple-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Mantén tu email actualizado para recibir notificaciones
            </p>
          </li>
          <li className="flex items-start gap-3">
            <MdCheckCircle className="text-purple-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Verifica la actividad de tu cuenta regularmente
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};
