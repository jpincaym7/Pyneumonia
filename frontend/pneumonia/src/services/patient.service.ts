/**
 * Servicio para gestión de pacientes con validaciones y manejo de errores
 * CRUD completo con permisos
 */
import { apiClient } from '@/lib/api';
import type { Patient, PatientFormData, PatientFilters, PaginatedPatients } from '@/types/patient';

// Tipos para errores
interface ValidationError {
  field: string;
  message: string;
}

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

class PatientService {
  private baseUrl = '/diagnosis/patients/';

  /**
   * Validar datos de paciente antes de enviar al backend
   */
  private validatePatientData(data: PatientFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar nombres
    if (!data.first_name || data.first_name.trim().length === 0) {
      errors.push({ field: 'first_name', message: 'El nombre es obligatorio' });
    } else if (data.first_name.length > 100) {
      errors.push({ field: 'first_name', message: 'El nombre no debe exceder 100 caracteres' });
    }

    if (!data.last_name || data.last_name.trim().length === 0) {
      errors.push({ field: 'last_name', message: 'El apellido es obligatorio' });
    } else if (data.last_name.length > 100) {
      errors.push({ field: 'last_name', message: 'El apellido no debe exceder 100 caracteres' });
    }

    // Validar DNI
    if (!data.dni || data.dni.trim().length === 0) {
      errors.push({ field: 'dni', message: 'La cédula es obligatoria' });
    } else {
      const dniPattern = /^\d{10}$/;
      const cleanDni = data.dni.replace(/[-\s]/g, '');
      if (!dniPattern.test(cleanDni)) {
        errors.push({ field: 'dni', message: 'La cédula debe tener 10 dígitos' });
      }
    }

    // Validar fecha de nacimiento
    if (!data.date_of_birth) {
      errors.push({ field: 'date_of_birth', message: 'La fecha de nacimiento es obligatoria' });
    } else {
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        errors.push({ field: 'date_of_birth', message: 'La fecha de nacimiento no puede ser en el futuro' });
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        errors.push({ field: 'date_of_birth', message: 'La edad parece ser inválida' });
      }
    }

    // Validar género
    if (!data.gender) {
      errors.push({ field: 'gender', message: 'El género es obligatorio' });
    } else if (!['M', 'F', 'O'].includes(data.gender)) {
      errors.push({ field: 'gender', message: 'Género no válido' });
    }

    // Validar teléfono (opcional)
    if (data.phone) {
      const phonePattern = /^09\d{8}$/;
      const cleanPhone = data.phone.replace(/[-\s()]/g, '');
      if (!phonePattern.test(cleanPhone)) {
        errors.push({ field: 'phone', message: 'El teléfono debe comenzar con 09 y tener 10 dígitos' });
      }
    }

    // Validar email (opcional)
    if (data.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.email)) {
        errors.push({ field: 'email', message: 'El formato del email no es válido' });
      }
    }

    return errors;
  }

  /**
   * Formatear errores de respuesta del servidor
   */
  private formatApiError(error: unknown): ApiError {
    const err = error as Record<string, unknown>;
    const response = err?.response as Record<string, unknown>;
    const status = response?.status as number || 500;
    const data = response?.data as Record<string, unknown>;

    if (status === 400 && data) {
      return {
        status: 400,
        message: 'Error de validación',
        errors: data as Record<string, string[]>,
      };
    }

    if (status === 403) {
      return {
        status: 403,
        message: 'No tienes permisos para realizar esta acción',
      };
    }

    if (status === 404) {
      return {
        status: 404,
        message: 'Paciente no encontrado',
      };
    }

    if (status === 409) {
      return {
        status: 409,
        message: 'El DNI ya existe en el sistema',
      };
    }

    if (status >= 500) {
      return {
        status,
        message: 'Error del servidor. Por favor, intenta más tarde',
      };
    }

    return {
      status,
      message: (data?.detail as string) || 'Error desconocido',
    };
  }

  /**
   * Obtener lista de pacientes con paginación y filtros
   */
  async list(params?: PatientFilters & {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedPatients> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;
      return await apiClient.get<PaginatedPatients>(url);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Obtener paciente por ID
   */
  async get(id: string): Promise<Patient> {
    try {
      if (!id || id.trim().length === 0) {
        throw {
          response: {
            status: 400,
            data: { detail: 'ID de paciente inválido' }
          }
        };
      }
      return await apiClient.get<Patient>(`${this.baseUrl}${id}/`);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Crear nuevo paciente con validaciones
   */
  async create(data: PatientFormData): Promise<Patient> {
    // Validaciones locales
    const validationErrors = this.validatePatientData(data);
    if (validationErrors.length > 0) {
      const errors: Record<string, string[]> = {};
      validationErrors.forEach(err => {
        errors[err.field] = [err.message];
      });
      throw {
        response: {
          status: 400,
          data: errors
        }
      };
    }

    try {
      // Normalizar datos
      const cleanedData = {
        ...data,
        first_name: data.first_name.trim().charAt(0).toUpperCase() + data.first_name.trim().slice(1).toLowerCase(),
        last_name: data.last_name.trim().charAt(0).toUpperCase() + data.last_name.trim().slice(1).toLowerCase(),
        dni: data.dni.replace(/[-\s]/g, ''),
        phone: data.phone ? data.phone.replace(/[-\s()]/g, '') : undefined,
      };

      return await apiClient.post<Patient>(this.baseUrl, cleanedData);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Actualizar paciente con validaciones
   */
  async update(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de paciente inválido');
      }

      // Normalizar datos si existen
      const cleanedData = { ...data };
      if (cleanedData.first_name) {
        cleanedData.first_name = cleanedData.first_name.trim();
      }
      if (cleanedData.last_name) {
        cleanedData.last_name = cleanedData.last_name.trim();
      }
      if (cleanedData.dni) {
        cleanedData.dni = cleanedData.dni.replace(/[-\s]/g, '');
      }
      if (cleanedData.phone) {
        cleanedData.phone = cleanedData.phone.replace(/[-\s()]/g, '');
      }

      return await apiClient.patch<Patient>(`${this.baseUrl}${id}/`, cleanedData);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Eliminar paciente
   */
  async delete(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de paciente inválido');
      }
      return await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Activar/desactivar paciente
   */
  async toggleActive(id: string, is_active: boolean): Promise<Patient> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de paciente inválido');
      }
      return await apiClient.patch<Patient>(`${this.baseUrl}${id}/`, { is_active });
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }
}

const patientService = new PatientService();
export default patientService;
export type { ValidationError, ApiError };
