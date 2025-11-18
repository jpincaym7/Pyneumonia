'use client';

/**
 * Página de gestión de usuarios
 * Lista, crea, edita y elimina usuarios
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/user.service';
import type { User, UserFilters } from '@/types/user';
import { MdAdd, MdPerson } from 'react-icons/md';
import UserModal from '@/components/users/UserModal';
import DeleteConfirmModal from '@/components/users/DeleteConfirmModal';
import UsersTable from '@/components/users/UsersTable';
import UsersFilters from '@/components/users/UsersFilters';
import { NoPermissionModal } from '@/components';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    is_active: undefined,
    ordering: '-date_joined'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoPermissionModal, setShowNoPermissionModal] = useState(false);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers(filters);
      // Asegurarse de que data sea un array
      console.log('Users data received:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      
      const err = error as { status?: number; data?: { error?: string } };
      
      // Mostrar mensaje de error más descriptivo
      if (err?.status === 403) {
        setPermissionErrorMessage('No tienes permisos para ver usuarios');
        setShowNoPermissionModal(true);
        return;
      } else if (err?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        return;
      } else {
        alert('Error al cargar usuarios. Verifica la consola para más detalles.');
      }
      
      setUsers([]); // En caso de error, establecer array vacío
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser.id);
      setUsers(Array.isArray(users) ? users.filter(u => u.id !== selectedUser.id) : []);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    setShowModal(false);
    setSelectedUser(null);
    await loadUsers();
  };

  // Mostrar modal de sin permisos
  if (showNoPermissionModal) {
    return (
      <NoPermissionModal
        isOpen={showNoPermissionModal}
        message={permissionErrorMessage}
        redirectTo="/dashboard"
        autoRedirectSeconds={3}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between animate-fadeInDown">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MdPerson className="text-indigo-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <MdAdd className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters & Search */}
      <UsersFilters
        filters={filters}
        showFilters={showFilters}
        onFiltersChange={setFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={loadUsers}
      />

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-fadeInUp animation-delay-200">
        <UsersTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Total Count */}
      <div className="text-center text-sm text-gray-600 animate-fadeIn animation-delay-300">
        Total: <span className="font-semibold text-gray-900">{Array.isArray(users) ? users.length : 0}</span> usuario(s)
      </div>

      {/* Modals */}
      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}

      {showDeleteConfirm && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
