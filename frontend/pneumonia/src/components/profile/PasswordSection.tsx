/**
 * Componente de cambio de contraseña
 */

import React from 'react';
import { MdLock, MdVisibility, MdVisibilityOff, MdSave } from 'react-icons/md';

interface PasswordSectionProps {
  isChangingPassword: boolean;
  isSaving: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  };
  onToggleChanging: () => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
}

export const PasswordSection: React.FC<PasswordSectionProps> = ({
  isChangingPassword,
  isSaving,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  passwordData,
  onToggleChanging,
  onPasswordChange,
  onSave,
  onCancel,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <MdLock className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
        </div>
        {!isChangingPassword && (
          <button
            onClick={onToggleChanging}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            Cambiar Contraseña
          </button>
        )}
      </div>

      {isChangingPassword ? (
        <div className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="current_password"
                value={passwordData.current_password}
                onChange={onPasswordChange}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Ingrese su contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="new_password"
                value={passwordData.new_password}
                onChange={onPasswordChange}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={onPasswordChange}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Repita la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdSave className="w-5 h-5" />
              {isSaving ? 'Guardando...' : 'Guardar Contraseña'}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <MdLock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            Tu contraseña está protegida y encriptada
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: Hace 30 días
          </p>
        </div>
      )}
    </div>
  );
};
