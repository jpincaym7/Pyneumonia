'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { permissionCheckService } from '@/services/permission.check.service';
import NoPermissionModal from './NoPermissionModal';

/**
 * Componente que verifica permisos automáticamente para rutas protegidas
 * Se ejecuta en cada cambio de ruta y muestra modal si no tiene permisos
 */
export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(false);
    const [showNoPermissionModal, setShowNoPermissionModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState<number | undefined>();

    useEffect(() => {
        // Rutas que NO requieren verificación de permisos
        const publicRoutes = ['/', '/login', '/register', '/forgot-password'];
        const dashboardHomeRoute = '/dashboard';

        // Determinar si la ruta actual requiere verificación
        const requiresPermissionCheck = (path: string) => {
            // No verificar rutas públicas
            if (publicRoutes.includes(path)) return false;
            
            // No verificar el dashboard principal (solo módulos específicos)
            if (path === dashboardHomeRoute) return false;
            
            // Verificar todas las sub-rutas de dashboard (módulos)
            if (path.startsWith('/dashboard/') && path !== dashboardHomeRoute) return true;
            
            return false;
        };

        const checkPermission = async () => {
            // Si no requiere verificación, no hacer nada
            if (!requiresPermissionCheck(pathname)) {
                setShowNoPermissionModal(false);
                setIsChecking(false);
                return;
            }

            setIsChecking(true);
            
            try {
                const result = await permissionCheckService.checkModuleAccess(pathname);

                if (!result.hasPermission) {
                    setErrorCode(result.errorCode);
                    setErrorMessage(result.message || 'No tienes permisos para acceder a este módulo');
                    setShowNoPermissionModal(true);

                    // Redirigir automáticamente después de 3 segundos
                    setTimeout(() => {
                        if (result.errorCode === 401) {
                            router.push('/login');
                        } else {
                            router.push('/dashboard');
                        }
                    }, 3000);
                } else {
                    setShowNoPermissionModal(false);
                    setIsChecking(false);
                }
            } catch (error) {
                console.error('Error en verificación de permisos:', error);
                // En caso de error en la verificación, permitir acceso
                // El error real se manejará cuando intente cargar los datos
                setShowNoPermissionModal(false);
                setIsChecking(false);
            }
        };

        checkPermission();
    }, [pathname, router]);

    // Mostrar modal de sin permisos
    if (showNoPermissionModal) {
        return (
            <NoPermissionModal
                isOpen={showNoPermissionModal}
                message={errorMessage}
                redirectTo={errorCode === 401 ? '/login' : '/dashboard'}
                autoRedirectSeconds={3}
            />
        );
    }

    // Mostrar loader mientras verifica
    if (isChecking) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Renderizar contenido si tiene permisos
    return <>{children}</>;
}
