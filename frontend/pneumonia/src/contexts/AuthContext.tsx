'use client';

/**
 * Contexto de autenticación
 * Maneja el estado global del usuario autenticado
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/lib/api';
import type {
  User,
  LoginRequest,
  MeResponse,
  MenuModule,
  AuthSession,
} from '@/types/auth';

interface AuthContextType {
  user: User | null;
  permissions: Record<string, string[]> | null;
  group: AuthSession | null;
  menus: MenuModule[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  changeGroup: (groupId: number) => Promise<void>;
  checkPermission: (codename: string) => boolean;
  hasModule: (moduleUrl: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(null);
  const [group, setGroup] = useState<AuthSession | null>(null);
  const [menus, setMenus] = useState<MenuModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Inicializar CSRF token al montar
   */
  useEffect(() => {
    apiClient.fetchCsrfToken();
  }, []);

  /**
   * Verificar sesión al cargar la app
   */
  const checkAuth = useCallback(async () => {
    try {
      const response = await authService.me();
      setUser(response.user);
      setPermissions(response.permissions);
      setGroup(response.group);

      // Cargar menús
      const userMenus = await authService.getUserMenus();
      setMenus(userMenus);
    } catch (error) {
      // Usuario no autenticado
      setUser(null);
      setPermissions(null);
      setGroup(null);
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Iniciar sesión
   */
  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      // Asegurar que tenemos el CSRF token antes de hacer login
      await apiClient.fetchCsrfToken();
      
      const response = await authService.login(credentials);
      setUser(response.user);
      setPermissions(response.permissions);

      // Cargar menús después del login
      const userMenus = await authService.getUserMenus();
      setMenus(userMenus);

      // Obtener grupo de la sesión
      const meResponse = await authService.me();
      setGroup(meResponse.group);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      setPermissions(null);
      setGroup(null);
      setMenus([]);
    }
  };

  /**
   * Refrescar información del usuario
   */
  const refreshUser = async () => {
    try {
      const response = await authService.me();
      setUser(response.user);
      setPermissions(response.permissions);
      setGroup(response.group);

      const userMenus = await authService.getUserMenus();
      setMenus(userMenus);
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  /**
   * Actualizar datos del usuario en el estado
   */
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...userData,
      });
    }
  };

  /**
   * Cambiar grupo activo
   */
  const changeGroup = async (groupId: number) => {
    try {
      const response = await authService.changeGroup(groupId);
      setPermissions(response.permissions);

      // Refrescar menús con el nuevo grupo
      const userMenus = await authService.getUserMenus();
      setMenus(userMenus);

      // Actualizar grupo en estado
      await refreshUser();
    } catch (error) {
      console.error('Error al cambiar grupo:', error);
      throw error;
    }
  };

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const checkPermission = (codename: string): boolean => {
    if (!permissions) return false;
    if (user?.is_superuser) return true;

    // Buscar en todos los permisos
    for (const perms of Object.values(permissions)) {
      if (perms.includes(codename)) return true;
    }

    return false;
  };

  /**
   * Verificar si el usuario tiene acceso a un módulo
   */
  const hasModule = (moduleUrl: string): boolean => {
    if (user?.is_superuser) return true;

    for (const menuModule of menus) {
      const foundModule = menuModule.modules.find(m => m.url === moduleUrl);
      if (foundModule) return true;
    }

    return false;
  };

  const value: AuthContextType = {
    user,
    permissions,
    group,
    menus,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    updateUser,
    changeGroup,
    checkPermission,
    hasModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
