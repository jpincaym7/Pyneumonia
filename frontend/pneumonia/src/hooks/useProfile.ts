/**
 * Hook personalizado para gestión de perfil de usuario
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { User } from '@/types/auth';

interface UseProfileReturn {
  isEditing: boolean;
  isSaving: boolean;
  error: string;
  success: string;
  formData: {
    first_name: string;
    last_name: string;
    email: string;
  };
  setIsEditing: (value: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<{
    first_name: string;
    last_name: string;
    email: string;
  }>>;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
  handleEditToggle: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (user: User | null, updateUser?: (userData: Partial<User>) => void) => Promise<void>;
}

export function useProfile(user: User | null): UseProfileReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición, restaurar valores originales
      setFormData({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
      });
      setError('');
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (
    currentUser: User | null,
    updateUser?: (userData: Partial<User>) => void
  ) => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await apiClient.patch('/auth/profile/', formData);
      
      if (response.data && updateUser) {
        updateUser({
          ...currentUser,
          ...response.data,
          full_name: `${response.data.first_name} ${response.data.last_name}`
        });
      }
      
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    isSaving,
    error,
    success,
    formData,
    setIsEditing,
    setFormData,
    setError,
    setSuccess,
    handleEditToggle,
    handleInputChange,
    handleSaveProfile,
  };
}
