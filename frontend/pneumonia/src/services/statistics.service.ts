/**
 * Servicio para obtener estadísticas y métricas del sistema
 */
import { apiClient } from '@/lib/api';

export interface DiagnosisStatistics {
  total: number;
  by_class: Array<{
    predicted_class: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  reviewed: {
    reviewed: number;
    pending: number;
  };
  pneumonia_cases: number;
  high_confidence_count: number;
}

export interface PatientStatistics {
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  by_gender: Array<{
    gender: string;
    count: number;
  }>;
  age_distribution: {
    '0-18': number;
    '19-35': number;
    '36-50': number;
    '51-65': number;
    '65+': number;
  };
  patients_with_xrays: number;
  patients_with_diagnoses: number;
  avg_xrays_per_patient: number;
  total_xrays: number;
}

export interface XRayStatistics {
  total_xrays: number;
  analyzed: number;
  pending: number;
  analysis_rate: number;
  by_quality: Array<{
    quality: string;
    count: number;
  }>;
  by_view_position: Array<{
    view_position: string;
    count: number;
  }>;
  uploads_by_month: Array<{
    month: string;
    count: number;
  }>;
  recent_uploads: number;
  top_uploaders: Array<{
    uploaded_by__username: string;
    uploaded_by__first_name: string;
    uploaded_by__last_name: string;
    count: number;
  }>;
}

export interface UserPerformanceMetrics {
  id: string;
  user: string;
  user_name: string;
  total_diagnoses_lifetime: number;
  total_reports_lifetime: number;
  total_reviews_lifetime: number;
  lifetime_average_confidence: string;
  lifetime_average_processing_time: number;
  accuracy_score: string;
  quality_score: string;
  specialty_focus: string | null;
  first_diagnosis_date: string | null;
  last_activity_date: string | null;
  experience_level: string;
  overall_performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface SystemStatistics {
  id: string;
  date: string;
  daily_patients_registered: number;
  daily_xrays_uploaded: number;
  daily_diagnoses_made: number;
  daily_reports_generated: number;
  total_patients: number;
  total_xrays: number;
  total_diagnoses: number;
  total_reports: number;
  normal_percentage: string;
  pneumonia_percentage: string;
  average_system_response_time: number;
  api_success_rate: string;
  active_users_today: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  scope?: 'all' | 'group' | 'personal';
  user_group?: string;
  user_role?: 'admin' | 'staff' | 'user';
  summary: {
    total_diagnoses: number;
    total_patients: number;
    total_xrays: number;
    total_reports: number;
  };
  pending_tasks: {
    pending_reviews: number;
    pending_analysis: number;
    draft_reports: number;
    high_priority_cases: number;
  };
  disease_stats: {
    pneumonia_cases: number;
    normal_cases: number;
    pneumonia_rate: number;
  };
  recent_activity: {
    new_patients: number;
    new_xrays: number;
    new_diagnoses: number;
    new_reports: number;
  };
  recent_diagnoses_distribution: Array<{
    predicted_class: string;
    count: number;
  }>;
  group_specific_metrics?: GroupSpecificMetrics;
}

export interface GroupSpecificMetrics {
  // Métricas para Radiólogos
  total_analyses?: number;
  pending_analyses?: number;
  avg_confidence?: number;
  high_quality_xrays?: number;
  low_quality_xrays?: number;
  analyses_today?: number;
  avg_processing_time?: number;
  
  // Métricas para Médicos
  total_patients_treated?: number;
  critical_cases?: number;
  reviews_completed?: number;
  reviews_pending?: number;
  pneumonia_cases_active?: number;
  reports_generated?: number;
  reports_pending?: number;
  
  // Métricas para Recepcionistas/Administrativos
  patients_registered_today?: number;
  patients_registered_week?: number;
  patients_with_pending_xrays?: number;
  patients_with_pending_reports?: number;
  xrays_uploaded_today?: number;
  active_patients?: number;
  
  // Métricas para Administradores
  total_users?: number;
  active_users?: number;
  inactive_users?: number;
  total_groups?: number;
  users_by_group?: {
    Administradores?: number;
    Médicos?: number;
    Radiólogos?: number;
    Recepcionistas?: number;
    [key: string]: number | undefined;
  };
  users_without_group?: number;
  new_users_week?: number;
  logins_today?: number;
  logins_week?: number;
  logins_month?: number;
  failed_logins?: number;
  total_permissions?: number;
  
  // Métricas genéricas
  total_diagnoses?: number;
  total_patients?: number;
  pending_tasks?: number;
}

class StatisticsService {
  private baseUrl = '/diagnosis';

  /**
   * Obtener estadísticas de diagnósticos
   */
  async getDiagnosisStatistics(): Promise<DiagnosisStatistics> {
    const response = await apiClient.get<DiagnosisStatistics>(`${this.baseUrl}/statistics/diagnoses/`);
    return response;
  }

  /**
   * Obtener estadísticas de pacientes
   */
  async getPatientStatistics(): Promise<PatientStatistics> {
    const response = await apiClient.get<PatientStatistics>(`${this.baseUrl}/statistics/patients/`);
    return response;
  }

  /**
   * Obtener estadísticas de radiografías
   */
  async getXRayStatistics(): Promise<XRayStatistics> {
    const response = await apiClient.get<XRayStatistics>(`${this.baseUrl}/statistics/xrays/`);
    return response;
  }

  /**
   * Obtener métricas de rendimiento del usuario actual
   */
  async getUserPerformance(): Promise<UserPerformanceMetrics> {
    const response = await apiClient.get<UserPerformanceMetrics>(`${this.baseUrl}/statistics/user-performance/`);
    return response;
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStatistics(date?: string): Promise<SystemStatistics> {
    const params = date ? { date } : {};
    const response = await apiClient.get<SystemStatistics>(`${this.baseUrl}/statistics/system/`, { params });
    return response;
  }

  /**
   * Obtener vista general del dashboard
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await apiClient.get<DashboardOverview>(`${this.baseUrl}/statistics/dashboard/`);
    return response;
  }
}

export const statisticsService = new StatisticsService();
