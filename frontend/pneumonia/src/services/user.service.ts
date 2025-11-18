/**
 * Servicio para gestión de usuarios
 */

import { apiClient } from '@/lib/api';
import type { 
  User, 
  UserFormData, 
  UserFilters, 
  UserStatistics,
  ChangePasswordData,
  UpdateProfileData 
} from '@/types/user';

/**
 * Respuesta paginada del backend
 */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Obtener lista de usuarios con filtros
 */
const getUsers = async (filters?: UserFilters): Promise<User[]> => {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters?.is_staff !== undefined) params.append('is_staff', String(filters.is_staff));
  if (filters?.groups) params.append('groups', String(filters.groups));
  if (filters?.ordering) params.append('ordering', filters.ordering);

  const queryString = params.toString();
  const url = `/security/users/${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<PaginatedResponse<User>>(url);
  return response.results;
};

/**
 * Obtener usuario por ID
 */
const getUser = async (id: number): Promise<User> => {
  return apiClient.get<User>(`/security/users/${id}/`);
};

/**
 * Crear nuevo usuario
 */
const createUser = async (data: UserFormData): Promise<User> => {
  return apiClient.post<User>('/security/users/', data);
};

/**
 * Actualizar usuario existente
 */
const updateUser = async (id: number, data: Partial<UserFormData>): Promise<User> => {
  return apiClient.patch<User>(`/security/users/${id}/`, data);
};

/**
 * Eliminar usuario
 */
const deleteUser = async (id: number): Promise<void> => {
  return apiClient.delete(`/security/users/${id}/`);
};

/**
 * Obtener estadísticas de usuarios
 */
const getStatistics = async (): Promise<UserStatistics> => {
  return apiClient.get<UserStatistics>('/security/users/statistics/');
};

/**
 * Cambiar contraseña de usuario
 */
const changePassword = async (id: number, data: ChangePasswordData): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>(`/security/users/${id}/change_password/`, data);
};

/**
 * Actualizar perfil de usuario
 */
const updateProfile = async (id: number, data: UpdateProfileData): Promise<{ user: User; message: string }> => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return apiClient.patch<{ user: User; message: string }>(
    `/security/users/${id}/update_profile/`,
    formData
  );
};

/**
 * Obtener perfil de usuario
 */
const getProfile = async (id: number): Promise<User> => {
  return apiClient.get<User>(`/security/users/${id}/profile/`);
};

export const userService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getStatistics,
  changePassword,
  updateProfile,
  getProfile
};
