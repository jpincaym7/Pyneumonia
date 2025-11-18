/**
 * Servicio para verificar permisos de acceso a módulos
 */

import { apiClient } from '@/lib/api';

export interface PermissionCheckResult {
    hasPermission: boolean;
    errorCode?: number;
    message?: string;
}

class PermissionCheckService {
    /**
     * Verifica si el usuario tiene acceso a un módulo específico
     * @param moduleUrl - URL del módulo a verificar
     * @returns Resultado de la verificación de permisos
     */
    async checkModuleAccess(moduleUrl: string): Promise<PermissionCheckResult> {
        try {
            // Intentar acceder a un endpoint de verificación o usar el endpoint del módulo
            const response = await apiClient.get<{ has_permission: boolean; message?: string }>(
                '/security/check-module-permission/', 
                { params: { module_url: moduleUrl } }
            );

            return {
                hasPermission: response.has_permission ?? true,
                message: response.message
            };
        } catch (error) {
            const err = error as { status?: number; data?: { error?: string } };
            const status = err?.status;
            
            // 403: Sin permisos
            if (status === 403) {
                return {
                    hasPermission: false,
                    errorCode: 403,
                    message: err?.data?.error || 'No tienes permisos para acceder a este módulo'
                };
            }
            
            // 401: No autenticado
            if (status === 401) {
                return {
                    hasPermission: false,
                    errorCode: 401,
                    message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
                };
            }

            // Otros errores - permitir acceso por defecto para no bloquear
            console.warn('Error al verificar permisos:', error);
            return {
                hasPermission: true, // Permitir acceso si hay error en la verificación
                message: 'No se pudo verificar permisos'
            };
        }
    }

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param codename - Nombre en código del permiso (ej: 'view_user', 'add_module')
     * @returns true si tiene el permiso, false si no
     */
    async hasPermission(codename: string): Promise<boolean> {
        try {
            const response = await apiClient.get<{ has_permission: boolean; codename: string }>(
                '/security/auth/check_permission/', 
                { params: { codename } }
            );

            return response.has_permission ?? false;
        } catch (error) {
            console.error('Error al verificar permiso:', error);
            return false;
        }
    }

    /**
     * Obtiene todos los permisos del usuario actual
     * @returns Array de nombres de permisos
     */
    async getUserPermissions(): Promise<string[]> {
        try {
            const response = await apiClient.get<{ permissions: string[] }>('/security/auth/user_permissions/');
            return response.permissions || [];
        } catch (error) {
            console.error('Error al obtener permisos del usuario:', error);
            return [];
        }
    }
}

export const permissionCheckService = new PermissionCheckService();
