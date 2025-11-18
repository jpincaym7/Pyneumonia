/**
 * Componente de filtros de búsqueda y alfabético para radiografías
 */
'use client';

import React from 'react';
import { MdSearch } from 'react-icons/md';

interface XRayFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLetter: string | null;
  onLetterChange: (letter: string | null) => void;
}

// Todas las letras del abecedario español
const ALL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export function XRayFilters({
  searchTerm,
  onSearchChange,
  selectedLetter,
  onLetterChange,
}: XRayFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por DNI, nombre del paciente o descripción..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 text-slate-900 transition-all"
          aria-label="Buscar radiografías"
        />
      </div>

      {/* Filtro Alfabético */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Filtrar por inicial del paciente
        </label>
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="group"
          aria-label="Filtro alfabético"
        >
          <button
            onClick={() => onLetterChange(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedLetter === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-label="Mostrar todos los pacientes"
            aria-pressed={selectedLetter === null}
          >
            Todos
          </button>
          {ALL_LETTERS.map((letter) => {
            const isSelected = selectedLetter === letter;
            
            return (
              <button
                key={letter}
                onClick={() => onLetterChange(isSelected ? null : letter)}
                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                }`}
                aria-label={`Filtrar por letra ${letter}`}
                aria-pressed={isSelected}
                title={`Filtrar por ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
