/**
 * Componente de tabla de radiografías con acciones CRUD
 * Diseño profesional tipo sistema hospitalario
 */
'use client';

import React from 'react';
import { XRayImage, QUALITY_CHOICES, VIEW_POSITION_CHOICES } from '@/types/xray';
import { 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdNavigateBefore,
  MdNavigateNext,
  MdCalendarToday,
  MdPerson,
  MdAnalytics,
  MdAssignment,
  MdImage,
  MdWarning
} from 'react-icons/md';

interface XRaysTableProps {
  xrays: XRayImage[];
  onView?: (xray: XRayImage) => void;
  onEdit?: (xray: XRayImage) => void;
  onDelete?: (xray: XRayImage) => void;
  onToggleAnalyzed?: (xray: XRayImage) => void;
  onAnalyze?: (xray: XRayImage) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAnalyze?: boolean;
  isLoading?: boolean;
  // Paginación
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export const XRaysTable: React.FC<XRaysTableProps> = ({
  xrays,
  onView,
  onEdit,
  onDelete,
  onToggleAnalyzed,
  onAnalyze,
  canEdit = false,
  canDelete = false,
  canAnalyze = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-700 font-semibold mt-6 text-base">Cargando registros médicos...</p>
        <p className="text-slate-500 text-sm mt-1">Por favor espera un momento</p>
      </div>
    );
  }

  if (xrays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-12 rounded-3xl mb-6">
          <MdImage className="w-24 h-24 text-slate-400 mx-auto" />
        </div>
        <p className="text-slate-900 text-xl font-bold">No se encontraron radiografías</p>
        <p className="text-slate-600 text-sm mt-2 max-w-md text-center">
          No hay registros que coincidan con los criterios de búsqueda. 
          Intenta ajustar los filtros o agrega una nueva radiografía.
        </p>
      </div>
    );
  }

  const getQualityLabel = (value: string) => {
    return QUALITY_CHOICES.find(q => q.value === value)?.label || value;
  };

  const getViewPositionLabel = (value: string) => {
    return VIEW_POSITION_CHOICES.find(v => v.value === value)?.label || value;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return '●●●●';
      case 'good': return '●●●○';
      case 'fair': return '●●○○';
      case 'poor': return '●○○○';
      default: return '○○○○';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Info Móvil */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Siguiente
            </button>
          </div>

          {/* Info Desktop */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-600">Mostrando</span>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {(currentPage - 1) * pageSize + 1}
              </span>
              <span className="text-sm font-medium text-slate-600">-</span>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>
              <span className="text-sm font-medium text-slate-600">de</span>
              <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                {totalCount}
              </span>
              <span className="text-sm font-medium text-slate-600">registros</span>
            </div>

            <div>
              <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px bg-white border border-slate-200" aria-label="Pagination">
                {/* Botón Anterior */}
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2.5 rounded-l-lg border-r border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <MdNavigateBefore className="h-5 w-5" />
                </button>

                {/* Primera página */}
                {startPage > 1 && (
                  <>
                    <button
                      onClick={() => onPageChange?.(1)}
                      className="relative inline-flex items-center px-4 py-2.5 border-r border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      1
                    </button>
                    {startPage > 2 && (
                      <span className="relative inline-flex items-center px-4 py-2.5 border-r border-slate-200 bg-white text-sm font-medium text-slate-400">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* Páginas */}
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`relative inline-flex items-center px-4 py-2.5 border-r border-slate-200 text-sm font-bold transition-all ${
                      page === currentPage
                        ? 'z-10 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Última página */}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2.5 border-r border-slate-200 bg-white text-sm font-medium text-slate-400">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => onPageChange?.(totalPages)}
                      className="relative inline-flex items-center px-4 py-2.5 border-r border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Botón Siguiente */}
                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2.5 rounded-r-lg bg-white text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <MdNavigateNext className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Tabla Principal */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          {/* Header */}
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <MdAssignment className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ID Estudio</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <MdPerson className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Paciente</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Calidad Imagen</span>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Vista</span>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <MdCalendarToday className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Fecha/Hora</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Estado</span>
              </th>
              {(canEdit || canDelete || onView) && (
                <th scope="col" className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Acciones</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-slate-100">
            {xrays.map((xray, index) => (
              <tr 
                key={xray.id} 
                className={`group transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                } hover:bg-blue-50/50 hover:shadow-sm`}
              >
                {/* ID Estudio */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                      <MdImage className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        #{xray.id.toString().padStart(4, '0')}
                      </div>
                      <div className="text-xs text-slate-500">
                        RX-{new Date(xray.uploaded_at).getFullYear()}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Paciente */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-slate-900 mb-0.5">
                      {xray.patient_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-semibold">DNI:</span>
                      <span className="text-xs text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {xray.patient_dni}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Calidad */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1.5 inline-flex items-center justify-center text-xs font-bold rounded-lg border ${getQualityColor(xray.quality)}`}>
                      {getQualityLabel(xray.quality)}
                    </span>
                    <div className="text-xs text-slate-400 text-center tracking-wider">
                      {getQualityIcon(xray.quality)}
                    </div>
                  </div>
                </td>

                {/* Vista */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                    {getViewPositionLabel(xray.view_position)}
                  </span>
                </td>

                {/* Fecha/Hora */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-semibold text-slate-900">
                      {new Date(xray.uploaded_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(xray.uploaded_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} hrs
                    </div>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    {/* Estado de Análisis */}
                    <div className="flex items-center gap-2">
                      {xray.is_analyzed ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-300 rounded-lg">
                          <MdCheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800">Analizada</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 rounded-lg">
                          <MdWarning className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-800">Pendiente</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Badge de Diagnóstico */}
                    {xray.has_diagnosis && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-violet-100 to-purple-50 border border-violet-300 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-violet-600 rounded-full"></div>
                        <span className="text-xs font-bold text-violet-800">Diagnóstico</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Acciones */}
                {(canEdit || canDelete || onView || canAnalyze) && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Ver */}
                      {onView && (
                        <button
                          onClick={() => onView(xray)}
                          className="group/btn p-2 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 hover:border-blue-600"
                          title="Ver detalles"
                        >
                          <MdVisibility className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Analizar */}
                      {canAnalyze && onAnalyze && !xray.has_diagnosis && (
                        <button
                          onClick={() => onAnalyze(xray)}
                          className="group/btn p-2 rounded-lg bg-purple-50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-purple-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md border border-purple-200 hover:border-purple-600"
                          title="Analizar con IA"
                        >
                          <MdAnalytics className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Editar */}
                      {canEdit && onEdit && (
                        <button
                          onClick={() => onEdit(xray)}
                          className="group/btn p-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-600"
                          title="Editar"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Toggle Estado */}
                      {canEdit && onToggleAnalyzed && (
                        <button
                          onClick={() => onToggleAnalyzed(xray)}
                          className={`group/btn p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border ${
                            xray.is_analyzed 
                              ? 'bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border-orange-200 hover:border-orange-600' 
                              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-600'
                          }`}
                          title={xray.is_analyzed ? 'Marcar pendiente' : 'Marcar analizada'}
                        >
                          {xray.is_analyzed ? (
                            <MdRadioButtonUnchecked className="w-5 h-5" />
                          ) : (
                            <MdCheckCircle className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      
                      {/* Eliminar */}
                      {canDelete && onDelete && (
                        <button
                          onClick={() => onDelete(xray)}
                          className="group/btn p-2 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md border border-red-200 hover:border-red-600"
                          title="Eliminar"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {renderPagination()}
    </div>
  );
};
