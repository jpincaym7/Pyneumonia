/**
 * Componente de detalle del paciente seleccionado
 */
'use client';

import React from 'react';
import { MdPerson, MdAssessment } from 'react-icons/md';
import { DiagnosisResult } from '@/types/diagnosis';
import { getPatientInfo, calculatePatientStats } from '@/lib/diagnosis-utils';
import { DiagnosisTable } from '@/components/diagnosis/DiagnosisTable';

interface PatientDetailProps {
  patientDiagnoses: DiagnosisResult[];
  onViewDetails: (diagnosis: DiagnosisResult) => void;
  onMarkReviewed?: (diagnosis: DiagnosisResult) => void;
  onDelete?: (diagnosis: DiagnosisResult) => void;
}

export function PatientDetail({
  patientDiagnoses,
  onViewDetails,
  onMarkReviewed,
  onDelete,
}: PatientDetailProps) {
  const patientInfo = getPatientInfo(patientDiagnoses);
  const stats = calculatePatientStats(patientDiagnoses);

  return (
    <div className="space-y-4">
      {/* Header del Paciente Seleccionado */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-lg">
              <MdPerson className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {patientInfo.name}
              </h2>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-xs font-medium">DNI:</span>
                <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded">
                  {patientInfo.dni}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards del Paciente */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200">
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-600 uppercase tracking-wide font-medium">
              Total
            </p>
          </div>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-emerald-200">
            <p className="text-xl font-bold text-emerald-700">{stats.reviewed}</p>
            <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">
              Revisados
            </p>
          </div>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-red-200">
            <p className="text-xl font-bold text-red-700">{stats.pneumonia}</p>
            <p className="text-xs text-red-600 uppercase tracking-wide font-medium">
              Neumonías
            </p>
          </div>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-amber-200">
            <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
              Pendientes
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Análisis del Paciente */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-3.5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <MdAssessment className="w-5 h-5 text-white" />
            <h3 className="text-sm font-semibold text-white">
              Historial de Análisis Clínicos
            </h3>
          </div>
        </div>
        <DiagnosisTable
          diagnoses={patientDiagnoses}
          isLoading={false}
          onViewDetails={onViewDetails}
          onMarkReviewed={onMarkReviewed}
          onDelete={onDelete}
          compact={true}
        />
      </div>
    </div>
  );
}
