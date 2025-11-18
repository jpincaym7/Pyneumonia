/**
 * Hook para verificar permisos del módulo de radiografías
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { permissionCheckService } from '@/services/permission.check.service';

interface XRayPermissions {
  canView: boolean;
  canAdd: boolean;
  canChange: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

export function useXRayPermissions(): XRayPermissions {
  const [permissions, setPermissions] = useState<XRayPermissions>({
    canView: false,
    canAdd: false,
    canChange: false,
    canDelete: false,
    isLoading: true,
  });

  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;

    const checkPermissions = async () => {
      try {
        const [view, add, change, del] = await Promise.all([
          permissionCheckService.hasPermission('view_xrayimage'),
          permissionCheckService.hasPermission('add_xrayimage'),
          permissionCheckService.hasPermission('change_xrayimage'),
          permissionCheckService.hasPermission('delete_xrayimage'),
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
        console.error('Error checking XRay permissions:', error);
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
