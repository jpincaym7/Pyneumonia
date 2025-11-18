/**
 * Hook para verificar permisos del módulo de diagnósticos
 * Verifica una sola vez al montar y cachea los resultados
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { permissionCheckService } from '@/services/permission.check.service';

interface DiagnosisPermissions {
  canView: boolean;
  canAdd: boolean;
  canChange: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

export function useDiagnosisPermissions(): DiagnosisPermissions {
  const [permissions, setPermissions] = useState<DiagnosisPermissions>({
    canView: false,
    canAdd: false,
    canChange: false,
    canDelete: false,
    isLoading: true,
  });

  const hasChecked = useRef(false);

  useEffect(() => {
    // Solo verificar una vez
    if (hasChecked.current) return;

    const checkPermissions = async () => {
      try {
        const [view, add, change, del] = await Promise.all([
          permissionCheckService.hasPermission('view_diagnosisresult'),
          permissionCheckService.hasPermission('add_diagnosisresult'),
          permissionCheckService.hasPermission('change_diagnosisresult'),
          permissionCheckService.hasPermission('delete_diagnosisresult'),
        ]);

        setPermissions({
          canView: view,
          canAdd: add,
          canChange: change,
          canDelete: del,
          isLoading: false,
        });

        hasChecked.current = true;
      } catch (error) {
        console.error('Error checking Diagnosis permissions:', error);
        setPermissions({
          canView: false,
          canAdd: false,
          canChange: false,
          canDelete: false,
          isLoading: false,
        });
      }
    };

    checkPermissions();
  }, []);

  return permissions;
}
