'use client';

import { useState, useEffect } from 'react';
import { moduleService } from '@/services/module.service';
import { permissionService } from '@/services/permission.service';
import { Permission } from '@/types/auth';

interface ModuleWithMenu {
    id: number;
    url: string;
    name: string;
    menu_name: string;
    icon?: string;
    is_active: boolean;
}

interface GroupModulePermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        module_id: number;
        permissions: number[];
    }) => void;
    existingModules?: number[];
}

export default function GroupModulePermissionModal({
    isOpen,
    onClose,
    onSubmit,
    existingModules = []
}: GroupModulePermissionModalProps) {
    const [modules, setModules] = useState<ModuleWithMenu[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [searchPermission, setSearchPermission] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            const [modulesResponse, permissionsData] = await Promise.all([
                moduleService.getModules({ is_active: true }),
                permissionService.getPermissions()
            ]);
            
            // Convertir módulos a formato simplificado
            const convertedModules: ModuleWithMenu[] = modulesResponse.map(m => ({
                id: m.id,
                url: m.url,
                name: m.name,
                menu_name: typeof m.menu === 'object' ? m.menu.name : 'Sin Menú',
                icon: m.icon || '',
                is_active: m.is_active
            }));
            
            setModules(convertedModules);
            setAllPermissions(permissionsData);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleModuleChange = (moduleId: number) => {
        setSelectedModule(moduleId);
        setSelectedPermissions([]);
        setSearchPermission('');
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
        
        if (!selectedModule || selectedPermissions.length === 0) {
            alert('Por favor selecciona un módulo y al menos un permiso');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                module_id: selectedModule,
                permissions: selectedPermissions
            });
            handleClose();
        } catch (error) {
            console.error('Error al guardar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedModule(null);
        setSelectedPermissions([]);
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

    const availableModules = modules.filter(m => !existingModules.includes(m.id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                            Asignar Módulo y Permisos
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
                            disabled={loading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {loadingData ? (
                    <div className="p-8 sm:p-12 text-center flex-1 flex items-center justify-center">
                        <div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {/* Selección de Módulo */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        Seleccionar Módulo
                                        <span className="text-red-500">*</span>
                                    </span>
                                </label>
                                <select
                                    value={selectedModule || ''}
                                    onChange={(e) => handleModuleChange(Number(e.target.value))}
                                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition shadow-sm"
                                    required
                                >
                                    <option value="" className="text-gray-500">-- Seleccione un módulo --</option>
                                    {availableModules.map(module => (
                                        <option key={module.id} value={module.id} className="text-gray-900">
                                            {module.menu_name} - {module.name} ({module.url})
                                        </option>
                                    ))}
                                </select>
                                {availableModules.length === 0 && (
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-800 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Todos los módulos ya están asignados a este grupo
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedModule && (
                                <>
                                    {/* Búsqueda de Permisos */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            <span className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Buscar Permisos
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchPermission}
                                                onChange={(e) => setSearchPermission(e.target.value)}
                                                placeholder="Buscar por nombre o código..."
                                                className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-gray-900 transition shadow-sm"
                                            />
                                            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Botones de Selección y Contador */}
                                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                        <div className="flex gap-2 flex-1">
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="flex-1 sm:flex-initial px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm hover:shadow"
                                            >
                                                ✓ Todos
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeselectAll}
                                                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium shadow-sm hover:shadow"
                                            >
                                                ✕ Ninguno
                                            </button>
                                        </div>
                                        <div className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border border-blue-200">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>{selectedPermissions.length} seleccionados</span>
                                        </div>
                                    </div>

                                    {/* Lista de Permisos */}
                                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b-2 border-gray-200">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                Permisos Disponibles
                                                <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                                                    {getFilteredPermissions().length}
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="max-h-[300px] sm:max-h-96 overflow-y-auto bg-gray-50">
                                            {getFilteredPermissions().length === 0 ? (
                                                <div className="p-8 sm:p-12 text-center">
                                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-gray-500 font-medium">No se encontraron permisos</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-2 p-3 sm:p-4">
                                                    {getFilteredPermissions().map(permission => (
                                                        <label
                                                            key={permission.id}
                                                            className={`flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                                selectedPermissions.includes(permission.id)
                                                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.includes(permission.id)}
                                                                onChange={() => handlePermissionToggle(permission.id)}
                                                                className="mt-0.5 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <div className="ml-3 flex-1 min-w-0">
                                                                <div className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                                                                    {permission.name}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-600 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                                    {permission.codename}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer con Botones */}
                        <div className="p-4 sm:p-6 border-t-2 border-gray-200 bg-gray-50">
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    disabled={loading || !selectedModule || selectedPermissions.length === 0}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
