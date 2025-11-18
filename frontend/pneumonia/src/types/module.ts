/**
 * Tipos para módulos del sistema
 */

export interface Menu {
  id: number;
  name: string;
  icon: string;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

export interface Module {
  id: number;
  url: string;
  name: string;
  menu: number;
  menu_data?: Menu;
  description?: string;
  icon?: string;
  is_active: boolean;
  permissions: number[];
  permissions_data?: Permission[];
}

export interface ModuleFilters {
  search?: string;
  menu?: number;
  is_active?: boolean;
  ordering?: string;
}
