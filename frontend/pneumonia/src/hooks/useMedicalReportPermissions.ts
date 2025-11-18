import { useEffect, useState, useRef } from 'react';
import { permissionCheckService } from '@/services/permission.check.service';

export const useMedicalReportPermissions = () => {
  const [permissions, setPermissions] = useState({
    canView: false,
    canAdd: false,
    canChange: false,
    canDelete: false,
    canSign: false, // Para radiólogos
    canReceive: false, // Para médicos tratantes
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;

    const checkPermissions = async () => {
      setIsLoading(true);
      hasChecked.current = true;

      try {
        const [canView, canAdd, canChange, canDelete] = await Promise.all([
          permissionCheckService.hasPermission('view_medicalreport'),
          permissionCheckService.hasPermission('add_medicalreport'),
          permissionCheckService.hasPermission('change_medicalreport'),
          permissionCheckService.hasPermission('delete_medicalreport'),
        ]);

        setPermissions({
          canView,
          canAdd,
          canChange,
          canDelete,
          canSign: canChange, // Si puede cambiar, puede firmar
          canReceive: canChange, // Si puede cambiar, puede recibir
        });
      } catch (error) {
        console.error('Error al verificar permisos de reportes médicos:', error);
        setPermissions({
          canView: false,
          canAdd: false,
          canChange: false,
          canDelete: false,
          canSign: false,
          canReceive: false,
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