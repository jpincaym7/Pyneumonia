'use client';

/**
 * Modal para crear/editar módulo
 */

import { useState, useEffect } from 'react';
import { moduleService } from '@/services/module.service';
import type { Module, Menu } from '@/types/auth';
import type { ModuleFormData } from '@/services/module.service';
import { 
  MdViewModule,
  MdCancel,
  MdCheckCircle,
  MdLink,
  MdDescription
} from 'react-icons/md';

interface ModuleModalProps {
  module: Module | null;
  menus: Menu[];
  onClose: () => void;
  onSave: () => void;
}

export default function ModuleModal({ module, menus, onClose, onSave }: ModuleModalProps) {
  const [formData, setFormData] = useState<ModuleFormData>({
    url: module?.url || '',
    name: module?.name || '',
    menu: module?.menu.id || (menus[0]?.id || 0),
    description: module?.description || '',
    icon: module?.icon || 'MdViewModule',
    is_active: module?.is_active ?? true,
    permissions: module?.permissions || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.url || !formData.name || !formData.menu) {
      setError('URL, nombre y menú son campos requeridos');
      return;
    }

    // Validar formato de URL
    if (!formData.url.startsWith('/')) {
      setError('La URL debe comenzar con "/"');
      return;
    }

    try {
      setLoading(true);

      if (module) {
        await moduleService.updateModule(module.id, formData);
      } else {
        await moduleService.createModule(formData);
      }

      onSave();
    } catch (err) {
      const error = err as { data?: { error?: string; url?: string[]; name?: string[] } };
      const errorMsg = 
        error.data?.error || 
        error.data?.url?.[0] || 
        error.data?.name?.[0] || 
        'Error al guardar módulo';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-fadeInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MdViewModule className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {module ? 'Editar Módulo' : 'Nuevo Módulo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
          >
            <MdCancel className="h-6 w-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scroll">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm animate-shake flex items-start gap-3">
                <MdCancel className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Información del Módulo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-indigo-100">
                <MdViewModule className="text-indigo-600" />
                Información del Módulo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="Gestión de Usuarios"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <MdLink className="h-4 w-4 text-gray-600" />
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="/dashboard/users"
                  />
                  <p className="text-xs text-gray-500 mt-1">Debe comenzar con "/"</p>
                </div>

                {/* Menú */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Menú <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.menu}
                    onChange={(e) => setFormData({ ...formData, menu: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">Selecciona un menú</option>
                    {menus.map(menu => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icono */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Icono
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="MdViewModule"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa iconos de react-icons/md (ej: MdPerson, MdSettings)
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MdDescription className="h-4 w-4 text-gray-600" />
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400 resize-none"
                  placeholder="Descripción del módulo..."
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Estado</p>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    Módulo activo
                  </span>
                  <p className="text-xs text-gray-600">El módulo estará visible en el sistema</p>
                </div>
                <MdCheckCircle className={`h-5 w-5 ${formData.is_active ? 'text-emerald-600' : 'text-gray-300'} transition-colors`} />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </span>
                ) : (
                  module ? 'Actualizar Módulo' : 'Crear Módulo'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
