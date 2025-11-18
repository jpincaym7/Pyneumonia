/**
 * Servicio para gestión de permisos de grupo-módulo
 */

import { apiClient } from '@/lib/api';

export interface GroupModulePermission {
  id: number;
  group: {
    id: number;
    name: string;
  };
  group_id?: number; // Solo para escritura
  module: {
    id: number;
    url: string;
    name: string;
    menu: {
      id: number;
      name: string;
      icon: string;
    };
    description?: string;
    icon: string;
    is_active: boolean;
  };
  module_id?: number; // Solo para escritura
  permissions: number[];
  permissions_data?: {
    id: number;
    name: string;
    codename: string;
  }[];
  group_name?: string;
  module_name?: string;
  module_url?: string;
}

export const groupModulePermissionService = {
  /**
   * Obtener todos los permisos de grupo-módulo
   */
  async getAll(filters?: { group?: number; module?: number }): Promise<GroupModulePermission[]> {
    const params = new URLSearchParams();
    
    if (filters?.group) params.append('group', filters.group.toString());
    if (filters?.module) params.append('module', filters.module.toString());
    
    const url = params.toString() 
      ? `/security/group-module-permissions/?${params.toString()}`
      : '/security/group-module-permissions/';
    
    const response = await apiClient.get<any>(url);
    
    // Manejar respuesta paginada o lista directa
    if (Array.isArray(response)) {
      return response as GroupModulePermission[];
    }
    return (response.results as GroupModulePermission[]) || [];
  },

  /**
   * Obtener permisos de un grupo específico
   */
  async getByGroup(groupId: number): Promise<GroupModulePermission[]> {
    const response = await apiClient.get<any>(
      `/security/group-module-permissions/by_group/?group_id=${groupId}`
    );
    
    if (Array.isArray(response)) {
      return response as GroupModulePermission[];
    }
    return (response.results as GroupModulePermission[]) || [];
  },

  /**
   * Crear un permiso de grupo-módulo
   */
  async create(data: {
    group_id: number;
    module_id: number;
    permissions: number[];
  }): Promise<GroupModulePermission> {
    return apiClient.post<GroupModulePermission>(
      '/security/group-module-permissions/',
      data
    );
  },

  /**
   * Actualizar permisos de un grupo-módulo
   * Solo actualiza los permisos, no el grupo ni el módulo
   */
  async update(
    id: number,
    data: { permissions: number[] }
  ): Promise<GroupModulePermission> {
    return apiClient.patch<GroupModulePermission>(
      `/security/group-module-permissions/${id}/`,
      data
    );
  },

  /**
   * Eliminar un permiso de grupo-módulo
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/security/group-module-permissions/${id}/`);
  },

  /**
   * Crear múltiples permisos de grupo-módulo de una vez
   */
  async bulkCreate(data: {
    group_id: number;
    modules: {
      module_id: number;
      permissions: number[];
    }[];
  }): Promise<{ message: string; created: number; errors?: string[] }> {
    return apiClient.post<{ message: string; created: number; errors?: string[] }>(
      '/security/group-module-permissions/bulk_create/',
      data
    );
  },
};