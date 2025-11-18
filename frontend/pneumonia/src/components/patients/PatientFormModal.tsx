/**
 * Modal para crear/editar pacientes
 * Versión mejorada con iconos y mejor UX
 */
'use client';

import React, { useEffect } from 'react';
import { Patient, PatientFormData, GENDER_CHOICES, BLOOD_TYPES } from '@/types/patient';
import { 
  MdPerson, 
  MdBadge, 
  MdCake, 
  MdPhone, 
  MdEmail, 
  MdHome,
  MdLocalHospital,
  MdWarning,
  MdClose,
  MdSave,
  MdCancel
} from 'react-icons/md';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => void;
  patient?: Patient | null;
  isLoading?: boolean;
  backendErrors?: Record<string, string[]>;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  isLoading = false,
  backendErrors = {},
}) => {
  const getInitialFormData = (patient?: Patient | null): PatientFormData => {
    if (patient) {
      return {
        dni: patient.dni,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies || '',
        medical_history: patient.medical_history || '',
        is_active: patient.is_active,
      };
    }
    return {
      dni: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'M',
      phone: '',
      email: '',
      address: '',
      blood_type: '',
      allergies: '',
      medical_history: '',
      is_active: true,
    };
  };

  const [formData, setFormData] = React.useState<PatientFormData>(() => getInitialFormData(patient));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(patient));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patient?.id]);

  // Mostrar errores del backend en los campos
  useEffect(() => {
    if (backendErrors && Object.keys(backendErrors).length > 0) {
      // Convierte el array de errores en string para mostrar
      const newErrors: Record<string, string> = {};
      Object.entries(backendErrors).forEach(([key, value]) => {
        newErrors[key] = Array.isArray(value) ? value.join(' ') : String(value);
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  }, [backendErrors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validación DNI/Cédula
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI/Cédula es requerido';
    } else if (!/^\d{10}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI/Cédula debe tener exactamente 10 dígitos';
    } else if (!validateEcuadorianCedula(formData.dni)) {
      newErrors.dni = 'El DNI/Cédula no es válido (checksum incorrecto)';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'La fecha de nacimiento es requerida';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\d{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Teléfono inválido (7-15 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para validar cédula ecuatoriana (módulo 11)
  const validateEcuadorianCedula = (cedula: string): boolean => {
    if (!cedula || cedula.length !== 10) return false;
    if (!/^\d{10}$/.test(cedula)) return false;

    // Extraer dígitos de provincia (primeros 2)
    const province = parseInt(cedula.substring(0, 2), 10);
    if (province < 1 || province > 24) return false;

    // Algoritmo módulo 11
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      let digit = parseInt(cedula.charAt(i), 10) * coefficients[i];
      if (digit > 9) digit -= 9;
      sum += digit;
    }

    const remainder = sum % 10;
    const verifierDigit = remainder === 0 ? 0 : 10 - remainder;

    return verifierDigit === parseInt(cedula.charAt(9), 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay con desenfoque */}
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-sm transition-all"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MdPerson className="h-6 w-6 text-blue-600" />
              {patient ? 'Editar Paciente' : 'Nuevo Paciente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
              disabled={isLoading}
            >
              <MdClose className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI / Cédula <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdBadge className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="Ej: 1234567890"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium ${
                        errors.dni ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {/* Validación de formato en tiempo real */}
                    {formData.dni && !errors.dni && /^\d{10}$/.test(formData.dni) && (
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.dni ? (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.dni}
                    </p>
                  ) : formData.dni && /^\d{10}$/.test(formData.dni) ? (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Cédula válida
                    </p>
                  ) : formData.dni ? (
                    <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      La cédula debe tener exactamente 10 dígitos
                    </p>
                  ) : null}
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdPerson className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Ej: Juan Carlos"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.first_name}
                    </p>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdPerson className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Ej: Pérez García"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.last_name}
                    </p>
                  )}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdCake className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${
                        errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                {/* Género */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar género...</option>
                    {GENDER_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Sangre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Sangre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdLocalHospital className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                      disabled={isLoading}
                    >
                      <option value="">Seleccionar tipo...</option>
                      {BLOOD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ej: 3001234567"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdEmail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Ej: paciente@ejemplo.com"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <MdWarning className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MdHome className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Alergias */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MdWarning className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Ej: Alergia a la penicilina, polen..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium resize-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Historial Médico */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historial Médico
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MdLocalHospital className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ej: Diabetes tipo 2, hipertensión controlada..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium resize-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Estado Activo */}
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">Paciente activo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                disabled={isLoading}
              >
                <MdCancel className="h-5 w-5" />
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                disabled={isLoading}
              >
                <MdSave className="h-5 w-5" />
                {isLoading ? 'Guardando...' : patient ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
