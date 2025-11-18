/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con auth
 */

import { apiClient } from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  MeResponse,
  ChangePasswordRequest,
  MenuModule,
  User,
} from '@/types/auth';

export class AuthService {
  private readonly BASE_PATH = '/security/auth';

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.BASE_PATH}/login/`, credentials);
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_PATH}/logout/`);
  }

  /**
   * Obtener información del usuario autenticado
   */
  async me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>(`${this.BASE_PATH}/me/`);
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterRequest): Promise<{ user: User; message: string }> {
    return apiClient.post<{ user: User; message: string }>(
      `${this.BASE_PATH}/register/`,
      data
    );
  }

  /**
   * Cambiar grupo activo
   */
  async changeGroup(groupId: number): Promise<{
    group: any;
    permissions: Record<string, string[]>;
    message: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/change_group/`, {
      group_id: groupId,
    });
  }

  /**
   * Obtener menús del usuario
   */
  async getUserMenus(): Promise<MenuModule[]> {
    return apiClient.get<MenuModule[]>('/security/menus/user_menus/');
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    userId: number,
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/security/users/${userId}/change_password/`,
      data
    );
  }

  /**
   * Actualizar perfil
   */
  async updateProfile(userId: number, data: Partial<User>): Promise<{ user: User; message: string }> {
    return apiClient.patch<{ user: User; message: string }>(
      `/security/users/${userId}/update_profile/`,
      data
    );
  }
}

// Instancia única del servicio
export const authService = new AuthService();
