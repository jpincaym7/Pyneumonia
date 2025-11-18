/**
 * Servicio para gestionar diagnósticos con validaciones
 */
import { apiClient } from '@/lib/api';
import { DiagnosisResult, DiagnosisFormData, DiagnosisFilters, DiagnosisListResponse } from '@/types/diagnosis';

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

class DiagnosisService {
  private baseUrl = '/diagnosis/results';

  /**
   * Formatear errores de respuesta
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
        message: 'No tienes permisos para esta acción',
      };
    }

    if (status === 404) {
      return {
        status: 404,
        message: 'Diagnóstico no encontrado',
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
   * Listar diagnósticos con filtros y paginación
   */
  async list(filters?: DiagnosisFilters): Promise<DiagnosisListResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.predicted_class) params.predicted_class = filters.predicted_class;
      if (filters?.status) params.status = filters.status;
      if (filters?.is_reviewed !== undefined) params.is_reviewed = String(filters.is_reviewed);
      if (filters?.ordering) params.ordering = filters.ordering;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.page_size) params.page_size = String(filters.page_size);

      return await apiClient.get<DiagnosisListResponse>(`${this.baseUrl}/`, { params });
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener un diagnóstico por ID
   */
  async get(id: string): Promise<DiagnosisResult> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.get<DiagnosisResult>(`${this.baseUrl}/${id}/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Crear un nuevo diagnóstico
   */
  async create(data: DiagnosisFormData): Promise<DiagnosisResult> {
    try {
      if (!data.xray_id) {
        throw {
          response: {
            status: 400,
            data: { xray_id: ['La radiografía es obligatoria'] }
          }
        };
      }

      return await apiClient.post<DiagnosisResult>(`${this.baseUrl}/`, data);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Actualizar un diagnóstico
   */
  async update(id: string, data: Partial<DiagnosisFormData>): Promise<DiagnosisResult> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }

      // Validar notas médicas si existen
      if (data.medical_notes && data.medical_notes.length > 5000) {
        throw {
          response: {
            status: 400,
            data: { medical_notes: ['Las notas no deben exceder 5000 caracteres'] }
          }
        };
      }

      return await apiClient.patch<DiagnosisResult>(`${this.baseUrl}/${id}/`, data);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Eliminar un diagnóstico
   */
  async delete(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.delete(`${this.baseUrl}/${id}/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Marcar como revisado
   */
  async markReviewed(id: string): Promise<DiagnosisResult> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.post<DiagnosisResult>(`${this.baseUrl}/${id}/mark_reviewed/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Analizar una radiografía (enviar a Roboflow)
   */
  async analyzeXRay(xrayId: string): Promise<DiagnosisResult> {
    try {
      if (!xrayId || xrayId.trim().length === 0) {
        throw {
          response: {
            status: 400,
            data: { xray_id: ['ID de radiografía inválido'] }
          }
        };
      }
      return await apiClient.post<DiagnosisResult>(`/diagnosis/analyze/`, { xray_id: xrayId });
    } catch (error) {
      throw this.formatApiError(error);
    }
  }
}

const diagnosisService = new DiagnosisService();
export default diagnosisService;
export type { ApiError };
