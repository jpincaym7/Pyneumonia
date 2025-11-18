'use client';

/**
 * Tabla de módulos
 */

import type { Module } from '@/types/auth';
import { MdEdit, MdDelete, MdCheckCircle, MdCancel, MdToggleOn, MdToggleOff } from 'react-icons/md';
import { DynamicIcon } from '@/components/icons/DynamicIcon';

interface ModulesTableProps {
  modules: Module[];
  loading: boolean;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onToggleActive: (module: Module) => void;
}

export default function ModulesTable({ 
  modules, 
  loading, 
  onEdit, 
  onDelete,
  onToggleActive
}: ModulesTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Cargando módulos...</p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No se encontraron módulos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Módulo
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              URL
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Menú
            </th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {modules.map((module, index) => (
            <tr 
              key={module.id} 
              className="hover:bg-gray-50 transition-colors animate-fadeInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Módulo */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DynamicIcon 
                      name={module.icon} 
                      className="h-5 w-5 text-indigo-600" 
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {module.name}
                    </div>
                    {module.description && (
                      <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                        {module.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* URL */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                  {module.url}
                </div>
              </td>

              {/* Menú */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <DynamicIcon 
                    name={module.menu.icon} 
                    className="h-4 w-4 text-gray-600" 
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    {module.menu.name}
                  </span>
                </div>
              </td>

              {/* Estado */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => onToggleActive(module)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    module.is_active
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  title={module.is_active ? 'Click para desactivar' : 'Click para activar'}
                >
                  {module.is_active ? (
                    <>
                      <MdCheckCircle className="h-4 w-4" />
                      Activo
                    </>
                  ) : (
                    <>
                      <MdCancel className="h-4 w-4" />
                      Inactivo
                    </>
                  )}
                </button>
              </td>

              {/* Acciones */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(module)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MdEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(module)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
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
