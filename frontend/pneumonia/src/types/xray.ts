/**
 * Tipos para el módulo de radiografías (XRay)
 */

export interface XRayImage {
  id: string;
  patient: string;
  patient_name: string;
  patient_dni: string;
  image: string;
  image_url: string | null;
  description: string;
  quality: string;
  view_position: string;
  is_analyzed: boolean;
  has_diagnosis: boolean;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  updated_at: string;
  medical_order?: string | number | null;
}

export interface XRayFormData {
  patient: string;
  image?: File | null;
  description: string;
  quality: string;
  view_position: string;
  medical_order?: string | number | null;
}

export interface XRayFilters {
  search?: string;
  patient?: string;
  is_analyzed?: boolean;
  quality?: string;
  view_position?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface XRayListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: XRayImage[];
}

// Opciones de calidad
export const QUALITY_CHOICES = [
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Buena' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Deficiente' },
];

// Opciones de posición de vista
export const VIEW_POSITION_CHOICES = [
  { value: 'PA', label: 'PA (Posteroanterior)' },
  { value: 'AP', label: 'AP (Anteroposterior)' },
  { value: 'Lateral', label: 'Lateral' },
  { value: 'LAO', label: 'LAO (Oblicua Anterior Izquierda)' },
  { value: 'RAO', label: 'RAO (Oblicua Anterior Derecha)' },
  { value: 'LPO', label: 'LPO (Oblicua Posterior Izquierda)' },
  { value: 'RPO', label: 'RPO (Oblicua Posterior Derecha)' },
];
