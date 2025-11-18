/**
 * Servicio para gestión de menús
 * CRUD completo
 */
import { apiClient } from '@/lib/api';

export interface Menu {
  id: number;
  name: string;
}

export interface CreateMenuData {
  name: string;
}

export interface UpdateMenuData {
  name?: string;
}

export interface MenuListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Menu[];
}

class MenuService {
  private baseUrl = '/security/menus/';

  /**
   * Obtener lista de menús con paginación
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
  }): Promise<MenuListResponse> {
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
    return apiClient.get<MenuListResponse>(url);
  }

  /**
   * Obtener menú por ID
   */
  async get(id: number): Promise<Menu> {
    return apiClient.get<Menu>(`${this.baseUrl}${id}/`);
  }

  /**
   * Crear nuevo menú
   */
  async create(data: CreateMenuData): Promise<Menu> {
    return apiClient.post<Menu>(this.baseUrl, data);
  }

  /**
   * Actualizar menú
   */
  async update(id: number, data: UpdateMenuData): Promise<Menu> {
    return apiClient.patch<Menu>(`${this.baseUrl}${id}/`, data);
  }

  /**
   * Eliminar menú
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}${id}/`);
  }
}

const menuService = new MenuService();
export default menuService;
