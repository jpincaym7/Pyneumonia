/**
 * Types para el módulo de usuarios
 */

import { Group } from './auth';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dni?: string;
  image?: string;
  image_url?: string;
  direction?: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  groups: number[];
  groups_data: Group[];
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  confirm_password?: string;
  first_name: string;
  last_name: string;
  dni?: string;
  direction?: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  group_ids?: number[];
}

export interface UserFilters {
  search?: string;
  is_active?: boolean;
  is_staff?: boolean;
  groups?: number;
  ordering?: string;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  staff_users: number;
  superusers: number;
  users_by_group: {
    id: number;
    name: string;
    user_count: number;
  }[];
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  dni?: string;
  direction?: string;
  phone?: string;
  image?: File;
}
