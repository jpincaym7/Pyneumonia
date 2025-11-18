/**
 * Hook genérico para verificar permisos individuales
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';

interface UsePermissionsResult {
  hasPermission: (permission: string) => Promise<boolean>;
  hasAnyPermission: (permissions: string[]) => Promise<boolean>;
  hasAllPermissions: (permissions: string[]) => Promise<boolean>;
  isLoading: boolean;
  userPermissions: string[];
}

export function usePermissions(): UsePermissionsResult {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await authService.me();
        // Convertir el objeto de permisos a un array plano
        const permissions: string[] = [];
        Object.values(response.permissions || {}).forEach((perms) => {
          permissions.push(...perms);
        });
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Error al cargar permisos:', error);
        setUserPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = useCallback(async (permission: string): Promise<boolean> => {
    if (isLoading) {
      // Esperar a que carguen los permisos
      await new Promise(resolve => setTimeout(resolve, 100));
      return userPermissions.includes(permission);
    }
    return userPermissions.includes(permission);
  }, [userPermissions, isLoading]);

  const hasAnyPermission = useCallback(async (permissions: string[]): Promise<boolean> => {
    if (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return permissions.some(permission => userPermissions.includes(permission));
  }, [userPermissions, isLoading]);

  const hasAllPermissions = useCallback(async (permissions: string[]): Promise<boolean> => {
    if (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return permissions.every(permission => userPermissions.includes(permission));
  }, [userPermissions, isLoading]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    userPermissions,
  };
}
