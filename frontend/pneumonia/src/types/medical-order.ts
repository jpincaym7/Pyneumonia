/**
 * Types para el módulo de órdenes médicas
 */

export interface MedicalOrder {
  id: string;
  patient: string;
  patient_name: string;
  patient_dni: string;
  patient_display?: {
    id: string;
    dni: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    email?: string;
    phone?: string;
    address?: string;
    blood_type?: string;
    is_active: boolean;
  };
  reason: string;
  priority: 'low' | 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  requested_by: string;
  requested_by_name: string;
  requested_by_display?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  has_xray: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalOrderFormData {
  patient: string;
  reason: string;
  priority: 'low' | 'normal' | 'urgent';
  notes?: string;
}

export interface MedicalOrderStatusUpdateData {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface MedicalOrderFilters {
  search?: string;
  patient?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'urgent';
  requested_by?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedMedicalOrders {
  count: number;
  next: string | null;
  previous: string | null;
  results: MedicalOrder[];
}

// Opciones de prioridad
export const PRIORITY_CHOICES = [
  { value: 'low', label: 'Baja', color: '#3B82F6', bgColor: '#EFF6FF' },
  { value: 'normal', label: 'Normal', color: '#F59E0B', bgColor: '#FFFBEB' },
  { value: 'urgent', label: 'Urgente', color: '#DC2626', bgColor: '#7F1D1D' },
] as const;

// Opciones de estado
export const STATUS_CHOICES = [
  { value: 'pending', label: 'Pendiente', color: '#6B7280', bgColor: '#F3F4F6' },
  { value: 'in_progress', label: 'En Progreso', color: '#3B82F6', bgColor: '#EFF6FF' },
  { value: 'completed', label: 'Completada', color: '#10B981', bgColor: '#ECFDF5' },
  { value: 'cancelled', label: 'Cancelada', color: '#EF4444', bgColor: '#FEF2F2' },
] as const;

export const PRIORITY_ORDER = {
  urgent: 0,
  normal: 1,
  low: 2,
} as const;
