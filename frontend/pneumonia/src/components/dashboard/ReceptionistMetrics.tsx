'use client';

import React from 'react';
import { GroupSpecificMetrics } from '@/services/statistics.service';

interface ReceptionistMetricsProps {
  metrics: GroupSpecificMetrics;
}

export const ReceptionistMetrics: React.FC<ReceptionistMetricsProps> = ({ metrics }) => {
  // Calcular porcentajes para tareas pendientes
  const totalPatients = metrics.active_patients || 0;
  const patientsWithPendingXrays = metrics.patients_with_pending_xrays || 0;
  const patientsWithPendingReports = metrics.patients_with_pending_reports || 0;
  
  const pendingXraysPercentage = totalPatients > 0 ? (patientsWithPendingXrays / totalPatients) * 100 : 0;
  const pendingReportsPercentage = totalPatients > 0 ? (patientsWithPendingReports / totalPatients) * 100 : 0;

  // Calcular progreso semanal
  const weeklyRegistrations = metrics.patients_registered_week || 0;
  const todayRegistrations = metrics.patients_registered_today || 0;

  return (
    <div className="space-y-6">
      {/* Tarjetas principales con colores neutrales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pacientes Registrados Hoy */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                Registros Hoy
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {metrics.patients_registered_today || 0}
              </p>
              <p className="text-xs text-blue-600">
                Nuevos pacientes
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pacientes Esta Semana */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                Registros Esta Semana
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {metrics.patients_registered_week || 0}
              </p>
              <p className="text-xs text-emerald-600">
                Últimos 7 días
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pacientes Activos */}
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                Pacientes Activos
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {metrics.active_patients || 0}
              </p>
              <p className="text-xs text-purple-600">
                En seguimiento
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tareas Pendientes con barras de progreso */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Radiografías Pendientes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Radiografías</h3>
          <div className="space-y-6">
            {/* Pacientes con Radiografías Pendientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Pacientes Pendientes</span>
                <span className="text-2xl font-bold text-amber-900">{metrics.patients_with_pending_xrays || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${pendingXraysPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">{pendingXraysPercentage.toFixed(1)}% de pacientes activos</p>
            </div>

            {/* Radiografías Subidas Hoy */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Subidas Hoy</span>
                <span className="text-3xl font-bold text-blue-900">{metrics.xrays_uploaded_today || 0}</span>
              </div>
              <p className="text-xs text-slate-500">Imágenes procesadas</p>
            </div>
          </div>
        </div>

        {/* Reportes Pendientes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Reportes</h3>
          <div className="space-y-6">
            {/* Pacientes con Reportes Pendientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Pacientes Pendientes</span>
                <span className="text-2xl font-bold text-orange-900">{metrics.patients_with_pending_reports || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                  style={{ width: `${pendingReportsPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">{pendingReportsPercentage.toFixed(1)}% de pacientes activos</p>
            </div>

            {/* Estado de Reportes */}
            <div className="pt-4 border-t border-slate-200">
              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-orange-900">Requieren atención</span>
                  </div>
                  <span className="text-lg font-bold text-orange-900">{metrics.patients_with_pending_reports || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Día */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Resumen del Día</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Nuevos Pacientes</p>
            <p className="text-4xl font-bold text-blue-900 mb-1">
              {metrics.patients_registered_today || 0}
            </p>
            <p className="text-xs text-blue-600">registrados hoy</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Radiografías Subidas</p>
            <p className="text-4xl font-bold text-emerald-900 mb-1">
              {metrics.xrays_uploaded_today || 0}
            </p>
            <p className="text-xs text-emerald-600">procesadas hoy</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Pacientes Activos</p>
            <p className="text-4xl font-bold text-purple-900 mb-1">
              {metrics.active_patients || 0}
            </p>
            <p className="text-xs text-purple-600">en seguimiento</p>
          </div>
        </div>
      </div>

      {/* Estadísticas de la Semana */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Progreso Semanal</h3>
            <p className="text-sm text-slate-600">
              Has registrado {weeklyRegistrations} pacientes esta semana, incluyendo {todayRegistrations} hoy
            </p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-emerald-900">
              {weeklyRegistrations}
            </p>
            <p className="text-xs text-emerald-600 mt-2">pacientes/semana</p>
          </div>
        </div>
        
        {/* Indicadores de actividad */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white border border-slate-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Hoy</p>
            <p className="text-2xl font-bold text-slate-900">{todayRegistrations}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-emerald-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Semana</p>
            <p className="text-2xl font-bold text-emerald-900">{weeklyRegistrations}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-purple-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Activos</p>
            <p className="text-2xl font-bold text-purple-900">{totalPatients}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
