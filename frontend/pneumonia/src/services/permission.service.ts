/**
 * Servicio para gestión de permisos
 */

import { apiClient } from '@/lib/api';
import type { Permission } from '@/types/auth';

/**
 * Respuesta paginada del backend
 */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const permissionService = {
  /**
   * Obtener todos los permisos disponibles
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<PaginatedResponse<Permission>>('/security/permissions/');
    return response.results;
  },

  /**
   * Obtener un permiso por ID
   */
  async getPermission(id: number): Promise<Permission> {
    return apiClient.get<Permission>(`/security/permissions/${id}/`);
  },
};
