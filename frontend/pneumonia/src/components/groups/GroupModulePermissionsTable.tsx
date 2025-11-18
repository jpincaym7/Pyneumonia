'use client';

import { useState, Fragment } from 'react';
import { GroupModulePermission } from '@/services/groupModulePermission.service';
import { DynamicIcon } from '@/components/icons/DynamicIcon';

interface GroupModulePermissionsTableProps {
    permissions: GroupModulePermission[];
    onEdit: (permission: GroupModulePermission) => void;
    onDelete: (id: number) => void;
}

export default function GroupModulePermissionsTable({
    permissions,
    onEdit,
    onDelete
}: GroupModulePermissionsTableProps) {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            if (prev.includes(id)) {
                return prev.filter(rowId => rowId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    if (permissions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No hay módulos asignados a este grupo</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Menú
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Módulo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permisos
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {permissions.map((permission, index) => (
                        <Fragment key={permission.id}>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-2xl mr-2">
                                            <DynamicIcon 
                                                name={permission.module?.menu?.icon || 'MdFolder'} 
                                                className="w-6 h-6 text-gray-600"
                                            />
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {permission.module?.menu?.name || 'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="text-xl mr-2">
                                            <DynamicIcon 
                                                name={permission.module?.icon || 'MdDescription'} 
                                                className="w-5 h-5 text-gray-500"
                                            />
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {permission.module?.name || 'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <code className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono">
                                        {permission.module?.url || 'N/A'}
                                    </code>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleRow(permission.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                                    >
                                        <span>{permission.permissions_data?.length || 0} permisos</span>
                                        <span className="text-xs">
                                            {expandedRows.includes(permission.id) ? '▼' : '▶'}
                                        </span>
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onEdit(permission)}
                                        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg transition mr-2"
                                        title="Editar permisos"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete(permission.id)}
                                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Eliminar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            {expandedRows.includes(permission.id) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {permission.permissions_data && permission.permissions_data.length > 0 ? (
                                                permission.permissions_data.map(perm => (
                                                    <div
                                                        key={perm.id}
                                                        className="flex items-center bg-white border border-gray-200 rounded-lg p-2"
                                                    >
                                                        <span className="text-green-500 mr-2">✓</span>
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-900">
                                                                {perm.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {perm.codename}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center text-gray-500 text-sm">
                                                    No hay permisos asignados
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden divide-y divide-gray-200">
                {permissions.map((permission, index) => (
                    <div key={permission.id} className="p-4">
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                {/* Menú */}
                                <div className="flex items-center mb-2">
                                    <DynamicIcon 
                                        name={permission.module?.menu?.icon || 'MdFolder'} 
                                        className="w-5 h-5 text-gray-600 mr-2"
                                    />
                                    <span className="text-xs text-gray-500 uppercase font-semibold">
                                        {permission.module?.menu?.name || 'N/A'}
                                    </span>
                                </div>
                                
                                {/* Módulo */}
                                <div className="flex items-center mb-2">
                                    <DynamicIcon 
                                        name={permission.module?.icon || 'MdDescription'} 
                                        className="w-4 h-4 text-gray-500 mr-2"
                                    />
                                    <span className="text-sm font-semibold text-gray-900">
                                        {permission.module?.name || 'N/A'}
                                    </span>
                                </div>
                                
                                {/* URL */}
                                <code className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono inline-block">
                                    {permission.module?.url || 'N/A'}
                                </code>
                            </div>
                            
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                                #{index + 1}
                            </span>
                        </div>

                        {/* Botón de permisos */}
                        <button
                            onClick={() => toggleRow(permission.id)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm mb-3"
                        >
                            <span>{permission.permissions_data?.length || 0} permisos</span>
                            <span className="text-xs">
                                {expandedRows.includes(permission.id) ? '▼' : '▶'}
                            </span>
                        </button>

                        {/* Lista de permisos expandida */}
                        {expandedRows.includes(permission.id) && (
                            <div className="mb-3 space-y-2">
                                {permission.permissions_data && permission.permissions_data.length > 0 ? (
                                    permission.permissions_data.map(perm => (
                                        <div
                                            key={perm.id}
                                            className="flex items-start bg-gray-50 border border-gray-200 rounded-lg p-2"
                                        >
                                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900 break-words">
                                                    {perm.name}
                                                </div>
                                                <div className="text-xs text-gray-500 break-words">
                                                    {perm.codename}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 text-sm py-2">
                                        No hay permisos asignados
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(permission)}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                            </button>
                            <button
                                onClick={() => onDelete(permission.id)}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
