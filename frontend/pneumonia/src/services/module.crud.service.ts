/**
 * Servicio para gestión de módulos
 * CRUD completo con permisos
 */
import { apiClient } from '@/lib/api';

export interface Module {
  id: number;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  menu: number;
  menu_name: string;
  permissions: number[];
  permissions_data: Array<{
    id: number;
    name: string;
    codename: string;
  }>;
}

export interface CreateModuleData {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  menu: number;
  permissions?: number[];
}

export interface UpdateModuleData {
  name?: string;
  url?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  menu?: number;
  permissions?: number[];
}

export interface ModuleListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Module[];
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
  app_label: string;
  model: string;
}

class ModuleService {
  private baseUrl = '/security/modules/';

  /**
   * Obtener lista de módulos con paginación y filtros
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    menu?: number;
    ordering?: string;
  }): Promise<ModuleListResponse> {
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
    return apiClient.get<ModuleListResponse>(url);
  }

  /**
   * Obtener módulo por ID
   */
  async get(id: number): Promise<Module> {
    return apiClient.get<Module>(`${this.baseUrl}${id}/`);
  }

  /**
   * Crear nuevo módulo
   */
  async create(data: CreateModuleData): Promise<Module> {
    return apiClient.post<Module>(this.baseUrl, data);
  }

  /**
   * Actualizar módulo
   */
  async update(id: number, data: UpdateModuleData): Promise<Module> {
    return apiClient.patch<Module>(`${this.baseUrl}${id}/`, data);
  }

  /**
   * Eliminar módulo
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}${id}/`);
  }

  /**
   * Activar/desactivar módulo
   */
  async toggleActive(id: number): Promise<{ id: number; is_active: boolean; message: string }> {
    return apiClient.post<{ id: number; is_active: boolean; message: string }>(
      `${this.baseUrl}${id}/toggle_active/`
    );
  }

  /**
   * Obtener todos los permisos disponibles
   */
  async getPermissions(): Promise<Permission[]> {
    return apiClient.get<Permission[]>(`${this.baseUrl}permissions/`);
  }
}

const moduleService = new ModuleService();
export default moduleService;
