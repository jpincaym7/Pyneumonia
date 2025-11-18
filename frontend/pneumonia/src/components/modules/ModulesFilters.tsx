'use client';

/**
 * Filtros para módulos
 */

import type { ModuleFilters } from '@/services/module.service';
import type { Menu } from '@/types/auth';
import { MdSearch, MdFilterList, MdRefresh } from 'react-icons/md';

interface ModulesFiltersProps {
  filters: ModuleFilters;
  showFilters: boolean;
  menus: Menu[];
  onFiltersChange: (filters: ModuleFilters) => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

export default function ModulesFilters({
  filters,
  showFilters,
  menus,
  onFiltersChange,
  onToggleFilters,
  onRefresh
}: ModulesFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-4 animate-fadeInDown animation-delay-100">
      {/* Barra de búsqueda y botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar módulos por nombre, URL o descripción..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={onToggleFilters}
            className={`px-4 py-2.5 rounded-lg border-2 font-semibold transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-600 hover:text-indigo-600'
            }`}
          >
            <MdFilterList className="h-5 w-5" />
            Filtros
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center gap-2"
            title="Actualizar"
          >
            <MdRefresh className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 animate-fadeInDown">
          {/* Filtro por menú */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Menú
            </label>
            <select
              value={filters.menu || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                menu: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Todos los menús</option>
              {menus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                is_active: e.target.value === '' ? undefined : e.target.value === 'true' 
              })}
              className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={filters.ordering || '-id'}
              onChange={(e) => onFiltersChange({ ...filters, ordering: e.target.value })}
              className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="-id">Más recientes</option>
              <option value="id">Más antiguos</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="-name">Nombre (Z-A)</option>
              <option value="url">URL (A-Z)</option>
              <option value="-url">URL (Z-A)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
