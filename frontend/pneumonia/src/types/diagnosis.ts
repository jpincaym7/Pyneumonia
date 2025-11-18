/**
 * Tipos para el módulo de Diagnóstico
 */



export interface DiagnosisResult {
  id: string;
  xray: string; // ID de la radiografía
  xray_details?: {
    id: string;
    patient_name: string;
    patient_dni: string;
    uploaded_at: string;
    image_url: string;
    medical_order?: string; // ID o label de la orden médica asociada
    medical_order_reason?: string; // Motivo de la orden médica
  };
  predicted_class: 'NORMAL' | 'PNEUMONIA_BACTERIA' | 'PNEUMONIA_BACTERIAL' | 'PNEUMONIA_VIRAL';
  class_id: number;
  confidence: string; // Decimal como string "0.766"
  confidence_percentage?: number;
  raw_response?: any;
  processing_time?: number;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  error_message?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  medical_notes?: string;
  is_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  analyzed_by?: string;
  analyzed_by_name?: string;
  created_at: string;
  updated_at: string;
  is_pneumonia?: boolean;
  requires_attention?: boolean;
}

export interface DiagnosisFormData {
  xray: string;
  predicted_class: string;
  class_id: number;
  confidence: string;
  severity?: string;
  medical_notes?: string;
}

export interface DiagnosisFilters {
  search?: string;
  predicted_class?: string;
  status?: string;
  is_reviewed?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface DiagnosisListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DiagnosisResult[];
}


export const DIAGNOSIS_CLASS_CHOICES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PNEUMONIA_BACTERIA', label: 'Neumonía Bacteriana' },
  { value: 'PNEUMONIA_BACTERIAL', label: 'Neumonía Bacterial' },
  { value: 'PNEUMONIA_VIRAL', label: 'Neumonía Viral' },
];

export const DIAGNOSIS_STATUS_CHOICES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'analyzing', label: 'Analizando' },
  { value: 'completed', label: 'Completado' },
  { value: 'error', label: 'Error' },
];

export const SEVERITY_CHOICES = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'severe', label: 'Severa' },
];
