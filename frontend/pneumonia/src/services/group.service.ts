/**
 * Servicio para gestión de grupos (roles)
 */

import { apiClient } from '@/lib/api';
import type { Group, User } from '@/types/auth';

/**
 * Respuesta paginada del backend
 */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface GroupModulePermission {
  id: number;
  group: number;
  group_name: string;
  module: number;
  module_name: string;
  permissions: number[];
  permissions_data: Array<{
    id: number;
    name: string;
    codename: string;
  }>;
}

export const groupService = {
  /**
   * Obtener todos los grupos con paginación
   */
  async getGroups(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Group>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = `/security/groups/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PaginatedResponse<Group>>(url);
  },

  /**
   * Obtener un grupo por ID
   */
  async getGroup(id: number): Promise<Group> {
    return apiClient.get<Group>(`/security/groups/${id}/`);
  },

  /**
   * Crear un grupo
   */
  async createGroup(data: Partial<Group>): Promise<Group> {
    return apiClient.post<Group>('/security/groups/', data);
  },

  /**
   * Actualizar un grupo
   */
  async updateGroup(id: number, data: Partial<Group>): Promise<Group> {
    return apiClient.patch<Group>(`/security/groups/${id}/`, data);
  },

  /**
   * Eliminar un grupo
   */
  async deleteGroup(id: number): Promise<void> {
    await apiClient.delete(`/security/groups/${id}/`);
  },

  /**
   * Obtener usuarios de un grupo
   */
  async getGroupUsers(id: number): Promise<User[]> {
    return apiClient.get<User[]>(`/security/groups/${id}/users/`);
  },

  /**
   * Obtener módulos de un grupo
   */
  async getGroupModules(id: number): Promise<GroupModulePermission[]> {
    return apiClient.get<GroupModulePermission[]>(`/security/groups/${id}/modules/`);
  },

  /**
   * Agregar usuarios a un grupo
   */
  async addUsers(id: number, userIds: number[]): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/security/groups/${id}/add_users/`,
      { user_ids: userIds }
    );
  },

  /**
   * Remover usuarios de un grupo
   */
  async removeUsers(id: number, userIds: number[]): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/security/groups/${id}/remove_users/`,
      { user_ids: userIds }
    );
  },
};
