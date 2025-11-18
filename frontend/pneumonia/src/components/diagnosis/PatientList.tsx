/**
 * Componente de lista de pacientes para el módulo de diagnósticos
 */
'use client';

import React from 'react';
import { MdPerson } from 'react-icons/md';
import { DiagnosisResult } from '@/types/diagnosis';
import { getPatientInfo, calculatePatientStats } from '@/lib/diagnosis-utils';

interface PatientListItemProps {
  patientKey: string;
  patientDiagnoses: DiagnosisResult[];
  isSelected: boolean;
  onSelect: (patientKey: string) => void;
}

export function PatientListItem({
  patientKey,
  patientDiagnoses,
  isSelected,
  onSelect,
}: PatientListItemProps) {
  const patientInfo = getPatientInfo(patientDiagnoses);
  const stats = calculatePatientStats(patientDiagnoses);

  return (
    <button
      onClick={() => onSelect(patientKey)}
      className={`w-full px-4 py-3.5 text-left transition-all ${
        isSelected
          ? 'bg-slate-50 border-l-3 border-slate-900'
          : 'hover:bg-slate-50/50 border-l-3 border-transparent'
      }`}
    >
      {/* Nombre del Paciente */}
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`p-2 rounded-lg ${
            isSelected ? 'bg-slate-900' : 'bg-slate-100'
          }`}
        >
          <MdPerson
            className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold truncate ${
              isSelected ? 'text-slate-900' : 'text-slate-700'
            }`}
          >
            {patientInfo.name}
          </h4>
          <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
            DNI: {patientInfo.dni}
          </p>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="flex items-center gap-2 flex-wrap pl-11">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">
          <span className="font-semibold text-slate-700">{stats.total}</span>
          <span className="text-slate-500">análisis</span>
        </div>
      </div>
    </button>
  );
}

interface PatientListProps {
  patients: Map<string, DiagnosisResult[]>;
  selectedPatient: string | null;
  onSelectPatient: (patientKey: string) => void;
}

export function PatientList({
  patients,
  selectedPatient,
  onSelectPatient,
}: PatientListProps) {
  return (
    <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-slate-100">
      {Array.from(patients.entries()).map(([patientKey, patientDiagnoses]) => (
        <PatientListItem
          key={patientKey}
          patientKey={patientKey}
          patientDiagnoses={patientDiagnoses}
          isSelected={selectedPatient === patientKey}
          onSelect={onSelectPatient}
        />
      ))}
    </div>
  );
}
