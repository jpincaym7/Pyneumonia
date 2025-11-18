'use client';

import { useState, useEffect } from 'react';
import { GroupModulePermission } from '@/services/groupModulePermission.service';
import { permissionService } from '@/services/permission.service';
import { Permission } from '@/types/auth';

interface EditPermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (permissions: number[]) => void;
    groupModulePermission: GroupModulePermission;
}

export default function EditPermissionsModal({
    isOpen,
    onClose,
    onSubmit,
    groupModulePermission
}: EditPermissionsModalProps) {
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [searchPermission, setSearchPermission] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
            setSelectedPermissions(groupModulePermission.permissions || []);
        }
    }, [isOpen, groupModulePermission]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            const permissionsData = await permissionService.getPermissions();
            setAllPermissions(permissionsData);
        } catch (error) {
            console.error('Error cargando permisos:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handlePermissionToggle = (permissionId: number) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    const handleSelectAll = () => {
        const filtered = getFilteredPermissions();
        const allIds = filtered.map(p => p.id);
        setSelectedPermissions(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedPermissions([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedPermissions.length === 0) {
            alert('Por favor selecciona al menos un permiso');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(selectedPermissions);
            handleClose();
        } catch (error) {
            console.error('Error al actualizar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSearchPermission('');
        onClose();
    };

    const getFilteredPermissions = () => {
        return allPermissions.filter(p => {
            const matchesSearch = searchPermission === '' || 
                p.name.toLowerCase().includes(searchPermission.toLowerCase()) ||
                p.codename.toLowerCase().includes(searchPermission.toLowerCase());
            return matchesSearch;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Editar Permisos
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Módulo: <span className="font-semibold">{groupModulePermission.module?.name}</span>
                    </p>
                </div>

                {loadingData ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando permisos...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-120px)]">
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Búsqueda de Permisos */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar Permisos
                                </label>
                                <input
                                    type="text"
                                    value={searchPermission}
                                    onChange={(e) => setSearchPermission(e.target.value)}
                                    placeholder="Buscar por nombre o código..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Botones de Selección */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                >
                                    Seleccionar Todos
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                                >
                                    Deseleccionar Todos
                                </button>
                                <div className="ml-auto text-sm text-gray-600 flex items-center">
                                    Seleccionados: {selectedPermissions.length}
                                </div>
                            </div>

                            {/* Lista de Permisos */}
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                                    <h3 className="font-semibold text-gray-700">
                                        Permisos Disponibles ({getFilteredPermissions().length})
                                    </h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {getFilteredPermissions().length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            No se encontraron permisos
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                                            {getFilteredPermissions().map(permission => (
                                                <label
                                                    key={permission.id}
                                                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                                                        selectedPermissions.includes(permission.id)
                                                            ? 'bg-blue-50 border-blue-500'
                                                            : 'bg-white border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(permission.id)}
                                                        onChange={() => handlePermissionToggle(permission.id)}
                                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {permission.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {permission.codename}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer con Botones */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                                    disabled={loading || selectedPermissions.length === 0}
                                >
                                    {loading ? 'Actualizando...' : 'Actualizar'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
