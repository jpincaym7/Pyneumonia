/**
 * Hook para obtener el grupo del usuario autenticado
 * Valida si el usuario es médico, radiólogo, etc.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface UserGroupInfo {
  group: string | null;
  isPhysician: boolean;
  isRadiologist: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserGroup(): UserGroupInfo {
  const [userGroup, setUserGroup] = useState<UserGroupInfo>({
    group: null,
    isPhysician: false,
    isRadiologist: false,
    isAdmin: false,
    isLoading: true,
  });

  const hasChecked = useRef(false);

  useEffect(() => {
    // Solo verificar una vez
    if (hasChecked.current) return;

    const fetchUserGroup = async () => {
      try {
        const response = await apiClient.getUserGroup();
        const group = response.group || null;

        setUserGroup({
          group,
          isPhysician: group === 'Médicos',
          isRadiologist: group === 'Radiólogos',
          isAdmin: group === 'Administradores',
          isLoading: false,
        });

        hasChecked.current = true;
      } catch (error) {
        console.error('Error fetching user group:', error);
        setUserGroup({
          group: null,
          isPhysician: false,
          isRadiologist: false,
          isAdmin: false,
          isLoading: false,
        });
      }
    };

    fetchUserGroup();
  }, []);

  return userGroup;
}
