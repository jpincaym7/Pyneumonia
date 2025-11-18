'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { groupService } from '@/services/group.service';
import { Group } from '@/types/auth';
import groupModulePermissionService, { GroupModulePermission } from '@/services/group-module-permission.service';
import GroupModulePermissionModal from '@/components/groups/GroupModulePermissionModal';
import GroupModulePermissionsTable from '@/components/groups/GroupModulePermissionsTable';
import EditPermissionsModal from '@/components/groups/EditPermissionsModal';
import DeleteConfirmModal from '@/components/groups/DeleteConfirmModal';
import { NoPermissionModal } from '@/components';

export default function GroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupPermissions, setGroupPermissions] = useState<GroupModulePermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPermission, setEditingPermission] = useState<GroupModulePermission | null>(null);
    const [deletingPermission, setDeletingPermission] = useState<GroupModulePermission | null>(null);
    const [showNoPermissionModal, setShowNoPermissionModal] = useState(false);
    const [permissionErrorMessage, setPermissionErrorMessage] = useState('');

    const loadGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await groupService.getGroups();
            const data = response.results || [];
            setGroups(data);
            if (data.length > 0 && !selectedGroup) {
                setSelectedGroup(data[0]);
            }
        } catch (error) {
            console.error('Error cargando grupos:', error);
            
            const err = error as { status?: number; data?: { error?: string } };
            
            if (err?.status === 403) {
                setPermissionErrorMessage('No tienes permisos para ver grupos');
                setShowNoPermissionModal(true);
                return;
            } else if (err?.status === 401) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                router.push('/login');
                return;
            }
        } finally {
            setLoading(false);
        }
    }, [selectedGroup, router]);

    const loadGroupPermissions = useCallback(async (groupId: number) => {
        setLoadingPermissions(true);
        try {
            const data = await groupModulePermissionService.getByGroup(groupId);
            setGroupPermissions(data);
        } catch (error) {
            console.error('Error cargando permisos del grupo:', error);
            setGroupPermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupPermissions(selectedGroup.id);
        }
    }, [selectedGroup, loadGroupPermissions]);

    const handleAddPermission = async (data: { module_id: number; permissions: number[] }) => {
        if (!selectedGroup) return;

        try {
            await groupModulePermissionService.create({
                group: selectedGroup.id,
                module: data.module_id,
                permissions: data.permissions
            });
            
            // Recargar permisos
            await loadGroupPermissions(selectedGroup.id);
            setShowAddModal(false);
        } catch (error) {
            console.error('Error al crear permiso:', error);
            alert('Error al asignar el módulo y permisos');
        }
    };

    const handleEditPermission = (permission: GroupModulePermission) => {
        setEditingPermission(permission);
        setShowEditModal(true);
    };

    const handleUpdatePermissions = async (permissions: number[]) => {
        if (!editingPermission || !selectedGroup) return;

        try {
            await groupModulePermissionService.update(editingPermission.id, {
                permissions
            });
            
            // Recargar permisos
            await loadGroupPermissions(selectedGroup.id);
            setShowEditModal(false);
            setEditingPermission(null);
        } catch (error) {
            console.error('Error al actualizar permisos:', error);
            alert('Error al actualizar los permisos');
        }
    };

    const handleDeletePermission = async (id: number) => {
        const permission = groupPermissions.find(gp => gp.id === id);
        if (!permission) return;
        
        setDeletingPermission(permission);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingPermission || !selectedGroup) return;

        try {
            await groupModulePermissionService.delete(deletingPermission.id);
            
            // Recargar permisos
            await loadGroupPermissions(selectedGroup.id);
            setShowDeleteModal(false);
            setDeletingPermission(null);
        } catch (error) {
            console.error('Error al eliminar permiso:', error);
            alert('Error al eliminar el módulo');
        }
    };

    const getAssignedModuleIds = () => {
        return groupPermissions.map(gp => gp.module.id).filter(id => id !== undefined) as number[];
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando grupos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Gestión de Grupos - Módulos y Permisos
                </h1>
                <p className="text-gray-600">
                    Asigna módulos y permisos a los grupos de usuarios
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Lista de Grupos */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-800">Grupos</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                                        selectedGroup?.id === group.id
                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                            : ''
                                    }`}
                                >
                                    <div className="font-medium text-gray-900">
                                        {group.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {group.user_count || 0} usuarios
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content - Permisos del Grupo */}
                <div className="lg:col-span-3">
                    {selectedGroup ? (
                        <>
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {selectedGroup.name}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {groupPermissions.length} módulos asignados
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                    >
                                        <span className="text-xl">+</span>
                                        Asignar Módulo
                                    </button>
                                </div>
                            </div>

                            {loadingPermissions ? (
                                <div className="bg-white rounded-lg shadow p-8 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Cargando módulos y permisos...</p>
                                </div>
                            ) : (
                                <GroupModulePermissionsTable
                                    permissions={groupPermissions}
                                    onEdit={handleEditPermission}
                                    onDelete={handleDeletePermission}
                                />
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Selecciona un grupo para ver sus módulos y permisos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para agregar módulo y permisos */}
            {selectedGroup && (
                <GroupModulePermissionModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddPermission}
                    existingModules={getAssignedModuleIds()}
                />
            )}

            {/* Modal para editar permisos */}
            {editingPermission && (
                <EditPermissionsModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingPermission(null);
                    }}
                    onSubmit={handleUpdatePermissions}
                    groupModulePermission={editingPermission}
                />
            )}

            {/* Modal de confirmación de eliminación */}
            {deletingPermission && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeletingPermission(null);
                    }}
                    onConfirm={confirmDelete}
                    moduleName={deletingPermission.module_name}
                    permissionCount={deletingPermission.permissions_data?.length || 0}
                />
            )}
        </div>
    );
}