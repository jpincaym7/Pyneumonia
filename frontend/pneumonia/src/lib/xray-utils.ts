/**
 * Utilidades para formatear fechas y obtener labels
 */
import { QUALITY_CHOICES, VIEW_POSITION_CHOICES } from '@/types/xray';

/**
 * Formatea una fecha en formato legible
 */
export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) => {
  return new Date(date).toLocaleDateString(
    'es-ES',
    options || {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
};

/**
 * Formatea fecha y hora en formato legible
 */
export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtiene el label de calidad basado en el valor
 */
export const getQualityLabel = (quality: string) => {
  return QUALITY_CHOICES.find((q) => q.value === quality)?.label || quality;
};

/**
 * Obtiene el label de posición de vista basado en el valor
 */
export const getViewPositionLabel = (viewPosition: string) => {
  return (
    VIEW_POSITION_CHOICES.find((v) => v.value === viewPosition)?.label ||
    viewPosition
  );
};
