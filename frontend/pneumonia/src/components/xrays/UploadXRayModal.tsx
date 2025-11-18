/**
 * Modal para subir radiografía - Rediseño enfocado en órdenes médicas
 * Sin selector de paciente: el paciente viene de la orden seleccionada
 * Diseño limpio y profesional
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { XRayFormData, QUALITY_CHOICES, VIEW_POSITION_CHOICES } from '@/types/xray';
import type { MedicalOrder } from '@/types/medical-order';
import { 
  MdClose,
  MdCloudUpload,
  MdWarning,
  MdZoomIn,
  MdZoomOut,
  MdRotateRight,
  MdRefresh,
  MdBrightness6,
  MdContrast,
  MdInvertColors,
  MdEdit
} from 'react-icons/md';

interface UploadXRayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: XRayFormData) => void;
  isLoading?: boolean;
  medicalOrder: MedicalOrder | null;
}

export const UploadXRayModal: React.FC<UploadXRayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  medicalOrder,
}) => {
  const [formData, setFormData] = useState<XRayFormData>({
    patient: medicalOrder?.patient || '',
    image: null,
    description: '',
    quality: 'good',
    view_position: 'PA',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);

  // Sincronizar paciente de la orden
  useEffect(() => {
    if (isOpen && medicalOrder?.patient) {
      setFormData(prev => ({ ...prev, patient: medicalOrder.patient }));
    }
  }, [isOpen, medicalOrder]);

  const resetForm = useCallback(() => {
    setFormData({
      patient: medicalOrder?.patient || '',
      image: null,
      description: '',
      quality: 'good',
      view_position: 'PA',
    });
    setImagePreview(null);
    setErrors({});
    setImageZoom(1);
    setImageRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  }, [medicalOrder?.patient]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const processFile = useCallback((file: File | undefined) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'El archivo debe ser JPG, JPEG o PNG' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'El archivo no debe superar los 10MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setErrors(prev => ({ ...prev, image: '' }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  }, [processFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
    setImageZoom(1);
    setImageRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  }, []);

  const handleResetView = useCallback(() => {
    setImageZoom(1);
    setImageRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.patient) newErrors.patient = 'Debes asociar la radiografía a un paciente';
    if (!formData.image) newErrors.image = 'Debes cargar una imagen de radiografía';
    if (!formData.quality) newErrors.quality = 'Debes seleccionar la calidad';
    if (!formData.view_position) newErrors.view_position = 'Debes seleccionar la posición';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
    resetForm();
  };

  if (!isOpen) return null;

  if (!medicalOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sin Orden Seleccionada</h2>
          <p className="text-gray-600 mb-6">Selecciona una orden médica antes de subir una radiografía.</p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header - Orden Médica */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                Subir Radiografía
              </h1>
              <div className="flex items-center gap-6 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Paciente:</span>
                  <span className="font-semibold text-white">{medicalOrder.patient_name}</span>
                </div>
                <div className="h-4 w-px bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">DNI:</span>
                  <span className="font-mono text-blue-300">{medicalOrder.patient_dni}</span>
                </div>
                <div className="h-4 w-px bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <MdEdit className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Razón:</span>
                  <span className="text-white truncate">{medicalOrder.reason}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isLoading}
              aria-label="Close"
            >
              <MdClose className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body - Split Layout */}
        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          {/* Left Panel - Image Upload & Preview */}
          <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
            
            {/* Toolbar */}
            {imagePreview && (
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setImageZoom(prev => Math.min(5, prev + 0.5))}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
                  title="Zoom In"
                >
                  <MdZoomIn className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.5))}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
                  title="Zoom Out"
                >
                  <MdZoomOut className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
                  title="Rotate"
                >
                  <MdRotateRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setInvert(!invert)}
                  className={`p-1.5 rounded transition-colors ${invert ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                  title="Invert"
                >
                  <MdInvertColors className="w-5 h-5" />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <div className="flex items-center gap-2">
                  <MdBrightness6 className="w-4 h-4 text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-20 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-gray-600 font-mono w-10">{brightness}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdContrast className="w-4 h-4 text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-20 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-gray-600 font-mono w-10">{contrast}%</span>
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={handleResetView}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
                  title="Reset"
                >
                  <MdRefresh className="w-5 h-5" />
                </button>
                <div className="flex-1" />
                <div className="text-xs text-gray-600 font-mono">
                  ZOOM: {(imageZoom * 100).toFixed(0)}%
                </div>
              </div>
            )}

            {/* Viewer Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
              {imagePreview ? (
                <>
                  <div 
                    className="relative transition-transform duration-150"
                    style={{
                      transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
                    }}
                  >
                    <Image
                      src={imagePreview}
                      alt="X-Ray Preview"
                      width={800}
                      height={800}
                      className="max-w-full max-h-full object-contain select-none"
                      priority
                      draggable={false}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    Cambiar imagen
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <input
                    type="file"
                    id="xray-upload"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  <label
                    htmlFor="xray-upload"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : errors.image 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <MdCloudUpload className={`w-20 h-20 mb-4 ${errors.image ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className="text-lg font-semibold text-gray-800 mb-2">
                      Arrastra la radiografía aquí
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      O haz clic para seleccionar (JPG, JPEG, PNG - Máx 10MB)
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Error Bar */}
            {errors.image && (
              <div className="bg-red-50 border-t border-red-200 px-6 py-3">
                <p className="text-sm text-red-700 flex items-center gap-2 font-medium">
                  <MdWarning className="h-5 w-5" />
                  {errors.image}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Form */}
          <aside className="w-80 bg-white flex flex-col border-l border-gray-200">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Calidad de imagen */}
              <div>
                <label htmlFor="quality" className="block text-sm font-semibold text-gray-700 mb-2">
                  Calidad de Imagen
                </label>
                <select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.quality ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  {QUALITY_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.quality && (
                  <p className="mt-1 text-sm text-red-600">{errors.quality}</p>
                )}
              </div>

              {/* Posición de vista */}
              <div>
                <label htmlFor="view" className="block text-sm font-semibold text-gray-700 mb-2">
                  Posición de Vista
                </label>
                <select
                  id="view"
                  name="view_position"
                  value={formData.view_position}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.view_position ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  {VIEW_POSITION_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.view_position && (
                  <p className="mt-1 text-sm text-red-600">{errors.view_position}</p>
                )}
              </div>

              {/* Notas clínicas */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas Médicas (Opcional)
                </label>
                <textarea
                  id="notes"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Añade observaciones médicas o técnicas..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  disabled={isLoading}
                />
              </div>

              {/* Información de la orden */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Información de la Orden
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">ID Orden:</span>
                    <span className="font-mono text-blue-900">{medicalOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Estado:</span>
                    <span className="font-semibold text-blue-900">{medicalOrder.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Prioridad:</span>
                    <span className="font-semibold text-blue-900">{medicalOrder.priority}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading || !formData.image}
              >
                <MdCloudUpload className="h-5 w-5" />
                {isLoading ? 'Subiendo...' : 'Subir Radiografía'}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};
