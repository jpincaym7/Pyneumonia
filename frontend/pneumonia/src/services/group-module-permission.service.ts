/**
 * Servicio para gestión de permisos de grupo-módulo
 * CRUD completo
 */
import { apiClient } from '@/lib/api';

export interface GroupModulePermission {
  id: number;
  group: number;
  group_name: string;
  module: {
    id: number;
    name: string;
    url: string;
    description: string;
    icon: string;
    is_active: boolean;
    menu: {
      id: number;
      name: string;
      icon: string;
    };
  };
  module_name: string;
  module_url: string;
  permissions: number[];
  permissions_data: Array<{
    id: number;
    name: string;
    codename: string;
  }>;
}

export interface CreateGroupModulePermissionData {
  group: number;
  module: number;
  permissions: number[];
}

export interface UpdateGroupModulePermissionData {
  permissions: number[];
}

export interface GroupModulePermissionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GroupModulePermission[];
}

class GroupModulePermissionService {
  private baseUrl = '/security/group-module-permissions/';

  /**
   * Obtener lista de permisos con paginación y filtros
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    group?: number;
    module?: number;
  }): Promise<GroupModulePermissionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<GroupModulePermissionListResponse>(url);
  }

  /**
   * Obtener permisos por grupo
   */
  async byGroup(groupId: number): Promise<GroupModulePermission[]> {
    return apiClient.get<GroupModulePermission[]>(
      `${this.baseUrl}by_group/?group_id=${groupId}`
    );
  }

  /**
   * Obtener permisos por grupo (alias para compatibilidad)
   */
  async getByGroup(groupId: number): Promise<GroupModulePermission[]> {
    return this.byGroup(groupId);
  }

  /**
   * Obtener permiso por ID
   */
  async get(id: number): Promise<GroupModulePermission> {
    return apiClient.get<GroupModulePermission>(`${this.baseUrl}${id}/`);
  }

  /**
   * Crear nuevo permiso de grupo-módulo
   */
  async create(data: CreateGroupModulePermissionData): Promise<GroupModulePermission> {
    // Asegurarse de enviar solo el ID del módulo
    const payload = {
      group: data.group,
      module: data.module,
      permissions: data.permissions
    };
    return apiClient.post<GroupModulePermission>(this.baseUrl, payload);
  }

  /**
   * Actualizar permisos
   */
  async update(id: number, data: UpdateGroupModulePermissionData): Promise<GroupModulePermission> {
    return apiClient.patch<GroupModulePermission>(`${this.baseUrl}${id}/`, data);
  }

  /**
   * Eliminar permiso de grupo-módulo
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}${id}/`);
  }
}

const groupModulePermissionService = new GroupModulePermissionService();
export default groupModulePermissionService;
