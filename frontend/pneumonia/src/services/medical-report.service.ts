/**
 * Servicio para gestionar reportes médicos con validaciones
 * Solo genera reportes para diagnósticos con orden médica
 */
import { apiClient } from '@/lib/api';
import { MedicalReport, MedicalReportFormData, MedicalReportFilters, MedicalReportListResponse } from '@/types/report';


interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== SERVICIO ====================

class MedicalReportService {
  private baseUrl = '/diagnosis/medical-reports';

  /**
   * Formatear errores de respuesta
   */
  private formatApiError(error: unknown): ApiError {
    const err = error as Record<string, unknown>;
    const response = err?.response as Record<string, unknown>;
    const status = response?.status as number || 500;
    const data = response?.data as Record<string, unknown>;

    if (status === 400 && data) {
      // Error de validación
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
        message: 'Reporte médico no encontrado',
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
      message: (data?.detail as string) || (data?.error as string) || 'Error desconocido',
    };
  }

  /**
   * Validar datos antes de enviar al backend
   */
  private validateReportData(data: MedicalReportFormData): void {
    const errors: Record<string, string[]> = {};

    if (!data.diagnosis || data.diagnosis.trim().length === 0) {
      errors.diagnosis = ['El diagnóstico es obligatorio'];
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.title = ['El título es obligatorio'];
    } else if (data.title.length > 200) {
      errors.title = ['El título no debe exceder 200 caracteres'];
    }

    if (!data.findings || data.findings.trim().length === 0) {
      errors.findings = ['Los hallazgos son obligatorios'];
    } else if (data.findings.length > 5000) {
      errors.findings = ['Los hallazgos no deben exceder 5000 caracteres'];
    }

    if (!data.impression || data.impression.trim().length === 0) {
      errors.impression = ['La impresión diagnóstica es obligatoria'];
    } else if (data.impression.length > 2000) {
      errors.impression = ['La impresión no debe exceder 2000 caracteres'];
    }

    if (data.recommendations && data.recommendations.length > 3000) {
      errors.recommendations = ['Las recomendaciones no deben exceder 3000 caracteres'];
    }

    if (Object.keys(errors).length > 0) {
      throw {
        response: {
          status: 400,
          data: errors
        }
      };
    }
  }

  /**
   * Listar reportes médicos con filtros y paginación
   */
  async list(filters?: MedicalReportFilters): Promise<MedicalReportListResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.status) params.status = filters.status;
      if (filters?.patient) params.patient = filters.patient;
      if (filters?.medical_order) params.medical_order = filters.medical_order;
      if (filters?.diagnosis) params.diagnosis = filters.diagnosis;
      if (filters?.ordering) params.ordering = filters.ordering;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.page_size) params.page_size = String(filters.page_size);

      return await apiClient.get<MedicalReportListResponse>(`${this.baseUrl}/`, { params });
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener un reporte médico por ID
   */
  async get(id: string): Promise<MedicalReport> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.get<MedicalReport>(`${this.baseUrl}/${id}/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Crear un nuevo reporte médico
   * IMPORTANTE: Solo para diagnósticos con orden médica
   */
  async create(data: MedicalReportFormData): Promise<MedicalReport> {
    try {
      // Validar datos localmente primero
      this.validateReportData(data);

      return await apiClient.post<MedicalReport>(`${this.baseUrl}/`, data);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Actualizar un reporte médico
   * Solo si está en estado 'draft'
   */
  async update(id: string, data: Partial<MedicalReportFormData>): Promise<MedicalReport> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }

      // Validar longitud de campos si existen
      const errors: Record<string, string[]> = {};
      
      if (data.title && data.title.length > 200) {
        errors.title = ['El título no debe exceder 200 caracteres'];
      }
      if (data.findings && data.findings.length > 5000) {
        errors.findings = ['Los hallazgos no deben exceder 5000 caracteres'];
      }
      if (data.impression && data.impression.length > 2000) {
        errors.impression = ['La impresión no debe exceder 2000 caracteres'];
      }
      if (data.recommendations && data.recommendations.length > 3000) {
        errors.recommendations = ['Las recomendaciones no deben exceder 3000 caracteres'];
      }

      if (Object.keys(errors).length > 0) {
        throw { response: { status: 400, data: errors } };
      }

      return await apiClient.patch<MedicalReport>(`${this.baseUrl}/${id}/`, data);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Eliminar un reporte médico
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
   * Firmar reporte como radiólogo
   * Cambia el estado de 'draft' a 'final'
   */
  async radiologistSign(id: string): Promise<MedicalReport> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.post<MedicalReport>(`${this.baseUrl}/${id}/radiologist_sign/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Recibir reporte como médico tratante
   * Cambia el estado de 'final' a 'revised'
   */
  async physicianReceive(id: string): Promise<MedicalReport> {
    try {
      if (!id || id.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID inválido' } } };
      }
      return await apiClient.post<MedicalReport>(`${this.baseUrl}/${id}/physician_receive/`);
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener reportes por orden médica
   */
  async getByOrder(orderId: string): Promise<MedicalReportListResponse> {
    try {
      if (!orderId || orderId.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID de orden inválido' } } };
      }
      return await apiClient.get<MedicalReportListResponse>(
        `${this.baseUrl}/by-order/${orderId}/`
      );
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener reportes por paciente
   */
  async getByPatient(patientId: string): Promise<MedicalReportListResponse> {
    try {
      if (!patientId || patientId.trim().length === 0) {
        throw { response: { status: 400, data: { detail: 'ID de paciente inválido' } } };
      }
      return await apiClient.get<MedicalReportListResponse>(
        `${this.baseUrl}/by-patient/${patientId}/`
      );
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Verificar si un diagnóstico puede tener un reporte
   * (debe tener orden médica y estar completado)
   */
  canCreateReport(diagnosis: {
    status: string;
    xray: {
      medical_order: unknown;
    };
  }): { canCreate: boolean; reason?: string } {
    if (!diagnosis.xray.medical_order) {
      return {
        canCreate: false,
        reason: 'El diagnóstico debe estar asociado a una orden médica',
      };
    }

    if (diagnosis.status !== 'completed') {
      return {
        canCreate: false,
        reason: 'El diagnóstico debe estar completado',
      };
    }

    return { canCreate: true };
  }
}

const medicalReportService = new MedicalReportService();
export default medicalReportService;
export type { ApiError };