/**
 * Hook personalizado para gestión de cambio de contraseña
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface UsePasswordReturn {
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
  setIsChangingPassword: (value: boolean) => void;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChangePassword: (
    setError: (value: string) => void,
    setSuccess: (value: string) => void
  ) => Promise<void>;
  resetPasswordForm: () => void;
}

export function usePassword(): UsePasswordReturn {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetPasswordForm = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setIsChangingPassword(false);
  };

  const handleChangePassword = async (
    setError: (value: string) => void,
    setSuccess: (value: string) => void
  ) => {
    setError('');
    setSuccess('');

    // Validaciones
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setError('Todos los campos de contraseña son obligatorios');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSaving(true);

    try {
      await apiClient.post('/auth/change-password/', {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      setSuccess('Contraseña actualizada correctamente');
      resetPasswordForm();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; old_password?: string[] } } };
      setError(err.response?.data?.detail || err.response?.data?.old_password?.[0] || 'Error al cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isChangingPassword,
    isSaving,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    passwordData,
    setIsChangingPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    handlePasswordChange,
    handleChangePassword,
    resetPasswordForm,
  };
}
