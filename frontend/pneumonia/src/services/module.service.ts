/**
 * Servicio para gestión de módulos
 */

import { apiClient } from '@/lib/api';
import type { Module, Menu } from '@/types/auth';

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
 * Filtros para módulos
 */
export interface ModuleFilters {
  search?: string;
  menu?: number;
  is_active?: boolean;
  ordering?: string;
}

/**
 * Datos para crear/actualizar módulo
 */
export interface ModuleFormData {
  url: string;
  name: string;
  menu: number;
  description?: string;
  icon?: string;
  is_active?: boolean;
  permissions?: number[];
}

export const moduleService = {
  /**
   * Obtener todos los módulos con filtros
   */
  async getModules(filters?: ModuleFilters): Promise<Module[]> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.menu !== undefined) params.append('menu', String(filters.menu));
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = `/security/modules/${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<PaginatedResponse<Module>>(url);
    return response.results;
  },

  /**
   * Obtener un módulo por ID
   */
  async getModule(id: number): Promise<Module> {
    return apiClient.get<Module>(`/security/modules/${id}/`);
  },

  /**
   * Crear un módulo
   */
  async createModule(data: ModuleFormData): Promise<Module> {
    return apiClient.post<Module>('/security/modules/', data);
  },

  /**
   * Actualizar un módulo
   */
  async updateModule(id: number, data: Partial<ModuleFormData>): Promise<Module> {
    return apiClient.patch<Module>(`/security/modules/${id}/`, data);
  },

  /**
   * Eliminar un módulo
   */
  async deleteModule(id: number): Promise<void> {
    await apiClient.delete(`/security/modules/${id}/`);
  },

  /**
   * Activar/desactivar módulo
   */
  async toggleActive(id: number): Promise<{ is_active: boolean; message: string }> {
    return apiClient.post<{ is_active: boolean; message: string }>(
      `/security/modules/${id}/toggle_active/`
    );
  },

  /**
   * Actualizar permisos de un módulo
   */
  async updatePermissions(id: number, permissionIds: number[]): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/security/modules/${id}/update_permissions/`,
      { permission_ids: permissionIds }
    );
  },
};
