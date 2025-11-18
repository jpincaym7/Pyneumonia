'use client';

import React from 'react';
import { GroupSpecificMetrics } from '@/services/statistics.service';

interface RadiologistMetricsProps {
  metrics: GroupSpecificMetrics;
}

export const RadiologistMetrics: React.FC<RadiologistMetricsProps> = ({ metrics }) => {
  // Calcular porcentajes para gráfico de calidad
  const totalXrays = (metrics.high_quality_xrays || 0) + (metrics.low_quality_xrays || 0);
  const highQualityPercentage = totalXrays > 0 ? ((metrics.high_quality_xrays || 0) / totalXrays) * 100 : 0;
  const lowQualityPercentage = totalXrays > 0 ? ((metrics.low_quality_xrays || 0) / totalXrays) * 100 : 0;

  // Calcular porcentaje de análisis pendientes
  const totalAnalyses = (metrics.total_analyses || 0) + (metrics.pending_analyses || 0);
  const completedPercentage = totalAnalyses > 0 ? ((metrics.total_analyses || 0) / totalAnalyses) * 100 : 0;
  const pendingPercentage = totalAnalyses > 0 ? ((metrics.pending_analyses || 0) / totalAnalyses) * 100 : 0;

  // Configuración del gráfico de dona
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const highQualityStroke = (highQualityPercentage / 100) * circumference;
  const lowQualityStroke = (lowQualityPercentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Tarjetas principales con colores neutrales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Análisis Totales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Análisis Realizados
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.total_analyses || 0}
              </p>
              <p className="text-xs text-slate-500">
                Total completados
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Análisis Pendientes */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                Análisis Pendientes
              </p>
              <p className="text-3xl font-bold text-amber-900">
                {metrics.pending_analyses || 0}
              </p>
              <p className="text-xs text-amber-600">
                Por procesar
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Confianza Promedio */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                Confianza Promedio
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {(metrics.avg_confidence || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-emerald-600">
                Precisión del modelo
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Análisis Hoy */}
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                Análisis Hoy
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {metrics.analyses_today || 0}
              </p>
              <p className="text-xs text-purple-600">
                Procesados hoy
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de dona: Calidad de Imágenes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Calidad de Imágenes</h3>
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
                {/* Alta calidad */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${highQualityStroke} ${circumference}`}
                  strokeLinecap="round"
                />
                {/* Baja calidad */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray={`${lowQualityStroke} ${circumference}`}
                  strokeDashoffset={-highQualityStroke}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-slate-900">{totalXrays}</p>
                <p className="text-xs text-slate-500">imágenes</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium text-slate-700">Alta Calidad</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{metrics.high_quality_xrays || 0} ({highQualityPercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-slate-700">Baja Calidad</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{metrics.low_quality_xrays || 0} ({lowQualityPercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Estado de Análisis con barras de progreso */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Estado de Análisis</h3>
          <div className="space-y-6">
            {/* Análisis Completados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Completados</span>
                <span className="text-2xl font-bold text-emerald-900">{metrics.total_analyses || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${completedPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">{completedPercentage.toFixed(1)}% del total</p>
            </div>

            {/* Análisis Pendientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Pendientes</span>
                <span className="text-2xl font-bold text-amber-900">{metrics.pending_analyses || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${pendingPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">{pendingPercentage.toFixed(1)}% del total</p>
            </div>

            {/* Tiempo Promedio de Procesamiento */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Tiempo Promedio</span>
                <span className="text-3xl font-bold text-blue-900">{(metrics.avg_processing_time || 0).toFixed(1)}<span className="text-lg text-slate-600">s</span></span>
              </div>
              <p className="text-xs text-slate-500">Por análisis de imagen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de rendimiento */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Rendimiento del Día</h3>
            <p className="text-sm text-slate-600">
              Has procesado {metrics.analyses_today || 0} análisis con una confianza promedio de {(metrics.avg_confidence || 0).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-blue-900">
              {metrics.analyses_today || 0}
            </p>
            <p className="text-xs text-blue-600 mt-2">análisis hoy</p>
          </div>
        </div>
        
        {/* Indicadores de rendimiento */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white border border-slate-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.total_analyses || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-emerald-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Confianza</p>
            <p className="text-2xl font-bold text-emerald-900">{(metrics.avg_confidence || 0).toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-blue-100 text-center">
            <p className="text-sm text-slate-600 mb-1">Tiempo</p>
            <p className="text-2xl font-bold text-blue-900">{(metrics.avg_processing_time || 0).toFixed(1)}s</p>
          </div>
        </div>
      </div>
    </div>
  );
};
