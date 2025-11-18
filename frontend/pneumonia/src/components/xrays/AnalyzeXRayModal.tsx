/**
 * Modal de análisis de radiografías con IA - Estilo DICOM Professional
 */
'use client';

import React, { useState } from 'react';
import { XRayImage } from '@/types/xray';
import { 
  MdAnalytics, 
  MdClose, 
  MdImage, 
  MdPerson, 
  MdAccessTime, 
  MdCheckCircle,
  MdZoomIn,
  MdZoomOut,
  MdRotateRight,
  MdRefresh,
  MdBrightness6,
  MdContrast,
} from 'react-icons/md';

interface AnalyzeXRayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  xray: XRayImage | null;
  isLoading?: boolean;
}

export const AnalyzeXRayModal: React.FC<AnalyzeXRayModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  xray,
  isLoading = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invertColors, setInvertColors] = useState(false);

  if (!isOpen || !xray) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5));
  const handleRotate = () => setRotation((rotation + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvertColors(false);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm" 
          onClick={!isLoading ? onClose : undefined}
        ></div>

        {/* Modal - DICOM Viewer Style */}
        <div className="relative bg-slate-900 w-full h-screen max-w-[98vw] max-h-[98vh] flex flex-col overflow-hidden z-[110] shadow-2xl border-2 border-slate-700">
          {/* Header - Medical Toolbar */}
          <div className="bg-slate-800 border-b-2 border-slate-700 px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left - Patient Info */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <MdAnalytics className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    ANÁLISIS AUTOMATIZADO - DETECCIÓN DE NEUMONÍA
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-slate-300 mt-0.5">
                    <span className="flex items-center gap-1.5">
                      <MdPerson className="w-4 h-4" />
                      {xray.patient_name}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-emerald-400">DNI: {xray.patient_dni}</span>
                    <span className="text-slate-500">•</span>
                    <span>{new Date(xray.uploaded_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>

              {/* Right - Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-all disabled:opacity-50"
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body - Split View Medical Style */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Image Viewer with Controls */}
            <div className="flex-1 flex flex-col bg-black border-r-2 border-slate-700">
              {/* Image Controls Toolbar */}
              <div className="bg-slate-800/80 backdrop-blur-sm px-4 py-2 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide mr-2">
                      Controles:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors disabled:opacity-30"
                        title="Alejar"
                      >
                        <MdZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-300 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors disabled:opacity-30"
                        title="Acercar"
                      >
                        <MdZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-slate-600"></div>

                    <button
                      onClick={handleRotate}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Rotar 90°"
                    >
                      <MdRotateRight className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-slate-600"></div>

                    {/* Invert Colors */}
                    <button
                      onClick={() => setInvertColors(!invertColors)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        invertColors 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      title="Invertir Colores"
                    >
                      Invertir
                    </button>

                    <button
                      onClick={handleReset}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                      title="Restablecer"
                    >
                      <MdRefresh className="w-4 h-4" />
                      Reset
                    </button>
                  </div>

                  {/* Image Adjustments */}
                  <div className="flex items-center gap-4">
                    {/* Brightness */}
                    <div className="flex items-center gap-2">
                      <MdBrightness6 className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        title="Brillo"
                      />
                      <span className="text-xs text-slate-400 w-8">{brightness}%</span>
                    </div>

                    {/* Contrast */}
                    <div className="flex items-center gap-2">
                      <MdContrast className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        title="Contraste"
                      />
                      <span className="text-xs text-slate-400 w-8">{contrast}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Display Area */}
              <div className="flex-1 overflow-hidden flex items-center justify-center p-8 relative">
                {xray.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={xray.image_url}
                      alt={`Radiografía ${xray.patient_dni}`}
                      className="max-w-full max-h-full object-contain transition-all duration-200"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%) ${invertColors ? 'invert(1)' : ''}`,
                      }}
                    />

                    {/* Overlay Info - DICOM Style */}
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-600 font-mono text-xs">
                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center gap-2">
                          <MdImage className="w-3 h-3 text-blue-400" />
                          <span>STUDY ID: #{xray.id}</span>
                        </div>
                        <div>MODALITY: CR - Chest X-Ray</div>
                        <div>REGION: THORAX</div>
                      </div>
                    </div>

                    {/* Measurement Info */}
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-600">
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Zoom: {Math.round(zoom * 100)}%</div>
                        <div>Rotación: {rotation}°</div>
                        <div>Brillo: {brightness}% | Contraste: {contrast}%</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <MdImage className="h-20 w-20 text-slate-700 mb-4" />
                    <p className="text-slate-500 font-semibold">No hay imagen disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Analysis Information */}
            <div className="w-[420px] bg-slate-800 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Analysis Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 border border-purple-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <MdAnalytics className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Análisis con IA</h3>
                      <p className="text-xs text-purple-100">Detección de Neumonía</p>
                    </div>
                  </div>
                </div>

                {/* AI Model Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Especificaciones del Modelo
                  </h4>

                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-3">
                    <div className="flex items-start gap-3">
                      <MdCheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">ResNet V50</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Red neuronal convolucional profunda especializada en patrones radiológicos
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-white mb-1">Detección Multiclase</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Clasifica: Normal, Neumonía Bacteriana, Neumonía Viral
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex items-start gap-3">
                        <MdAccessTime className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-white mb-1">Tiempo de Análisis</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            2-5 segundos mediante Roboflow Vision AI
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accuracy Metrics */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    Métricas de Rendimiento
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Precisión General</span>
                        <span className="text-emerald-400 font-bold">92%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Sensibilidad</span>
                        <span className="text-blue-400 font-bold">89%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Especificidad</span>
                        <span className="text-purple-400 font-bold">94%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Warning */}
                <div className="bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wide">
                        Advertencia Médica
                      </p>
                      <p className="text-xs text-amber-200 leading-relaxed">
                        Diagnóstico preliminar automatizado. Requiere <strong>validación por profesional médico</strong> antes de decisión clínica.
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Powered by Roboflow Vision AI.</strong> Análisis seguro con almacenamiento en historial médico.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Action Bar */}
          <div className="bg-slate-800 border-t-2 border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-300 font-semibold">
                    Sistema listo para análisis
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:from-purple-400 disabled:to-purple-500 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2.5 border border-purple-500"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando Análisis...
                    </>
                  ) : (
                    <>
                      <MdAnalytics className="h-5 w-5" />
                      Iniciar Análisis IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
