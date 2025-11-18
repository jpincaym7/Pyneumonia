/**
 * Servicio para gestionar radiografías (XRay) con validaciones
 */
import { apiClient } from '@/lib/api';
import { XRayImage, XRayFormData, XRayFilters, XRayListResponse } from '@/types/xray';

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

class XRayService {
  private baseUrl = '/diagnosis/xrays';

  /**
   * Validar datos de radiografía
   */
  private validateXRayData(data: XRayFormData): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (!data.patient) {
      errors.patient = ['El paciente es obligatorio'];
    }

    if (!data.image) {
      errors.image = ['La imagen es obligatoria'];
    } else {
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (data.image.size > maxFileSize) {
        errors.image = ['El archivo no debe exceder 50MB'];
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom'];
      if (!allowedTypes.includes(data.image.type)) {
        errors.image = ['Solo se aceptan archivos JPEG, PNG o DICOM'];
      }
    }

    if (data.description && data.description.length > 1000) {
      errors.description = ['La descripción no debe exceder 1000 caracteres'];
    }

    return errors;
  }

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
        message: 'Radiografía no encontrada',
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
   * Listar radiografías con filtros y paginación
   */
  async list(filters?: XRayFilters): Promise<XRayListResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.patient) params.patient = filters.patient;
      if (filters?.is_analyzed !== undefined) params.is_analyzed = String(filters.is_analyzed);
      if (filters?.quality) params.quality = filters.quality;
      if (filters?.view_position) params.view_position = filters.view_position;
      if (filters?.ordering) params.ordering = filters.ordering;

      return await apiClient.get<XRayListResponse>(`${this.baseUrl}/`, { params });
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener una radiografía por ID
   */
  async get(id: string): Promise<XRayImage> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.get<XRayImage>(`${this.baseUrl}/${id}/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Crear una nueva radiografía (con imagen)
   */
  async create(data: XRayFormData): Promise<XRayImage> {
    try {
      // Validar datos
      const validationErrors = this.validateXRayData(data);
      if (Object.keys(validationErrors).length > 0) {
        throw {
          response: {
            status: 400,
            data: validationErrors
          }
        };
      }

      const formData = new FormData();

      formData.append('patient', data.patient);
      if (data.image) {
        formData.append('image', data.image);
      }
      formData.append('description', data.description || '');
      formData.append('quality', data.quality || 'good');
      formData.append('view_position', data.view_position || 'PA');

      // Enviar el campo medical_order si está presente
      // @ts-ignore: permitir campo extra si se pasa desde el frontend
      if ((data as any).medical_order) {
        formData.append('medical_order', (data as any).medical_order);
      }

      return await apiClient.post<XRayImage>(`${this.baseUrl}/`, formData);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Actualizar una radiografía
   */
  async update(id: string, data: Partial<XRayFormData>): Promise<XRayImage> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }

      const formData = new FormData();

      if (data.patient) formData.append('patient', data.patient);
      if (data.image) formData.append('image', data.image);
      if (data.description !== undefined) formData.append('description', data.description);
      if (data.quality) formData.append('quality', data.quality);
      if (data.view_position) formData.append('view_position', data.view_position);

      return await apiClient.patch<XRayImage>(`${this.baseUrl}/${id}/`, formData);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Eliminar una radiografía
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
   * Marcar/desmarcar como analizada
   */
  async toggleAnalyzed(id: string): Promise<XRayImage> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      // El segundo argumento será el id de la orden médica
      const medicalOrderId = arguments.length > 1 ? arguments[1] : undefined;
      const payload = medicalOrderId ? { medical_order_id: medicalOrderId } : {};
      return await apiClient.post<XRayImage>(`${this.baseUrl}/${id}/toggle_analyzed/`, payload);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  // En xrayService
  async getUnassignedByPatient(patientId: string): Promise<XRay[]> {
    try {
      const response = await apiClient.get(
        `/diagnosis/xray-images/patient/${patientId}/unassigned/`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener radiografías de un paciente específico
   */
  async getByPatient(patientId: string, filters?: { is_analyzed?: boolean }): Promise<XRayImage[]> {
    try {
      if (!patientId || patientId.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID de paciente inválido' } } };
      }

      const params: Record<string, string> = {};
      if (filters?.is_analyzed !== undefined) {
        params.is_analyzed = String(filters.is_analyzed);
      }

      return await apiClient.get<XRayImage[]>(`${this.baseUrl}/patient/${patientId}/`, { params });
    } catch (error) {
      throw this.formatApiError(error);
    }
  }
}

const xrayService = new XRayService();
export default xrayService;
export type { ApiError };
