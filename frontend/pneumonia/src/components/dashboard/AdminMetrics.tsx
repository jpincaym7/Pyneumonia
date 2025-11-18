'use client';

import React from 'react';
import { GroupSpecificMetrics } from '@/services/statistics.service';

interface AdminMetricsProps {
  metrics: GroupSpecificMetrics;
}

export const AdminMetrics: React.FC<AdminMetricsProps> = ({ metrics }) => {
  console.log('Admin Metrics:', metrics);

  // Calcular porcentajes para el gráfico de dona de usuarios activos/inactivos
  const totalUsers = metrics.total_users || 0;
  const activeUsers = metrics.active_users || 0;
  const inactiveUsers = metrics.inactive_users || 0;
  const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const inactivePercentage = totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0;

  // Calcular el trazo del círculo para el gráfico de dona
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const activeStroke = (activePercentage / 100) * circumference;
  const inactiveStroke = (inactivePercentage / 100) * circumference;

  // Datos para distribución de grupos
  const groupsData = [
    { name: 'Administradores', value: metrics.users_by_group?.Administradores || 0, color: '#64748b' },
    { name: 'Médicos', value: metrics.users_by_group?.Médicos || 0, color: '#94a3b8' },
    { name: 'Radiólogos', value: metrics.users_by_group?.Radiólogos || 0, color: '#cbd5e1' },
    { name: 'Recepcionistas', value: metrics.users_by_group?.Recepcionistas || 0, color: '#e2e8f0' },
  ];

  const totalGroupUsers = groupsData.reduce((sum, group) => sum + group.value, 0);

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen con colores neutrales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Usuarios */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Usuarios
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.total_users || 0}
              </p>
              <p className="text-xs text-slate-500">
                Sistema completo
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Usuarios Activos */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                Usuarios Activos
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {metrics.active_users || 0}
              </p>
              <p className="text-xs text-emerald-600">
                {activePercentage.toFixed(1)}% del total
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Grupos */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Grupos del Sistema
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.total_groups || 0}
              </p>
              <p className="text-xs text-slate-500">
                Roles definidos
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Accesos Hoy */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                Accesos Hoy
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {metrics.logins_today || 0}
              </p>
              <p className="text-xs text-blue-600">
                Sesiones iniciadas
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de dona: Estado de Usuarios */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Estado de Usuarios</h3>
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: '200px', height: '200px' }}>
              <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 100 100">
                {/* Fondo del círculo */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                {/* Usuarios activos */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${activeStroke} ${circumference}`}
                  strokeLinecap="round"
                />
                {/* Usuarios inactivos */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray={`${inactiveStroke} ${circumference}`}
                  strokeDashoffset={-activeStroke}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-slate-900">{totalUsers}</p>
                <p className="text-xs text-slate-500">usuarios</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium text-slate-700">Activos</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{activeUsers} ({activePercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-slate-700">Inactivos</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{inactiveUsers} ({inactivePercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Distribución por Grupos - Gráfico de barras */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Distribución por Grupos</h3>
          <div className="space-y-4">
            {groupsData.map((group, index) => {
              const percentage = totalGroupUsers > 0 ? (group.value / totalGroupUsers) * 100 : 0;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{group.name}</span>
                    <span className="text-sm font-bold text-slate-900">{group.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: group.color,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">{percentage.toFixed(1)}% del total</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actividad del Sistema */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Actividad del Sistema</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Nuevos Usuarios</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.new_users_week || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Últimos 7 días</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-white border border-amber-100">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">Sin Grupo</p>
            <p className="text-2xl font-bold text-amber-900">{metrics.users_without_group || 0}</p>
            <p className="text-xs text-amber-600 mt-1">Requieren asignación</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-white border border-red-100">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Usuarios Inactivos</p>
            <p className="text-2xl font-bold text-red-900">{metrics.inactive_users || 0}</p>
            <p className="text-xs text-red-600 mt-1">Cuentas deshabilitadas</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Permisos</p>
            <p className="text-2xl font-bold text-blue-900">{metrics.total_permissions || 0}</p>
            <p className="text-xs text-blue-600 mt-1">Total asignados</p>
          </div>
        </div>
      </div>

      {/* Accesos por Periodo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900">Accesos por Periodo</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
            <p className="text-sm font-medium text-blue-700 mb-2">Hoy</p>
            <p className="text-4xl font-bold text-blue-900 mb-1">
              {metrics.logins_today || 0}
            </p>
            <p className="text-xs text-blue-600">accesos</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <p className="text-sm font-medium text-emerald-700 mb-2">Esta Semana</p>
            <p className="text-4xl font-bold text-emerald-900 mb-1">
              {metrics.logins_week || 0}
            </p>
            <p className="text-xs text-emerald-600">accesos</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
            <p className="text-sm font-medium text-purple-700 mb-2">Este Mes</p>
            <p className="text-4xl font-bold text-purple-900 mb-1">
              {metrics.logins_month || 0}
            </p>
            <p className="text-xs text-purple-600">accesos</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Fallos</p>
            <p className="text-4xl font-bold text-slate-900 mb-1">
              {metrics.failed_logins || 0}
            </p>
            <p className="text-xs text-slate-600">intentos</p>
          </div>
        </div>
      </div>
    </div>
  );
};
