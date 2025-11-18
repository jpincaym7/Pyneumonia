/**
 * Modal de Edición de Perfil
 * Diseño moderno con gradiente y todos los campos del usuario
 */

import React, { useState, useEffect } from 'react';
import { 
  MdClose, 
  MdPerson, 
  MdEmail, 
  MdBadge, 
  MdSave,
  MdPhone,
  MdLocationOn,
  MdCancel,
  MdWarning
} from 'react-icons/md';
import { User } from '@/types/auth';
import { apiClient } from '@/lib/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateSuccess: (userData: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
}) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    dni: user.dni || '',
    phone: user.phone || '',
    direction: user.direction || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        dni: user.dni || '',
        phone: user.phone || '',
        direction: user.direction || '',
      });
      setError('');
      setErrors({});
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.dni && !/^\d{8,13}$/.test(formData.dni.replace(/\s/g, ''))) {
      newErrors.dni = 'Cédula/RUC inválido (8-13 dígitos)';
    }

    if (formData.phone && !/^\d{7,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Teléfono inválido (7-15 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      interface ApiResponse {
        data: {
          first_name: string;
          last_name: string;
          email: string;
          dni?: string;
          phone?: string;
          direction?: string;
          full_name?: string;
        };
      }

      const response = await apiClient.patch('/security/auth/profile/', formData) as ApiResponse;
      
      if (response.data) {
        onUpdateSuccess({
          ...response.data,
          full_name: `${response.data.first_name} ${response.data.last_name}`
        });
        onClose();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      setError(error.response?.data?.error || error.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeInUp">
        {/* Header Tipo Documento Oficial */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <MdPerson className="h-7 w-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">Formulario de Actualización</h2>
              <p className="text-sm text-blue-100">Datos Personales del Usuario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
            disabled={isSaving}
          >
            <MdClose className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Body - Scrollable con estilo CV */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scroll">
          <div className="p-8">
            {/* Error general */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm animate-shake flex items-start gap-3">
                <MdWarning className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Sección: Información Personal */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <MdPerson className="w-6 h-6 text-blue-600" />
                Información Personal
              </h3>
              
              <table className="w-full border-collapse">
                <tbody>
                  {/* Nombre */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 w-1/3 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdPerson className="w-4 h-4 text-blue-600" />
                        Nombres <span className="text-red-500">*</span>
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 text-gray-900 bg-white border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                          errors.first_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingrese sus nombres"
                        disabled={isSaving}
                      />
                      {errors.first_name && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <MdWarning className="h-4 w-4" />
                          {errors.first_name}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Apellido */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdPerson className="w-4 h-4 text-blue-600" />
                        Apellidos <span className="text-red-500">*</span>
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 text-gray-900 bg-white border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                          errors.last_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingrese sus apellidos"
                        disabled={isSaving}
                      />
                      {errors.last_name && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <MdWarning className="h-4 w-4" />
                          {errors.last_name}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Cédula/RUC */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdBadge className="w-4 h-4 text-blue-600" />
                        Cédula / RUC
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleInputChange}
                        maxLength={13}
                        className={`w-full px-4 py-2.5 text-gray-900 bg-white border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                          errors.dni ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0123456789"
                        disabled={isSaving}
                      />
                      {errors.dni && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <MdWarning className="h-4 w-4" />
                          {errors.dni}
                        </p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sección: Información de Contacto */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <MdEmail className="w-6 h-6 text-blue-600" />
                Información de Contacto
              </h3>
              
              <table className="w-full border-collapse">
                <tbody>
                  {/* Email */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 w-1/3 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdEmail className="w-4 h-4 text-blue-600" />
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 text-gray-900 bg-white border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="usuario@ejemplo.com"
                        disabled={isSaving}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <MdWarning className="h-4 w-4" />
                          {errors.email}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Teléfono */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdPhone className="w-4 h-4 text-blue-600" />
                        Teléfono
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 text-gray-900 bg-white border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0987654321"
                        disabled={isSaving}
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <MdWarning className="h-4 w-4" />
                          {errors.phone}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Dirección */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 bg-gray-50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MdLocationOn className="w-4 h-4 text-blue-600" />
                        Dirección
                      </label>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        name="direction"
                        value={formData.direction}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="Av. Principal 123, Ciudad"
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Nota:</span> Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios. 
                Asegúrese de completar toda la información correctamente.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MdCancel className="h-5 w-5" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <MdSave className="h-5 w-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer tipo documento */}
        <div className="bg-gray-100 px-8 py-3 border-t border-gray-300">
          <p className="text-xs text-gray-600 text-center">
            Este formulario actualiza su información personal en el sistema. Los cambios serán efectivos inmediatamente.
          </p>
        </div>
      </div>
    </div>
  );
};
