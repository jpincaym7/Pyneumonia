/**
 * Modal para subir/editar radiografías
 * Versión mejorada con iconos y preview de imagen
 */
'use client';

import React, { useState, useEffect } from 'react';
import { XRayImage, XRayFormData, QUALITY_CHOICES, VIEW_POSITION_CHOICES } from '@/types/xray';
import { Patient } from '@/types/patient';
import { 
  MdClose,
  MdSave,
  MdCancel,
  MdImage,
  MdCloudUpload,
  MdWarning,
  MdPerson
} from 'react-icons/md';

interface XRayFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: XRayFormData) => void;
  xray?: XRayImage | null;
  patients: Patient[];
  isLoading?: boolean;
}

export const XRayFormModal: React.FC<XRayFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  xray,
  patients,
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

  useEffect(() => {
    if (xray) {
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
    } else {
      setFormData({
        patient: '',
        image: null,
        description: '',
        quality: 'good',
        view_position: 'PA',
      });
      setImagePreview(null);
    }
    setErrors({});
  }, [xray, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'El archivo debe ser JPG, JPEG o PNG' }));
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'El archivo no debe superar los 10MB' }));
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Generar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear error
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

    if (!xray && !formData.image) {
      newErrors.image = 'La imagen es requerida';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <MdImage className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {xray ? 'Editar Radiografía' : 'Nueva Radiografía'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                disabled={isLoading}
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="space-y-6">
                {/* Paciente */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MdPerson className="h-5 w-5 text-blue-600" />
                    Paciente <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="patient"
                      value={formData.patient}
                      onChange={handleChange}
                      disabled={isLoading || !!xray}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium transition-all ${
                        errors.patient ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      } ${xray ? 'bg-gray-100' : ''}`}
                    >
                      <option value="">Seleccionar paciente...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.dni} - {patient.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.patient && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                      <MdWarning className="h-4 w-4" />
                      {errors.patient}
                    </p>
                  )}
                </div>

                {/* Imagen */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MdImage className="h-5 w-5 text-blue-600" />
                    Imagen de Radiografía {!xray && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {/* Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <div className="relative w-full h-72 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border-4 border-gray-300 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            ✓ Imagen cargada
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center w-full h-40 border-3 border-dashed rounded-xl cursor-pointer transition-all ${
                        errors.image 
                          ? 'border-red-500 bg-red-50 hover:bg-red-100' 
                          : 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <MdCloudUpload className={`w-14 h-14 mb-4 ${errors.image ? 'text-red-400' : 'text-blue-500'}`} />
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          <span className="text-blue-600">Click para subir</span> o arrastra la imagen
                        </p>
                        <p className="text-xs text-gray-500 font-medium">JPG, JPEG o PNG (MAX. 10MB)</p>
                      </div>
                    </label>
                  </div>
                  {errors.image && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                      <MdWarning className="h-4 w-4" />
                      {errors.image}
                    </p>
                  )}
                </div>

                {/* Calidad y Posición */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calidad */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Calidad de Imagen <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="quality"
                      value={formData.quality}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium transition-all ${
                        errors.quality ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      {QUALITY_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                    {errors.quality && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                        <MdWarning className="h-4 w-4" />
                        {errors.quality}
                      </p>
                    )}
                  </div>

                  {/* Posición */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Posición de Vista <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="view_position"
                      value={formData.view_position}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium transition-all ${
                        errors.view_position ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      {VIEW_POSITION_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                    {errors.view_position && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                        <MdWarning className="h-4 w-4" />
                        {errors.view_position}
                      </p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Descripción / Notas Clínicas
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ej: Radiografía de control post-tratamiento. Paciente presenta mejora en los síntomas..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900 font-medium resize-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                <MdCancel className="h-5 w-5" />
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                disabled={isLoading}
              >
                <MdSave className="h-5 w-5" />
                {isLoading ? 'Guardando...' : xray ? 'Actualizar' : 'Subir Radiografía'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
