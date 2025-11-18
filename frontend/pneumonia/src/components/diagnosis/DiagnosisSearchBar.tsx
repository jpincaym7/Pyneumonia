/**
 * Componente de barra de búsqueda y filtros para diagnósticos
 */
'use client';

import React from 'react';
import { MdSearch, MdRefresh } from 'react-icons/md';

interface DiagnosisSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLetter: string | null;
  onLetterChange: (letter: string | null) => void;
  availableLetters: string[];
  onRefresh: () => void;
}

export function DiagnosisSearchBar({
  searchTerm,
  onSearchChange,
  selectedLetter,
  onLetterChange,
  availableLetters,
  onRefresh,
}: DiagnosisSearchBarProps) {
  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border border-slate-200">
      <div className="flex flex-col gap-3">
        {/* Búsqueda y Actualizar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Búsqueda */}
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar paciente por nombre o DNI..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 placeholder:text-slate-400 text-slate-900 transition-all"
            />
          </div>

          {/* Botón Actualizar */}
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 transition-all border border-slate-300"
          >
            <MdRefresh className="h-5 w-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Filtro Alfabético */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onLetterChange(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedLetter === null
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() =>
                  onLetterChange(selectedLetter === letter ? null : letter)
                }
                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                  selectedLetter === letter
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
