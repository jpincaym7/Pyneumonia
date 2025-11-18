/**
 * Lista de expedientes de pacientes (sidebar izquierdo)
 * Diseño profesional y minimalista
 */
'use client';

import React from 'react';
import { MdFolder, MdPerson, MdImage } from 'react-icons/md';

export interface PatientFile {
  patient_dni: string;
  patient_name: string;
  xray_count: number;
  analyzed_count: number;
  pending_count: number;
  last_upload: string;
}

interface PatientFileListProps {
  patients: PatientFile[];
  selectedPatient: string | null;
  onSelectPatient: (dni: string) => void;
  isLoading: boolean;
}

export function PatientFileList({
  patients,
  selectedPatient,
  onSelectPatient,
  isLoading,
}: PatientFileListProps) {
  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-50 rounded-lg p-3 border border-slate-200 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <MdFolder className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm text-slate-600 font-medium">No hay expedientes</p>
        <p className="text-xs text-slate-500 mt-1">
          Ajusta los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {patients.map((patient) => {
        const isSelected = selectedPatient === patient.patient_dni;
        
        return (
          <button
            key={patient.patient_dni}
            onClick={() => onSelectPatient(patient.patient_dni)}
            className={`w-full text-left rounded-lg p-3 border transition-all duration-200 ${
              isSelected
                ? 'bg-slate-700 border-slate-700 shadow-lg ring-2 ring-slate-400 ring-offset-1'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icono */}
              <div
                className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-slate-600'
                    : 'bg-slate-100'
                }`}
              >
                <MdFolder
                  className={`w-5 h-5 ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}
                />
              </div>

              {/* Información del Paciente */}
              <div className="flex-1 min-w-0">
                {/* Nombre */}
                <h3
                  className={`font-bold text-sm mb-1 truncate ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}
                  title={patient.patient_name}
                >
                  {patient.patient_name}
                </h3>

                {/* DNI */}
                <div
                  className={`flex items-center gap-1.5 text-xs mb-2 ${
                    isSelected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <MdPerson className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-mono">{patient.patient_dni}</span>
                </div>

                {/* Estadísticas */}
                <div className="flex items-center gap-3 text-xs">
                  {/* Total */}
                  <div
                    className={`flex items-center gap-1 ${
                      isSelected ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <MdImage className="w-3.5 h-3.5" />
                    <span className="font-semibold">{patient.xray_count}</span>
                  </div>

                  {/* Analizadas */}
                  <div
                    className={`flex items-center gap-1 ${
                      isSelected ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span className="font-semibold">{patient.analyzed_count}</span>
                  </div>

                  {/* Pendientes */}
                  <div
                    className={`flex items-center gap-1 ${
                      isSelected ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span className="font-semibold">{patient.pending_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
