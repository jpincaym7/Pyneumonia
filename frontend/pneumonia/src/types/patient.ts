/**
 * Types para el módulo de pacientes
 */

export interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  phone?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PatientFormData {
  dni: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  phone?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  is_active?: boolean;
}

export interface PatientFilters {
  search?: string;
  is_active?: boolean;
  gender?: 'M' | 'F' | 'O';
  blood_type?: string;
  ordering?: string;
}

export interface PaginatedPatients {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

export const GENDER_CHOICES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' }
] as const;

export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
] as const;
