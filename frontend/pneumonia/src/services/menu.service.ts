/**
 * Servicio para gestión de menús
 */

import { apiClient } from '@/lib/api';
import type { Menu, Module } from '@/types/auth';

/**
 * Respuesta paginada del backend
 */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const menuService = {
  /**
   * Obtener todos los menús
   */
  async getMenus(): Promise<Menu[]> {
    const response = await apiClient.get<PaginatedResponse<Menu>>('/security/menus/');
    return response.results;
  },

  /**
   * Obtener un menú por ID
   */
  async getMenu(id: number): Promise<Menu> {
    return apiClient.get<Menu>(`/security/menus/${id}/`);
  },

  /**
   * Crear un menú
   */
  async createMenu(data: Partial<Menu>): Promise<Menu> {
    return apiClient.post<Menu>('/security/menus/', data);
  },

  /**
   * Actualizar un menú
   */
  async updateMenu(id: number, data: Partial<Menu>): Promise<Menu> {
    return apiClient.patch<Menu>(`/security/menus/${id}/`, data);
  },

  /**
   * Eliminar un menú
   */
  async deleteMenu(id: number): Promise<void> {
    await apiClient.delete(`/security/menus/${id}/`);
  },

  /**
   * Obtener módulos de un menú
   */
  async getMenuModules(id: number): Promise<Module[]> {
    const response = await apiClient.get<PaginatedResponse<Module>>(`/security/menus/${id}/modules/`);
    return response.results;
  },
};
