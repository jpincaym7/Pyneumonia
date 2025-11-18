/**
 * Componente de filtros para órdenes médicas
 */
'use client';

import React from 'react';
import { MdSearch, MdFilterList, MdClear } from 'react-icons/md';
import type { MedicalOrderFilters as MedicalOrderFiltersType } from '@/types/medical-order';
import { PRIORITY_CHOICES, STATUS_CHOICES } from '@/types/medical-order';

interface MedicalOrderFiltersProps {
  onFilterChange: (filters: MedicalOrderFiltersType) => void;
  isLoading?: boolean;
}

export const MedicalOrderFiltersComponent: React.FC<MedicalOrderFiltersProps> = ({
  onFilterChange,
  isLoading = false,
}) => {
  const [filters, setFilters] = React.useState<MedicalOrderFiltersType>({});
  const [showFilters, setShowFilters] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as 'low' | 'medium' | 'high' | 'urgent' | '';
    const newFilters = { ...filters, priority: priority ? (priority as 'low' | 'medium' | 'high' | 'urgent') : undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' | '';
    const newFilters = { ...filters, status: status ? (status as 'pending' | 'in_progress' | 'completed' | 'cancelled') : undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, razón o solicitante..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100"
          />
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          <MdFilterList className="w-5 h-5" />
          Filtros
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <MdClear className="w-5 h-5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prioridad */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              id="priority-filter"
              value={filters.priority || ''}
              onChange={handlePriorityChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Todas las prioridades</option>
              {PRIORITY_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="status-filter"
              value={filters.status || ''}
              onChange={handleStatusChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Todos los estados</option>
              {STATUS_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.priority && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {PRIORITY_CHOICES.find((p) => p.value === filters.priority)?.label}
              <button
                onClick={() => {
                  const newFilters = { ...filters, priority: undefined };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="hover:text-blue-600"
              >
                ✕
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {STATUS_CHOICES.find((s) => s.value === filters.status)?.label}
              <button
                onClick={() => {
                  const newFilters = { ...filters, status: undefined };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="hover:text-blue-600"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
