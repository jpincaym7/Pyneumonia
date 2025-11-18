// ==================== TIPOS ====================

export interface MedicalReport {
  id: string;
  diagnosis: string;
  
  // Información derivada (read-only)
  patient: {
    id: string;
    dni: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    age: number;
  } | null;
  patient_id: string | null;
  
  medical_order: {
    id: string;
    order_type: string;
    reason: string;
    priority: string;
    status: string;
    requested_by: string | null;
    created_at: string;
  } | null;
  medical_order_id: string | null;
  
  xray_id: string | null;
  
  diagnosis_info: {
    id: string;
    predicted_class: string;
    confidence: number;
    confidence_percentage: number;
    is_pneumonia: boolean;
    requires_attention: boolean;
    is_reviewed: boolean;
    created_at: string;
  } | null;
  
  // Contenido del reporte
  title: string;
  findings: string;
  impression: string;
  recommendations: string;
  status: 'draft' | 'final' | 'revised';
  
  // Usuarios relacionados
  created_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_by_name: string | null;
  
  radiologist_signed_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  radiologist_signed_by_name: string | null;
  radiologist_signed_at: string | null;
  
  received_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  received_by_name: string | null;
  received_at: string | null;
  
  // Fechas
  created_at: string;
  updated_at: string;
}

export interface MedicalReportFormData {
  diagnosis: string;
  title: string;
  findings: string;
  impression: string;
  recommendations?: string;
}

export interface MedicalReportFilters {
  search?: string;
  status?: 'draft' | 'final' | 'revised';
  patient?: string;
  medical_order?: string;
  diagnosis?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface MedicalReportListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MedicalReport[];
}
