/**
 * Componente de barra de herramientas para radiografías
 */
'use client';

import React from 'react';
import { MdAdd, MdGridView, MdViewList } from 'react-icons/md';

interface XRayToolbarProps {
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  canAdd: boolean;
  onCreateClick: () => void;
}

export function XRayToolbar({
  viewMode,
  onViewModeChange,
  canAdd,
  onCreateClick,
}: XRayToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* View Toggle */}
      <div
        className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg"
        role="group"
        aria-label="Modo de vista"
      >
        <button
          onClick={() => onViewModeChange('table')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600'
          }`}
          title="Vista de tabla"
          aria-label="Vista de tabla"
          aria-pressed={viewMode === 'table'}
        >
          <MdViewList className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'grid'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600'
          }`}
          title="Vista de cuadrícula"
          aria-label="Vista de cuadrícula"
          aria-pressed={viewMode === 'grid'}
        >
          <MdGridView className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Create Button */}
      {canAdd && (
        <button
          onClick={onCreateClick}
          className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center gap-2 transition-all"
          aria-label="Crear nueva radiografía"
        >
          <MdAdd className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Radiografía</span>
        </button>
      )}
    </div>
  );
}
