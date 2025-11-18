/**
 * Hook personalizado para manejar el filtrado de radiografías
 */
import { useMemo, useCallback } from 'react';
import { XRayImage } from '@/types/xray';

const LETTER_REGEX = /[A-ZÀ-ŸÑ]/i;

interface UseXRayFiltersProps {
  xrays: XRayImage[];
  searchTerm: string;
  selectedLetter: string | null;
}

export function useXRayFilters({ xrays, searchTerm, selectedLetter }: UseXRayFiltersProps) {
  // Obtener letras disponibles del abecedario
  const getAvailableLetters = useCallback(() => {
    const letters = new Set<string>();
    xrays.forEach((x) => {
      const name = x.patient_name || '';
      const first = name.charAt(0).toUpperCase();
      if (first && LETTER_REGEX.test(first)) {
        letters.add(first);
      }
    });
    return Array.from(letters).sort();
  }, [xrays]);

  // Filtrar radiografías por búsqueda y letra
  const filteredXrays = useMemo(() => {
    let list = xrays.slice();

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      list = list.filter(
        (x) =>
          x.patient_name?.toLowerCase().includes(search) ||
          x.patient_dni?.toLowerCase().includes(search) ||
          x.description?.toLowerCase().includes(search)
      );
    }

    // Aplicar filtro alfabético
    if (selectedLetter) {
      list = list.filter(
        (x) => x.patient_name?.charAt(0).toUpperCase() === selectedLetter
      );
    }

    return list;
  }, [xrays, searchTerm, selectedLetter]);

  return {
    filteredXrays,
    availableLetters: getAvailableLetters(),
  };
}
