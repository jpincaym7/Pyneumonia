/**
 * Tarjeta de radiografía con opciones de editar y eliminar
 */
'use client';

import React from 'react';
import { XRayImage } from '@/types/xray';
import { MdImage, MdZoomIn, MdEdit, MdDelete, MdCheckCircle, MdSchedule } from 'react-icons/md';
import { formatDate, getQualityLabel, getViewPositionLabel } from '@/lib/xray-utils';

interface XRayGridCardProps {
  xray: XRayImage;
  onView: (xray: XRayImage) => void;
  onEdit: (xray: XRayImage) => void;
  onDelete?: (xray: XRayImage) => void;
  canEdit: boolean;
  canDelete?: boolean;
}

export function XRayGridCard({
  xray,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete = false,
}: XRayGridCardProps) {
  return (
    <article className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-500">
      {/* Contenedor de Imagen */}
      <div className="relative bg-gray-900 aspect-square overflow-hidden">
        {xray.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={xray.image_url}
              alt={`Radiografía ${xray.patient_dni}`}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300">
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => onView(xray)}
                  className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-100 rounded-full text-gray-900 transition-all hover:scale-110 shadow-lg font-semibold"
                  title="Ver radiografía completa"
                  aria-label="Ver radiografía"
                >
                  <MdZoomIn className="w-6 h-6" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => onEdit(xray)}
                    className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-all hover:scale-110 shadow-lg font-semibold"
                    title="Editar información"
                    aria-label="Editar información"
                  >
                    <MdEdit className="w-6 h-6" />
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(xray)}
                    className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all hover:scale-110 shadow-lg font-semibold"
                    title="Eliminar radiografía"
                    aria-label="Eliminar radiografía"
                  >
                    <MdDelete className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Badge de Estado de Análisis */}
            <div className="absolute top-3 right-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md ${
                  xray.is_analyzed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {xray.is_analyzed ? (
                  <>
                    <MdCheckCircle className="w-4 h-4" />
                    Analizada
                  </>
                ) : (
                  <>
                    <MdSchedule className="w-4 h-4" />
                    Pendiente
                  </>
                )}
              </div>
            </div>

            {/* Badge de Diagnóstico */}
            {xray.has_diagnosis && (
              <div className="absolute top-3 left-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-md">
                  <MdCheckCircle className="w-4 h-4" />
                  Diagnóstico
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <MdImage className="w-20 h-20 text-gray-600" />
          </div>
        )}
      </div>

      {/* Panel de Información */}
      <div className="p-5 space-y-4">
        {/* Información Técnica */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Calidad
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {getQualityLabel(xray.quality)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Posición
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {getViewPositionLabel(xray.view_position)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Fecha
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(xray.uploaded_at)}
            </span>
          </div>
        </div>

        {/* Indicadores de Estado */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          {/* Estado de Análisis */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Estado
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                xray.is_analyzed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {xray.is_analyzed ? (
                <>
                  <MdCheckCircle className="w-3.5 h-3.5" />
                  Analizada
                </>
              ) : (
                <>
                  <MdSchedule className="w-3.5 h-3.5" />
                  Pendiente
                </>
              )}
            </div>
          </div>

          {/* Diagnóstico */}
          {xray.has_diagnosis && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Diagnóstico
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                <MdCheckCircle className="w-3.5 h-3.5" />
                Disponible
              </div>
            </div>
          )}
        </div>

        {/* Notas si existen */}
        {xray.description && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {xray.description}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}