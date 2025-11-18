/**
 * Hook para verificar permisos del módulo de pacientes
 * Verifica una sola vez al montar y cachea los resultados
 */
import { useEffect, useState, useRef } from 'react';
import { permissionCheckService } from '@/services/permission.check.service';

export const usePatientPermissions = () => {
  const [permissions, setPermissions] = useState({
    canView: false,
    canAdd: false,
    canChange: false,
    canDelete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Solo verificar una vez
    if (hasChecked.current) return;

    const checkPermissions = async () => {
      setIsLoading(true);
      hasChecked.current = true;

      try {
        const [canView, canAdd, canChange, canDelete] = await Promise.all([
          permissionCheckService.hasPermission('view_patient'),
          permissionCheckService.hasPermission('add_patient'),
          permissionCheckService.hasPermission('change_patient'),
          permissionCheckService.hasPermission('delete_patient'),
        ]);

        setPermissions({
          canView,
          canAdd,
          canChange,
          canDelete,
        });
      } catch (error) {
        console.error('Error al verificar permisos de pacientes:', error);
        // En caso de error, denegar todos los permisos
        setPermissions({
          canView: false,
          canAdd: false,
          canChange: false,
          canDelete: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, []);

  return {
    ...permissions,
    isLoading,
  };
};
