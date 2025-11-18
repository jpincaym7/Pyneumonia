/**
 * Modal visor de radiografías con controles de zoom, rotación y análisis IA - Estilo DICOM
 */
'use client';

import React, { useState, useEffect } from 'react';
import { XRayImage } from '@/types/xray';
import {
  MdImage,
  MdClose,
  MdZoomIn,
  MdZoomOut,
  MdDownload,
  MdInfo,
  MdRotateRight,
  MdRotateLeft,
  MdFullscreen,
  MdFullscreenExit,
  MdRefresh,
  MdPerson,
  MdCalendarToday,
  MdScience,
  MdCheckCircle,
  MdLocalHospital,
  MdWarning,
  MdTrendingUp,
  MdPanTool,
  MdTune,
  MdHelp,
} from 'react-icons/md';
import {
  formatDate,
  formatDateTime,
  getQualityLabel,
  getViewPositionLabel,
} from '@/lib/xray-utils';
import diagnosisService from '@/services/diagnosis.service';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

interface AnalysisResult {
  predicted_class: string;
  confidence_percentage: number;
  is_pneumonia: boolean;
}

interface XRayViewerModalProps {
  isOpen: boolean;
  xray: XRayImage | null;
  imageZoom: number;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  canAnalyze?: boolean;
  onAnalysisComplete?: () => void;
}

export function XRayViewerModal({
  isOpen,
  xray,
  imageZoom,
  onClose,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  canAnalyze = false,
  onAnalysisComplete,
}: XRayViewerModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Professional DICOM-like controls
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [windowLevel, setWindowLevel] = useState({ width: 100, center: 100 });
  const [isAdjustingWindow, setIsAdjustingWindow] = useState(false);
  const [windowStart, setWindowStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'pan' | 'window' | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // DICOM-like image processing
  const [dicomCanvas, setDicomCanvas] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Convert JPG to DICOM-like grayscale on mount or when image changes
  useEffect(() => {
    if (!isOpen || !xray || !xray.image_url) return;
    
    setIsProcessingImage(true);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale with medical imaging enhancement
        for (let i = 0; i < data.length; i += 4) {
          // Weighted grayscale conversion (medical imaging standard)
          const gray = Math.round(
            0.299 * data[i] +     // Red
            0.587 * data[i + 1] + // Green
            0.114 * data[i + 2]   // Blue
          );
          
          // Apply histogram equalization for better contrast
          const enhanced = gray;
          
          data[i] = enhanced;     // R
          data[i + 1] = enhanced; // G
          data[i + 2] = enhanced; // B
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to base64
        const dicomDataUrl = canvas.toDataURL('image/png');
        setDicomCanvas(dicomDataUrl);
        setIsProcessingImage(false);
      } catch (error) {
        console.error('Error processing image to DICOM format:', error);
        setIsProcessingImage(false);
      }
    };
    
    img.onerror = () => {
      console.error('Error loading image for DICOM conversion');
      setIsProcessingImage(false);
    };
    
    img.src = xray.image_url;
  }, [isOpen, xray]);

  if (!isOpen || !xray) return null;

  const handleAnalyze = async () => {
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const result = await diagnosisService.analyzeXRay(xray.id);
      setAnalysisResult({
        predicted_class: result.predicted_class,
        confidence_percentage: result.confidence_percentage || 0,
        is_pneumonia: result.is_pneumonia || false,
      });
      
      // Notificar que se completó el análisis
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error: unknown) {
      console.error('Error al analizar radiografía:', error);
      const err = error as { response?: { data?: { error?: string; detail?: string } } };
      setAnalysisError(
        err?.response?.data?.error || 
        err?.response?.data?.detail || 
        'Error al analizar la radiografía'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPneumoniaType = (predictedClass: string) => {
    const lowerClass = predictedClass.toLowerCase();
    if (lowerClass.includes('bacteria')) return 'Neumonía Bacteriana';
    if (lowerClass.includes('viral')) return 'Neumonía Viral';
    if (lowerClass.includes('normal')) return 'Sin Neumonía';
    return predictedClass;
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setInvertColors(false);
    setPanOffset({ x: 0, y: 0 });
    setWindowLevel({ width: 100, center: 100 });
    setActiveTool(null);
    onZoomReset();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Mouse event handlers for professional controls
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Prevent if clicking on scrollbars or outside image area
    if (target.tagName !== 'IMG' && target.tagName !== 'DIV') return;
    
    // Middle click (1) - Always Pan
    if (e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Left click (0) - Tool dependent
    if (e.button === 0) {
      if (activeTool === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        e.preventDefault();
        e.stopPropagation();
      } else if (activeTool === 'window') {
        setIsAdjustingWindow(true);
        setWindowStart({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      
      setPanOffset({
        x: newX,
        y: newY,
      });
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isAdjustingWindow) {
      const deltaX = e.clientX - windowStart.x;
      const deltaY = e.clientY - windowStart.y;
      
      setWindowLevel({
        width: Math.max(0, Math.min(200, windowLevel.width + deltaX * 0.3)),
        center: Math.max(0, Math.min(200, windowLevel.center - deltaY * 0.3)),
      });
      
      setWindowStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning || isAdjustingWindow) {
      e?.preventDefault();
      e?.stopPropagation();
    }
    setIsPanning(false);
    setIsAdjustingWindow(false);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only zoom with Ctrl + Mouse wheel
    if (e.ctrlKey) {
      if (e.deltaY < 0) {
        onZoomIn();
      } else {
        onZoomOut();
      }
    }
    // Mouse wheel alone does nothing (rotation is via buttons only)
  };

  // Touch support for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && activeTool === 'pan') {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/95"
          onClick={onClose}
        ></div>

        {/* Modal - Medical DICOM Viewer */}
        <div className={`relative bg-slate-900 rounded-lg shadow-2xl ${
          isFullscreen ? 'w-screen h-screen max-w-none max-h-none' : 'w-full max-w-7xl max-h-[95vh] m-4'
        } flex flex-col overflow-hidden border border-slate-700 transition-all duration-300`}>
          
          {/* Header - Medical Info Bar Estilo DICOM */}
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Información del Paciente */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-lg">
                  <MdPerson className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      VISOR MÉDICO - RADIOGRAFÍA DE TÓRAX
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Paciente:</span>
                      <span className="text-white font-semibold">{xray.patient_name}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">DNI:</span>
                      <span className="text-emerald-400 font-mono font-semibold">{xray.patient_dni}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-1.5">
                      <MdCalendarToday className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{formatDateTime(xray.uploaded_at)}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-600"></div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      xray.is_analyzed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {xray.is_analyzed ? '✓ Analizada' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-all"
                aria-label="Cerrar visor"
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body - Split View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Image Viewer - Left Side */}
            <div className="flex-1 flex flex-col bg-black">
              {/* Toolbar de Controles Profesional */}
              <div className="bg-slate-800/50 px-4 py-2.5 border-b border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  {/* Herramientas de Interacción */}
                  <div className="flex items-center gap-2">
                    {/* Tool Selection */}
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={() => setActiveTool(activeTool === 'pan' ? null : 'pan')}
                        className={`p-2 rounded transition-colors relative ${
                          activeTool === 'pan' 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                        title="Pan (Arrastrar) - Click Izquierdo o Click Central"
                      >
                        <MdPanTool className="w-5 h-5" />
                        {isPanning && activeTool === 'pan' && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTool(activeTool === 'window' ? null : 'window')}
                        className={`p-2 rounded transition-colors relative ${
                          activeTool === 'window' 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                        title="Window/Level - Ajustar Brillo/Contraste"
                      >
                        <MdTune className="w-5 h-5" />
                        {isAdjustingWindow && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </button>
                    </div>

                    <div className="w-px h-8 bg-slate-600"></div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={onZoomOut}
                        disabled={imageZoom <= MIN_ZOOM}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Alejar (Zoom Out)"
                      >
                        <MdZoomOut className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-bold text-slate-300 min-w-[3.5rem] text-center px-2">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <button
                        onClick={onZoomIn}
                        disabled={imageZoom >= MAX_ZOOM}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Acercar (Zoom In)"
                      >
                        <MdZoomIn className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="w-px h-8 bg-slate-600"></div>

                    {/* Rotation Controls */}
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={handleRotateLeft}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                        title="Rotar Izquierda"
                      >
                        <MdRotateLeft className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-bold text-slate-300 min-w-[2.5rem] text-center px-1">
                        {rotation}°
                      </span>
                      <button
                        onClick={handleRotateRight}
                        className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                        title="Rotar Derecha"
                      >
                        <MdRotateRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="w-px h-8 bg-slate-600"></div>

                    {/* Invert Colors Toggle */}
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

                    {/* Reset Button */}
                    <button
                      onClick={handleReset}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                      title="Restablecer Vista"
                    >
                      <MdRefresh className="w-4 h-4" />
                      Reset
                    </button>

                    {/* Help Button */}
                    <button
                      onClick={() => setShowHelp(!showHelp)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        showHelp 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      title="Ayuda de Controles"
                    >
                      <MdHelp className="w-4 h-4" />
                      Ayuda
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title={isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                  >
                    {isFullscreen ? (
                      <MdFullscreenExit className="w-5 h-5" />
                    ) : (
                      <MdFullscreen className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Barra de Información - Fija debajo de las herramientas */}
              <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Información de la imagen */}
                  <div className="flex items-center gap-2">
                    <MdImage className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-300">ID: #{xray.id}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-600"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{getQualityLabel(xray.quality)}</span>
                    <span>•</span>
                    <span>{getViewPositionLabel(xray.view_position)}</span>
                  </div>
                </div>

                {/* Indicador de Diagnóstico */}
                {xray.has_diagnosis && (
                  <div className="flex items-center gap-1.5 bg-blue-600/20 px-2.5 py-1 rounded-lg border border-blue-500/30">
                    <MdInfo className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-300">Con Diagnóstico</span>
                  </div>
                )}
              </div>

              {/* Panel de Ayuda Flotante */}
              {showHelp && (
                <div className="absolute top-32 left-6 z-10 bg-slate-800/95 backdrop-blur-sm border-2 border-blue-500/50 rounded-xl p-5 shadow-2xl max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <MdHelp className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Controles del Visor</h3>
                    </div>
                    <button
                      onClick={() => setShowHelp(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <MdClose className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <MdPanTool className="w-4 h-4" />
                        Pan (Arrastrar)
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1 ml-6">
                        <li>• Click central del mouse y arrastrar (siempre activo)</li>
                        <li>• Activar herramienta Pan + click izquierdo y arrastrar</li>
                      </ul>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <MdZoomIn className="w-4 h-4" />
                        Zoom
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1 ml-6">
                        <li>• Ctrl + Rueda del mouse</li>
                        <li>• Botones +/- en la barra de herramientas</li>
                      </ul>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <MdTune className="w-4 h-4" />
                        Window/Level
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1 ml-6">
                        <li>• Activar herramienta Window/Level</li>
                        <li>• Click izquierdo y arrastrar</li>
                        <li>• Horizontal: ajusta contraste (width)</li>
                        <li>• Vertical: ajusta brillo (level)</li>
                      </ul>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <MdRotateRight className="w-4 h-4" />
                        Rotación
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1 ml-6">
                        <li>• Usar botones de rotación en la barra de herramientas</li>
                      </ul>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-200">
                        <strong>Tip:</strong> El click central del mouse siempre funciona para Pan sin necesidad de activar la herramienta.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Container with Professional Display */}
              <div 
                className="flex-1 flex items-center justify-center p-6 bg-black select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleContextMenu}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  cursor: isPanning 
                    ? 'grabbing' 
                    : isAdjustingWindow 
                    ? 'crosshair' 
                    : activeTool === 'pan' 
                    ? 'grab' 
                    : activeTool === 'window' 
                    ? 'crosshair' 
                    : 'default',
                  overflow: 'hidden',
                  touchAction: 'none'
                }}
              >
                {xray.image_url ? (
                  <div 
                    className="relative max-w-full max-h-full"
                    style={{
                      transform: `scale(${imageZoom}) rotate(${rotation}deg) translate(${panOffset.x / imageZoom}px, ${panOffset.y / imageZoom}px)`,
                      filter: invertColors ? 'invert(1)' : 'none',
                      transition: isPanning || isAdjustingWindow ? 'none' : 'transform 0.2s ease-out',
                      willChange: isPanning || isAdjustingWindow ? 'transform' : 'auto',
                    }}
                  >
                    {/* Loader durante procesamiento DICOM */}
                    {isProcessingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-3"></div>
                          <p className="text-emerald-400 text-sm font-medium">Procesando imagen DICOM...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dicomCanvas || xray.image_url}
                      alt={`Radiografía ${xray.patient_dni}`}
                      className="object-contain max-w-[800px] max-h-[800px] pointer-events-none"
                      style={{
                        filter: `brightness(${windowLevel.center}%) contrast(${windowLevel.width}%)`,
                      }}
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-slate-800 rounded-full p-8 mb-4">
                      <MdImage className="h-20 w-20 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium">
                      No hay imagen disponible
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information Panel - Right Side */}
            <div className="w-96 bg-slate-800 border-l border-slate-700 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Header del Panel */}
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
                  <MdInfo className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    {analysisResult ? 'Resultados del Análisis' : 'Información Médica'}
                  </h3>
                </div>

                {/* Estado de Análisis en Proceso */}
                {isAnalyzing && (
                  <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-xl p-6 animate-pulse">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <MdScience className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-blue-200 mb-2">
                          Analizando Radiografía
                        </h4>
                        <p className="text-sm text-blue-300">
                          La IA está procesando la imagen...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error de Análisis */}
                {analysisError && (
                  <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <MdWarning className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-red-300 mb-2">
                          Error en el Análisis
                        </h4>
                        <p className="text-sm text-red-200">
                          {analysisError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultados del Análisis */}
                {analysisResult && !isAnalyzing && (
                  <div className="space-y-4">
                    {/* Diagnóstico Principal */}
                    <div className={`${analysisResult.is_pneumonia ? 'bg-gradient-to-br from-red-900/30 to-orange-900/20 border-2 border-red-500/50' : 'bg-gradient-to-br from-emerald-900/30 to-green-900/20 border-2 border-emerald-500/50'} rounded-xl p-5`}>
                      <div className="flex items-start gap-3">
                        <div className={`${analysisResult.is_pneumonia ? 'bg-red-500' : 'bg-emerald-500'} p-2.5 rounded-lg shadow-lg`}>
                          {analysisResult.is_pneumonia ? <MdLocalHospital className="h-6 w-6 text-white" /> : <MdCheckCircle className="h-6 w-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Diagnóstico
                          </span>
                          <h3 className={`text-2xl font-bold mb-2 ${analysisResult.is_pneumonia ? 'text-red-200' : 'text-emerald-200'}`}>
                            {getPneumoniaType(analysisResult.predicted_class)}
                          </h3>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {analysisResult.is_pneumonia 
                              ? 'Patrón radiológico compatible con neumonía detectado.'
                              : 'No se detectaron signos de neumonía.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nivel de Confianza */}
                    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-500/20 p-1.5 rounded-lg border border-purple-500/30">
                            <MdTrendingUp className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Confianza</h4>
                            <p className="text-xs text-slate-400">Precisión IA</p>
                          </div>
                        </div>
                        <span className={`text-2xl font-bold ${
                          analysisResult.confidence_percentage >= 75 ? 'text-emerald-400' : 
                          analysisResult.confidence_percentage >= 60 ? 'text-amber-400' : 'text-orange-400'
                        }`}>
                          {Math.round(analysisResult.confidence_percentage)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            analysisResult.confidence_percentage >= 75 ? 'bg-emerald-500' : 
                            analysisResult.confidence_percentage >= 60 ? 'bg-amber-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${analysisResult.confidence_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Clasificación Detallada */}
                    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                        Clasificación
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-slate-300">Clase:</span>
                          <span className={`text-xs font-bold ${analysisResult.is_pneumonia ? 'text-red-300' : 'text-emerald-300'}`}>
                            {analysisResult.predicted_class}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-slate-300">Estado:</span>
                          <span className={`text-xs font-bold ${analysisResult.is_pneumonia ? 'text-red-300' : 'text-emerald-300'}`}>
                            {analysisResult.is_pneumonia ? 'Positivo' : 'Negativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información sobre tipo de Neumonía */}
                    {analysisResult.is_pneumonia && (
                      <div className="bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-3">
                        <h4 className="text-xs font-bold text-blue-300 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                          {getPneumoniaType(analysisResult.predicted_class)}
                        </h4>
                        <p className="text-xs text-blue-200 leading-relaxed">
                          {getPneumoniaType(analysisResult.predicted_class).includes('Bacteriana') && (
                            'Requiere evaluación médica para tratamiento antibiótico.'
                          )}
                          {getPneumoniaType(analysisResult.predicted_class).includes('Viral') && (
                            'Requiere evaluación médica para tratamiento apropiado.'
                          )}
                        </p>
                      </div>
                    )}

                    {/* Advertencia Médica */}
                    <div className="bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg p-3">
                      <div className="flex items-start gap-2">
                        <MdWarning className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wide">
                            Nota Importante
                          </p>
                          <p className="text-xs text-amber-200 leading-relaxed">
                            {analysisResult.is_pneumonia 
                              ? 'Diagnóstico preliminar. Requiere confirmación médica.'
                              : 'Se recomienda evaluación médica profesional.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información Normal (cuando no hay análisis) */}
                {!isAnalyzing && !analysisResult && (
                  <>
                    {/* Clinical Data Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Datos Clínicos
                      </h4>

                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase">
                            Calidad de Imagen
                          </p>
                          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                            xray.quality === 'excellent' ? 'bg-green-500/20 text-green-400' :
                            xray.quality === 'good' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {getQualityLabel(xray.quality)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                          Posición de Vista
                        </p>
                        <p className="text-base font-bold text-white">
                          {getViewPositionLabel(xray.view_position)}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                          Estado de Análisis
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              xray.is_analyzed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          ></div>
                          <p
                            className={`text-sm font-bold ${
                              xray.is_analyzed ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {xray.is_analyzed ? 'Completado' : 'Pendiente de Análisis'}
                          </p>
                        </div>
                      </div>

                      {xray.has_diagnosis && (
                        <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MdInfo className="w-4 h-4 text-blue-400" />
                            <p className="text-xs font-semibold text-blue-300 uppercase">
                              Diagnóstico Disponible
                            </p>
                          </div>
                          <p className="text-sm text-blue-200">
                            Este estudio cuenta con diagnóstico registrado en el sistema
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Observations */}
                    {xray.description && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Observaciones Médicas
                        </h4>
                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {xray.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Technical Info - Estilo DICOM */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Metadatos del Estudio
                      </h4>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                          <span className="text-xs text-slate-400">Modalidad:</span>
                          <span className="text-sm text-white font-mono font-semibold">
                            CR - Radiografía
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                          <span className="text-xs text-slate-400">Región Anatómica:</span>
                          <span className="text-sm text-white font-mono font-semibold">
                            CHEST
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                          <span className="text-xs text-slate-400">ID Estudio:</span>
                          <span className="text-sm text-emerald-400 font-mono font-semibold">
                            #{xray.id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                          <span className="text-xs text-slate-400">Fecha de Adquisición:</span>
                          <span className="text-sm text-white font-semibold">
                            {formatDate(xray.uploaded_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Hora:</span>
                          <span className="text-sm text-white font-semibold">
                            {new Date(xray.uploaded_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Tool Info */}
                {activeTool && (
                  <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                    {activeTool === 'pan' && <MdPanTool className="w-4 h-4 text-blue-400" />}
                    {activeTool === 'window' && <MdTune className="w-4 h-4 text-blue-400" />}
                    <span className="text-xs font-bold text-blue-300">
                      {activeTool === 'pan' && 'Pan (Arrastrar)'}
                      {activeTool === 'window' && 'Window/Level'}
                    </span>
                  </div>
                )}
                
                <span className="text-xs text-slate-400">
                  Zoom: <span className="font-bold text-white">{Math.round(imageZoom * 100)}%</span>
                </span>
                <span className="text-xs text-slate-400">
                  Rotación: <span className="font-bold text-white">{rotation}°</span>
                </span>
                {panOffset.x !== 0 || panOffset.y !== 0 ? (
                  <span className="text-xs text-slate-400">
                    Pan: <span className="font-bold text-white">X:{Math.round(panOffset.x)} Y:{Math.round(panOffset.y)}</span>
                  </span>
                ) : null}
                {activeTool === 'window' && (
                  <span className="text-xs text-slate-400">
                    W/L: <span className="font-bold text-white">{Math.round(windowLevel.width)}/{Math.round(windowLevel.center)}</span>
                  </span>
                )}
                {invertColors && (
                  <span className="text-xs text-blue-400 font-semibold">
                    • Colores invertidos
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Botón de Análisis con IA - Solo para radiólogos */}
                {canAnalyze && !xray.has_diagnosis && !analysisResult && (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold flex items-center gap-2.5 transition-all shadow-lg hover:shadow-emerald-500/50 border border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Analizar con Inteligencia Artificial (Solo Radiólogos)"
                  >
                    <MdScience className="w-5 h-5" />
                    {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                  </button>
                )}

                {xray.image_url && (
                  <a
                    href={xray.image_url}
                    download={`radiografia_${xray.patient_name}_${xray.id}.jpg`}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors border border-slate-600"
                  >
                    <MdDownload className="w-4 h-4" />
                    Descargar
                  </a>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
