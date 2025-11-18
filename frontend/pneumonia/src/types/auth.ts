/**
 * Tipos de datos para el sistema de autenticación
 * Basados en los models y serializers de Django
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dni: string | null;
  image: string | null;
  image_url: string;
  direction: string | null;
  phone: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  groups: number[];
  groups_data: Group[];
}

export interface Group {
  id: number;
  name: string;
  permissions: number[];
  permissions_data: Permission[];
  user_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

export interface Menu {
  id: number;
  name: string;
  icon: string;
}

export interface Module {
  id: number;
  url: string;
  name: string;
  menu: Menu;
  description: string | null;
  icon: string;
  is_active: boolean;
  permissions: number[];
  permissions_data: Permission[];
}

export interface MenuModule {
  menu: Menu;
  modules: Module[];
}

export interface AuthSession {
  id: number;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  group_id?: number;
}

export interface LoginResponse {
  user: User;
  permissions: Record<string, string[]>;
  session_id: string;
  message: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  dni?: string;
  phone?: string;
  direction?: string;
}

export interface MeResponse {
  user: User;
  permissions: Record<string, string[]>;
  group: AuthSession | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ApiError {
  error?: string;
  errors?: Record<string, string[]>;
  detail?: string;
  [key: string]: any;
}
