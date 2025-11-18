/**
 * Servicio para gestión de órdenes médicas con validaciones
 * CRUD completo con permisos
 */
import { apiClient } from '@/lib/api';
import type {
  MedicalOrder,
  MedicalOrderFormData,
  MedicalOrderStatusUpdateData,
  MedicalOrderFilters,
  PaginatedMedicalOrders,
} from '@/types/medical-order';

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

class MedicalOrderService {
  private baseUrl = '/diagnosis/medical-orders/';

  /**
   * Validar datos de orden médica antes de enviar al backend
   */
  private validateOrderData(data: MedicalOrderFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar paciente
    if (!data.patient || data.patient.trim().length === 0) {
      errors.push({ field: 'patient', message: 'El paciente es obligatorio' });
    }

    // Validar razón
    if (!data.reason || data.reason.trim().length === 0) {
      errors.push({ field: 'reason', message: 'La razón de la radiografía es obligatoria' });
    } else if (data.reason.length > 500) {
      errors.push({ field: 'reason', message: 'La razón no debe exceder 500 caracteres' });
    }

    // Validar prioridad
    if (!data.priority) {
      errors.push({ field: 'priority', message: 'La prioridad es obligatoria' });
    } else if (!['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
      errors.push({ field: 'priority', message: 'Prioridad no válida' });
    }

    // Validar notas (opcional)
    if (data.notes && data.notes.length > 1000) {
      errors.push({ field: 'notes', message: 'Las notas no deben exceder 1000 caracteres' });
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
        message: 'Orden médica no encontrada',
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
   * Obtener lista de órdenes con paginación y filtros
   */
  async list(
    params?: MedicalOrderFilters & {
      page?: number;
      page_size?: number;
    }
  ): Promise<PaginatedMedicalOrders> {
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
      return await apiClient.get<PaginatedMedicalOrders>(url);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Obtener orden por ID
   */
  async get(id: string): Promise<MedicalOrder> {
    try {
      if (!id || id.trim().length === 0) {
        throw {
          response: {
            status: 400,
            data: { detail: 'ID de orden inválido' },
          },
        };
      }
      return await apiClient.get<MedicalOrder>(`${this.baseUrl}${id}/`);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Crear nueva orden médica con validaciones
   */
  async create(data: MedicalOrderFormData): Promise<MedicalOrder> {
    // Validaciones locales
    const validationErrors = this.validateOrderData(data);
    if (validationErrors.length > 0) {
      const errors: Record<string, string[]> = {};
      validationErrors.forEach((err) => {
        errors[err.field] = [err.message];
      });
      throw {
        response: {
          status: 400,
          data: errors,
        },
      };
    }

    try {
      // Normalizar datos
      const cleanedData = {
        ...data,
        reason: data.reason.trim(),
        notes: data.notes ? data.notes.trim() : undefined,
      };

      return await apiClient.post<MedicalOrder>(this.baseUrl, cleanedData);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Actualizar orden médica con validaciones
   */
  async update(id: string, data: Partial<MedicalOrderFormData>): Promise<MedicalOrder> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de orden inválido');
      }

      // Normalizar datos si existen
      const cleanedData: Partial<MedicalOrderFormData> = {};
      if (data.reason) {
        cleanedData.reason = data.reason.trim();
      }
      if (data.priority) {
        cleanedData.priority = data.priority;
      }
      if (data.notes !== undefined) {
        cleanedData.notes = data.notes ? data.notes.trim() : undefined;
      }

      return await apiClient.patch<MedicalOrder>(`${this.baseUrl}${id}/`, cleanedData);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Actualizar estado de la orden médica
   */
  async updateStatus(id: string, status: string): Promise<MedicalOrder> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de orden inválido');
      }

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Estado no válido');
      }

      return await apiClient.post<MedicalOrder>(
        `${this.baseUrl}${id}/update_status/`,
        { status }
      );
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }

  /**
   * Eliminar orden médica
   */
  async delete(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new Error('ID de orden inválido');
      }
      return await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error) {
      const apiError = this.formatApiError(error);
      throw apiError;
    }
  }
}

const medicalOrderService = new MedicalOrderService();
export default medicalOrderService;
export type { ValidationError, ApiError };
