'use client';

/**
 * Página de gestión de módulos
 * Lista, crea, edita y elimina módulos del sistema
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { moduleService } from '@/services/module.service';
import { menuService } from '@/services/menu.service';
import type { Module, Menu } from '@/types/auth';
import type { ModuleFilters } from '@/services/module.service';
import { MdAdd, MdViewModule } from 'react-icons/md';
import ModuleModal from '@/components/modules/ModuleModal';
import DeleteConfirmModal from '@/components/modules/DeleteConfirmModal';
import ModulesTable from '@/components/modules/ModulesTable';
import ModulesFilters from '@/components/modules/ModulesFilters';
import { NoPermissionModal } from '@/components';

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ModuleFilters>({
    search: '',
    is_active: undefined,
    ordering: '-id'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoPermissionModal, setShowNoPermissionModal] = useState(false);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState('');

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await moduleService.getModules(filters);
      console.log('Modules data received:', data);
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      
      const err = error as { status?: number; data?: { error?: string } };
      
      if (err?.status === 403) {
        setPermissionErrorMessage('No tienes permisos para ver módulos');
        setShowNoPermissionModal(true);
        return;
      } else if (err?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        return;
      } else {
        alert('Error al cargar módulos. Verifica la consola para más detalles.');
      }
      
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    try {
      const data = await menuService.getMenus();
      console.log('Menus data received:', data);
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar menús:', error);
      setMenus([]);
    }
  };

  useEffect(() => {
    loadModules();
    loadMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (module: Module) => {
    setSelectedModule(module);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedModule) return;

    try {
      await moduleService.deleteModule(selectedModule.id);
      setModules(Array.isArray(modules) ? modules.filter(m => m.id !== selectedModule.id) : []);
      setShowDeleteConfirm(false);
      setSelectedModule(null);
    } catch (error) {
      console.error('Error al eliminar módulo:', error);
      alert('Error al eliminar módulo');
    }
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedModule(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedModule(null);
  };

  const handleSaveModule = async () => {
    setShowModal(false);
    setSelectedModule(null);
    await loadModules();
  };

  const handleToggleActive = async (module: Module) => {
    try {
      const result = await moduleService.toggleActive(module.id);
      setModules(modules.map(m => 
        m.id === module.id ? { ...m, is_active: result.is_active } : m
      ));
    } catch (error) {
      console.error('Error al cambiar estado del módulo:', error);
      alert('Error al cambiar estado del módulo');
    }
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
            <MdViewModule className="text-indigo-600" />
            Gestión de Módulos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los módulos y permisos del sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <MdAdd className="h-5 w-5" />
          Nuevo Módulo
        </button>
      </div>

      {/* Filters & Search */}
      <ModulesFilters
        filters={filters}
        showFilters={showFilters}
        menus={menus}
        onFiltersChange={setFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={loadModules}
      />

      {/* Modules Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-fadeInUp animation-delay-200">
        <ModulesTable
          modules={modules}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Total Count */}
      <div className="text-center text-sm text-gray-600 animate-fadeIn animation-delay-300">
        Total: <span className="font-semibold text-gray-900">{Array.isArray(modules) ? modules.length : 0}</span> módulo(s)
      </div>

      {/* Modals */}
      {showModal && (
        <ModuleModal
          module={selectedModule}
          menus={menus}
          onClose={handleCloseModal}
          onSave={handleSaveModule}
        />
      )}

      {showDeleteConfirm && selectedModule && (
        <DeleteConfirmModal
          module={selectedModule}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedModule(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
