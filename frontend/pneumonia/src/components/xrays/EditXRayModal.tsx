/**
 * Modal para editar radiografía existente
 */
'use client';

import React, { useState, useEffect } from 'react';
import { XRayImage, XRayFormData, QUALITY_CHOICES, VIEW_POSITION_CHOICES } from '@/types/xray';
import { 
  MdClose,
  MdSave,
  MdCloudUpload,
  MdWarning,
  MdPerson,
  MdEdit,
  MdCalendarToday,
  MdImage,
  MdZoomIn,
  MdZoomOut,
  MdRotateRight
} from 'react-icons/md';

interface EditXRayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: XRayFormData) => void;
  xray: XRayImage | null;
  isLoading?: boolean;
}

export const EditXRayModal: React.FC<EditXRayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  xray,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<XRayFormData>({
    patient: '',
    image: null,
    description: '',
    quality: 'good',
    view_position: 'PA',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageChanged, setImageChanged] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  useEffect(() => {
    if (xray && isOpen) {
      setFormData({
        patient: xray.patient,
        image: null,
        description: xray.description || '',
        quality: xray.quality,
        view_position: xray.view_position,
      });
      if (xray.image_url) {
        setImagePreview(xray.image_url);
      }
      setImageChanged(false);
      setErrors({});
    }
  }, [xray, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      setImageChanged(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient) {
      newErrors.patient = 'El paciente es requerido';
    }

    if (!formData.quality) {
      newErrors.quality = 'La calidad es requerida';
    }

    if (!formData.view_position) {
      newErrors.view_position = 'La posición es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    onSubmit(formData);
  };

  if (!isOpen || !xray) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
          onClick={onClose}
        ></div>

        {/* Modal - Estilo DICOM Viewer */}
        <div className="relative bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-slate-700">
          {/* Header - Estilo DICOM */}
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Información del Paciente */}
              <div className="flex items-center gap-4">
                <div className="bg-orange-600 p-2.5 rounded-lg">
                  <MdEdit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      EDITAR RADIOGRAFÍA DE TÓRAX
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
                      <span className="text-slate-300">{new Date(xray.uploaded_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-all"
                disabled={isLoading}
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body - Layout Tipo DICOM */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* Panel Izquierdo - Visor de Imagen */}
              <div className="flex-1 bg-black border-r border-slate-700 flex flex-col">
                {/* Toolbar de visualización */}
                {imagePreview && (
                  <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageZoom(prev => Math.min(3, prev + 0.25))}
                      className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                      title="Acercar"
                    >
                      <MdZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.25))}
                      className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                      title="Alejar"
                    >
                      <MdZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                      className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                      title="Rotar"
                    >
                      <MdRotateRight className="w-5 h-5" />
                    </button>
                    <div className="flex-1"></div>
                    <span className="text-xs text-slate-400 font-mono">
                      Zoom: {Math.round(imageZoom * 100)}%
                    </span>
                    {imageChanged && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Imagen Modificada
                      </span>
                    )}
                  </div>
                )}

                {/* Área de visualización */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                  {imagePreview ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain transition-all duration-200"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                        }}
                      />

                      {/* Información de la imagen */}
                      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-600">
                        <div className="text-xs text-slate-300 space-y-1">
                          {formData.image ? (
                            <>
                              <div className="flex items-center gap-2">
                                <MdImage className="w-4 h-4 text-green-400" />
                                <span className="font-mono text-green-400">Nueva: {formData.image.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-400">
                                <span>{((formData.image.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>{formData.image.type}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <MdImage className="w-4 h-4 text-blue-400" />
                                <span className="font-mono">Imagen original</span>
                              </div>
                              <div className="text-slate-400">
                                Subida: {new Date(xray.uploaded_at).toLocaleDateString('es-ES')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-slate-500">
                      <p>No hay imagen disponible</p>
                    </div>
                  )}
                </div>

                {/* Cambiar Imagen */}
                <div className="bg-slate-800/50 border-t border-slate-700 p-4">
                    {/* La opción de subir imagen ha sido deshabilitada en modo edición */}
                </div>
              </div>

              {/* Panel Derecho - Formulario de Datos */}
              <div className="w-96 bg-slate-800 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Info del Paciente (Read-only) */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <MdPerson className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Paciente (No editable)</p>
                        <p className="text-base font-bold text-white">{xray.patient_name}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded px-3 py-2 border border-slate-600">
                      <div className="text-xs text-slate-400">DNI:</div>
                      <div className="text-sm text-emerald-400 font-mono font-semibold">{xray.patient_dni}</div>
                    </div>
                  </div>

                  {/* Calidad de Imagen */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Calidad de Imagen <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="quality"
                      value={formData.quality}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white bg-slate-700 ${
                        errors.quality ? 'border-red-500' : 'border-slate-600'
                      }`}
                    >
                      {QUALITY_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                    {errors.quality && (
                      <p className="mt-1.5 text-sm text-red-300 flex items-center gap-1">
                        <MdWarning className="h-4 w-4" />
                        {errors.quality}
                      </p>
                    )}
                  </div>

                  {/* Posición de Vista */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Posición de Vista <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="view_position"
                      value={formData.view_position}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white bg-slate-700 ${
                        errors.view_position ? 'border-red-500' : 'border-slate-600'
                      }`}
                    >
                      {VIEW_POSITION_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                    {errors.view_position && (
                      <p className="mt-1.5 text-sm text-red-300 flex items-center gap-1">
                        <MdWarning className="h-4 w-4" />
                        {errors.view_position}
                      </p>
                    )}
                  </div>

                  {/* Descripción / Notas Clínicas */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Notas Clínicas
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Observaciones, hallazgos, indicaciones médicas..."
                      className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-500 text-white bg-slate-700 resize-none"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Información adicional */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Información del Estudio
                    </h4>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Modalidad:</span>
                        <span className="text-slate-200 font-mono">CR - Radiografía Digital</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Región Anatómica:</span>
                        <span className="text-slate-200 font-mono">CHEST - Tórax</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha Original:</span>
                        <span className="text-slate-200 font-mono">
                          {new Date(xray.uploaded_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ID Estudio:</span>
                        <span className="text-slate-200 font-mono">#{xray.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Botones */}
                <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 text-sm font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-all"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <MdSave className="h-5 w-5" />
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
