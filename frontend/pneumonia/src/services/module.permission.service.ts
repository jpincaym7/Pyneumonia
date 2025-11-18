/**
 * Servicio para gestionar permisos de módulos
 * Consulta los permisos del usuario para módulos específicos
 */

import { apiClient } from '@/lib/api';

export interface ModulePermissions {
    module: string;
    module_name?: string;
    has_access: boolean;
    permissions: string[];
    is_superuser?: boolean;
    message?: string;
}

export interface ModulePermissionActions {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

class ModulePermissionService {
    /**
     * Obtiene los permisos del usuario para un módulo específico
     * @param moduleUrl - URL del módulo (ej: '/patients', '/diagnosis')
     * @returns Permisos del módulo
     */
    async getModulePermissions(moduleUrl: string): Promise<ModulePermissions> {
        try {
            const response = await apiClient.get<ModulePermissions>(
                `/security/auth/module_permissions/?module_url=${encodeURIComponent(moduleUrl)}`
            );

            return response;
        } catch (error) {
            console.error(`Error al obtener permisos del módulo ${moduleUrl}:`, error);
            
            // En caso de error, denegar acceso
            return {
                module: moduleUrl,
                has_access: false,
                permissions: [],
                message: 'Error al verificar permisos'
            };
        }
    }

    /**
     * Convierte los permisos de un módulo a acciones CRUD
     * @param permissions - Lista de permisos del módulo
     * @param modelName - Nombre del modelo (ej: 'patient', 'xrayimage')
     * @returns Objeto con permisos CRUD
     */
    parsePermissionsToActions(
        permissions: string[],
        modelName: string
    ): ModulePermissionActions {
        return {
            canView: permissions.includes(`view_${modelName}`),
            canAdd: permissions.includes(`add_${modelName}`),
            canEdit: permissions.includes(`change_${modelName}`),
            canDelete: permissions.includes(`delete_${modelName}`)
        };
    }

    /**
     * Obtiene permisos del módulo y los convierte a acciones CRUD
     * @param moduleUrl - URL del módulo
     * @param modelName - Nombre del modelo
     * @returns Permisos CRUD
     */
    async getModuleActions(
        moduleUrl: string,
        modelName: string
    ): Promise<ModulePermissionActions & { hasAccess: boolean }> {
        const modulePerms = await this.getModulePermissions(moduleUrl);
        
        if (!modulePerms.has_access) {
            return {
                hasAccess: false,
                canView: false,
                canAdd: false,
                canEdit: false,
                canDelete: false
            };
        }

        const actions = this.parsePermissionsToActions(modulePerms.permissions, modelName);
        
        return {
            hasAccess: true,
            ...actions
        };
    }
}

export const modulePermissionService = new ModulePermissionService();
