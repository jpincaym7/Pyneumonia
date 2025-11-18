/**
 * Hook genérico para verificar permisos de cualquier módulo
 * Consulta los permisos del usuario para un módulo específico
 */

import { useState, useEffect } from 'react';
import { modulePermissionService } from '@/services/module.permission.service';

export interface ModulePermissionsResult {
    hasAccess: boolean;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isLoading: boolean;
    moduleName?: string;
}

/**
 * Hook para obtener permisos de un módulo específico
 * 
 * @param moduleUrl - URL del módulo (ej: '/patients', '/diagnosis')
 * @param modelName - Nombre del modelo (ej: 'patient', 'xrayimage', 'diagnosisresult')
 * 
 * @example
 * // Para el módulo de pacientes
 * const { canView, canAdd, canEdit, canDelete } = useModulePermissions('/patients', 'patient');
 * 
 * @example
 * // Para el módulo de radiografías
 * const { canView, canAdd, canEdit, canDelete } = useModulePermissions('/xrays', 'xrayimage');
 */
export const useModulePermissions = (
    moduleUrl: string,
    modelName: string
): ModulePermissionsResult => {
    const [state, setState] = useState<ModulePermissionsResult>({
        hasAccess: false,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        isLoading: true
    });

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                console.log(`🔍 Verificando permisos del módulo: ${moduleUrl} (${modelName})`);
                
                const result = await modulePermissionService.getModuleActions(
                    moduleUrl,
                    modelName
                );

                console.log(`✅ Permisos obtenidos para ${moduleUrl}:`, result);

                setState({
                    hasAccess: result.hasAccess,
                    canView: result.canView,
                    canAdd: result.canAdd,
                    canEdit: result.canEdit,
                    canDelete: result.canDelete,
                    isLoading: false
                });
            } catch (error) {
                console.error(`❌ Error al cargar permisos de ${moduleUrl}:`, error);
                
                // En caso de error, denegar todos los permisos
                setState({
                    hasAccess: false,
                    canView: false,
                    canAdd: false,
                    canEdit: false,
                    canDelete: false,
                    isLoading: false
                });
            }
        };

        loadPermissions();
    }, [moduleUrl, modelName]);

    return state;
};
