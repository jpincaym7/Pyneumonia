/**
 * Modal para mostrar resultados del análisis de IA - Diseño Profesional Médico
 */
'use client';

import React from 'react';
import { MdClose, MdCheckCircle, MdWarning, MdTrendingUp, MdScience, MdLocalHospital } from 'react-icons/md';

interface AnalysisResult {
  predicted_class: string;
  confidence_percentage: string;
  is_pneumonia: boolean;
  patient_name?: string;
  patient_dni?: string;
  image_url?: string;
}

interface AnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen || !result) return null;

  const isPneumonia = result.is_pneumonia;
  const confidence = parseFloat(result.confidence_percentage);

  // Determinar el tipo específico de neumonía
  const getPneumoniaType = (predictedClass: string) => {
    const lowerClass = predictedClass.toLowerCase();
    if (lowerClass.includes('bacteria')) return 'Neumonía Bacteriana';
    if (lowerClass.includes('viral')) return 'Neumonía Viral';
    if (lowerClass.includes('normal')) return 'Sin Neumonía';
    return predictedClass;
  };

  const pneumoniaType = getPneumoniaType(result.predicted_class);

  const confidenceColor = confidence >= 75 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-orange-400';
  const barColor = confidence >= 75 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-orange-500';

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl w-full max-w-7xl overflow-hidden z-[130] border border-slate-700">
          {/* Header Estilo DICOM */}
          <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-all"
            >
              <MdClose className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2.5 rounded-lg border border-blue-500/30">
                <MdScience className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-0.5">Análisis Radiológico por IA</h2>
                <p className="text-slate-400 text-sm">Sistema de Diagnóstico Automatizado</p>
              </div>
            </div>
          </div>

          {/* Body - Layout Dual (Imagen + Info) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Panel Izquierdo - Visor de Imagen DICOM Style */}
            <div className="bg-black rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Radiografía de Tórax</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400">● DICOM</span>
                </div>
              </div>
              
              <div className="relative aspect-square bg-black flex items-center justify-center p-4">
                {result.image_url ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.image_url}
                      alt="Radiografía de Tórax"
                      className="w-full h-full object-contain"
                      style={{ filter: 'brightness(1.1) contrast(1.2)' }}
                    />
                  </div>
                ) : (
                  <div className="text-slate-600 text-sm">No hay imagen disponible</div>
                )}
              </div>
              
              {/* Info de Imagen */}
              <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Paciente:</span>
                    <span className="text-slate-300 ml-2">{result.patient_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">DNI:</span>
                    <span className="text-slate-300 ml-2">{result.patient_dni || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Derecho - Información del Diagnóstico */}
            <div className="space-y-4">
              {/* Diagnóstico Principal - MUY DESTACADO */}
              <div className={`${isPneumonia ? 'bg-gradient-to-br from-red-900/30 to-orange-900/20 border-2 border-red-500/50' : 'bg-gradient-to-br from-emerald-900/30 to-green-900/20 border-2 border-emerald-500/50'} rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`${isPneumonia ? 'bg-red-500' : 'bg-emerald-500'} p-3 rounded-xl shadow-lg`}>
                    {isPneumonia ? <MdLocalHospital className="h-8 w-8 text-white" /> : <MdCheckCircle className="h-8 w-8 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Diagnóstico
                    </span>
                    <h3 className={`text-3xl font-bold mb-3 ${isPneumonia ? 'text-red-200' : 'text-emerald-200'}`}>
                      {pneumoniaType}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {isPneumonia 
                        ? 'Patrón radiológico compatible con neumonía detectado por el sistema de IA.'
                        : 'No se detectaron signos radiológicos de neumonía.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nivel de Confianza */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
                      <MdTrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Nivel de Confianza</h4>
                      <p className="text-xs text-slate-400">Precisión del modelo</p>
                    </div>
                  </div>
                  <span className={`text-3xl font-bold ${confidenceColor}`}>
                    {result.confidence_percentage}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>
              </div>

              {/* Clasificación Detallada */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
                  Clasificación Detallada
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-300">Clase Predicha:</span>
                    <span className={`text-sm font-bold ${isPneumonia ? 'text-red-300' : 'text-emerald-300'}`}>
                      {result.predicted_class}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-300">Estado:</span>
                    <span className={`text-sm font-bold ${isPneumonia ? 'text-red-300' : 'text-emerald-300'}`}>
                      {isPneumonia ? 'Positivo para Neumonía' : 'Negativo para Neumonía'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información sobre tipo de Neumonía */}
              {isPneumonia && (
                <div className="bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                    Información: {pneumoniaType}
                  </h4>
                  <p className="text-sm text-blue-200 leading-relaxed">
                    {pneumoniaType.includes('Bacteriana') && (
                      'Neumonía causada por bacterias. Requiere evaluación médica para tratamiento con antibióticos.'
                    )}
                    {pneumoniaType.includes('Viral') && (
                      'Neumonía causada por virus. Requiere evaluación médica para determinar el tratamiento adecuado.'
                    )}
                    {!pneumoniaType.includes('Bacteriana') && !pneumoniaType.includes('Viral') && pneumoniaType !== 'Sin Neumonía' && (
                      'Tipo de neumonía detectado. Se requiere evaluación médica profesional.'
                    )}
                  </p>
                </div>
              )}

              {/* Advertencia Médica */}
              <div className="bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg p-4">
                <div className="flex items-start gap-3">
                  <MdWarning className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wide">
                      Nota Importante
                    </p>
                    <p className="text-sm text-amber-200 leading-relaxed">
                      {isPneumonia 
                        ? 'Diagnóstico preliminar automatizado. Requiere confirmación médica profesional.'
                        : 'Se recomienda evaluación médica profesional para confirmación.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-700 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-slate-400">
                Resultado guardado en <strong className="text-slate-200">Diagnósticos</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
