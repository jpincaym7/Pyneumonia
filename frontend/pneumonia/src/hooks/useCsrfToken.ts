import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

/**
 * Hook para inicializar el token CSRF
 * Debe llamarse en el componente raíz de la aplicación
 */
export function useCsrfToken() {
  useEffect(() => {
    // Obtener el token CSRF al montar el componente
    apiClient.fetchCsrfToken();
  }, []);
}
