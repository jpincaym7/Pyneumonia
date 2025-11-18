'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { permissionCheckService } from '@/services/permission.check.service';

interface UsePermissionCheckOptions {
    /**
     * URL del módulo a verificar. Si no se proporciona, usa el pathname actual
     */
    moduleUrl?: string;
    
    /**
     * Si debe verificar permisos automáticamente al montar el componente
     * @default true
     */
    autoCheck?: boolean;
    
    /**
     * Redirecciona automáticamente si no tiene permisos
     * @default true
     */
    autoRedirect?: boolean;
    
    /**
     * URL a la que redirigir si no tiene permisos
     * @default '/dashboard'
     */
    redirectTo?: string;
    
    /**
     * Tiempo en segundos antes de redirigir
     * @default 3
     */
    redirectDelay?: number;
}

interface UsePermissionCheckResult {
    /**
     * Si el usuario tiene permisos para acceder
     */
    hasPermission: boolean;
    
    /**
     * Si está verificando permisos
     */
    isChecking: boolean;
    
    /**
     * Mensaje de error si no tiene permisos
     */
    errorMessage: string;
    
    /**
     * Si debe mostrar el modal de sin permisos
     */
    showNoPermissionModal: boolean;
    
    /**
     * Código de error (403, 401, etc.)
     */
    errorCode?: number;
}

/**
 * Hook para verificar permisos de acceso a módulos
 * Verifica automáticamente si el usuario tiene permisos y muestra modal si no los tiene
 * 
 * @example
 * ```tsx
 * export default function UsersPage() {
 *   const { hasPermission, isChecking, errorMessage, showNoPermissionModal } = usePermissionCheck({
 *     moduleUrl: '/dashboard/users'
 *   });
 * 
 *   if (isChecking) return <LoadingSpinner />;
 *   if (!hasPermission) return <NoPermissionModal isOpen={showNoPermissionModal} message={errorMessage} />;
 * 
 *   return <div>Contenido de usuarios</div>;
 * }
 * ```
 */
export function usePermissionCheck(options: UsePermissionCheckOptions = {}): UsePermissionCheckResult {
    const {
        moduleUrl,
        autoCheck = true,
        autoRedirect = true,
        redirectTo = '/dashboard',
        redirectDelay = 3
    } = options;

    const pathname = usePathname();
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState(true);
    const [isChecking, setIsChecking] = useState(autoCheck);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState<number | undefined>();
    const [showNoPermissionModal, setShowNoPermissionModal] = useState(false);

    useEffect(() => {
        if (!autoCheck) return;

        const checkPermission = async () => {
            setIsChecking(true);
            
            try {
                const urlToCheck = moduleUrl || pathname;
                const result = await permissionCheckService.checkModuleAccess(urlToCheck);

                setHasPermission(result.hasPermission);

                if (!result.hasPermission) {
                    setErrorCode(result.errorCode);
                    setErrorMessage(result.message || 'No tienes permisos para acceder a este módulo');
                    setShowNoPermissionModal(true);

                    // Redirigir automáticamente si está configurado
                    if (autoRedirect) {
                        setTimeout(() => {
                            if (result.errorCode === 401) {
                                router.push('/login');
                            } else {
                                router.push(redirectTo);
                            }
                        }, redirectDelay * 1000);
                    }
                }
            } catch (error) {
                console.error('Error en verificación de permisos:', error);
                // En caso de error, permitir acceso
                setHasPermission(true);
            } finally {
                setIsChecking(false);
            }
        };

        checkPermission();
    }, [moduleUrl, pathname, autoCheck, autoRedirect, redirectTo, redirectDelay, router]);

    return {
        hasPermission,
        isChecking,
        errorMessage,
        showNoPermissionModal,
        errorCode
    };
}
