'use client';

/**
 * Filtros y búsqueda de usuarios
 */

import type { UserFilters } from '@/types/user';
import { 
  MdSearch, 
  MdFilterList,
  MdRefresh
} from 'react-icons/md';

interface UsersFiltersProps {
  filters: UserFilters;
  showFilters: boolean;
  onFiltersChange: (filters: UserFilters) => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

export default function UsersFilters({ 
  filters, 
  showFilters,
  onFiltersChange, 
  onToggleFilters,
  onRefresh 
}: UsersFiltersProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 animate-fadeInUp animation-delay-100">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, usuario o cédula..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-gray-50 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleFilters}
              className={`px-4 py-2.5 border rounded-lg transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MdFilterList className="h-5 w-5" />
              Filtros
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
            >
              <MdRefresh className="h-5 w-5" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 animate-fadeInDown">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Estado
              </label>
              <select
                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-gray-50 transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tipo
              </label>
              <select
                value={filters.is_staff === undefined ? '' : String(filters.is_staff)}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  is_staff: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-gray-50 transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="true">Staff</option>
                <option value="false">Usuario Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Ordenar por
              </label>
              <select
                value={filters.ordering}
                onChange={(e) => onFiltersChange({ ...filters, ordering: e.target.value })}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-gray-50 transition-all cursor-pointer"
              >
                <option value="-date_joined">Más recientes</option>
                <option value="date_joined">Más antiguos</option>
                <option value="username">Nombre de usuario (A-Z)</option>
                <option value="-username">Nombre de usuario (Z-A)</option>
                <option value="email">Email (A-Z)</option>
                <option value="-email">Email (Z-A)</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
