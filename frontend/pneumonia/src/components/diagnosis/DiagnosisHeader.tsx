/**
 * Componente de header con estadísticas para el módulo de diagnósticos
 */
'use client';

import React from 'react';
import { MdAssessment } from 'react-icons/md';

interface DiagnosisStatsProps {
  total: number;
  analyzed: number;
  pneumonia: number;
  pending: number;
}

export function DiagnosisStats({
  total,
  analyzed,
  pneumonia,
  pending,
}: DiagnosisStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
        <p className="text-xl font-bold text-slate-900">{total}</p>
        <p className="text-xs text-slate-600 uppercase tracking-wide font-medium">
          Total
        </p>
      </div>
      <div className="bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-200">
        <p className="text-xl font-bold text-emerald-700">{analyzed}</p>
        <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">
          Revisados
        </p>
      </div>
      <div className="bg-red-50 px-4 py-3 rounded-lg border border-red-200">
        <p className="text-xl font-bold text-red-700">{pneumonia}</p>
        <p className="text-xs text-red-600 uppercase tracking-wide font-medium">
          Neumonías
        </p>
      </div>
      <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
        <p className="text-xl font-bold text-amber-700">{pending}</p>
        <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
          Pendientes
        </p>
      </div>
    </div>
  );
}

interface DiagnosisHeaderProps {
  stats: DiagnosisStatsProps;
}

export function DiagnosisHeader({ stats }: DiagnosisHeaderProps) {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-4 rounded-lg">
              <MdAssessment className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Análisis Clínicos
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Sistema de Evaluación y Diagnóstico por Imagen
              </p>
            </div>
          </div>

          <DiagnosisStats {...stats} />
        </div>
      </div>
    </div>
  );
}
