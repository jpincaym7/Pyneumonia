/**
 * Componente de formulario de información personal
 */

import React from 'react';
import { MdPerson, MdEmail, MdBadge, MdVerifiedUser, MdAccountCircle } from 'react-icons/md';

interface PersonalInfoFormProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
  };
  username: string;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  username,
  isEditing,
  onInputChange,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <MdAccountCircle className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
      </div>

      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre
          </label>
          <div className="relative">
            <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={onInputChange}
              disabled={!isEditing}
              className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                isEditing 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed'
              }`}
              placeholder="Ingrese su nombre"
            />
          </div>
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Apellido
          </label>
          <div className="relative">
            <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={onInputChange}
              disabled={!isEditing}
              className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                isEditing 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed'
              }`}
              placeholder="Ingrese su apellido"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              disabled={!isEditing}
              className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                isEditing 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed'
              }`}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        {/* Username (solo lectura) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de Usuario
          </label>
          <div className="relative">
            <MdVerifiedUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={username}
              disabled
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            El nombre de usuario no se puede modificar
          </p>
        </div>
      </div>
    </div>
  );
};
