'use client';

/**
 * Tabla de usuarios
 */

import type { User } from '@/types/user';
import { 
  MdEdit, 
  MdDelete, 
  MdPerson,
  MdCheckCircle,
  MdCancel,
  MdSupervisorAccount,
  MdVerifiedUser
} from 'react-icons/md';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  currentUserId?: number;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({ 
  users, 
  loading, 
  currentUserId,
  onEdit, 
  onDelete 
}: UsersTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!Array.isArray(users) || users.length === 0) {
    return (
      <div className="text-center py-12">
        <MdPerson className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-600">No se encontraron usuarios</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Grupos
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Fecha registro
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, index) => (
            <tr 
              key={user.id} 
              className="hover:bg-gray-50 transition-colors animate-fadeInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.email}</div>
                {user.dni && (
                  <div className="text-sm text-gray-500">CI: {user.dni}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {user.groups_data?.length > 0 ? (
                    user.groups_data.map((group) => (
                      <span
                        key={group.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {group.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">Sin grupos</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? (
                    <>
                      <MdCheckCircle className="h-3.5 w-3.5" />
                      Activo
                    </>
                  ) : (
                    <>
                      <MdCancel className="h-3.5 w-3.5" />
                      Inactivo
                    </>
                  )}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  {user.is_superuser && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                      <MdVerifiedUser className="h-3.5 w-3.5" />
                      Superusuario
                    </span>
                  )}
                  {user.is_staff && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-semibold">
                      <MdSupervisorAccount className="h-3.5 w-3.5" />
                      Staff
                    </span>
                  )}
                  {!user.is_staff && !user.is_superuser && (
                    <span className="text-xs text-gray-500">Usuario</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.date_joined)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MdEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                    disabled={user.id === currentUserId}
                  >
                    <MdDelete className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
