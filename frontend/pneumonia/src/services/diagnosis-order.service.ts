/**
 * Servicio especializado para diagnósticos con validación de órdenes médicas
 * Este servicio extiende la funcionalidad del servicio base agregando validaciones
 * específicas para el flujo de órdenes médicas
 */
import { apiClient } from '@/lib/api';
import { DiagnosisResult } from '@/types/diagnosis';
import {
  XRayValidation,
  DiagnosisWithOrderResult,
  DiagnosisOrderFormData,
  DiagnosisOrderFilters,
  DiagnosisOrderListResponse,
  DiagnosisOrderCreateResponse,
  DiagnosisOrderServiceError,
  BatchValidationResult,
  XRayValidationItem,
  OrderDiagnosisStats,
  VALIDATION_MESSAGES,
  ValidationStatus,
} from '@/types/diagnosis.types';

class DiagnosisOrderService {
  private baseUrl = '/diagnosis/results';
  private xrayUrl = '/xrays';

  /**
   * Formatear errores de respuesta
   */
  private formatApiError(error: unknown): DiagnosisOrderServiceError {
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
        message: VALIDATION_MESSAGES.NO_PERMISSION,
      };
    }

    if (status === 404) {
      return {
        status: 404,
        message: 'Recurso no encontrado',
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
   * Validar que una radiografía tenga orden médica asociada
   */
  async validateXRayHasOrder(xrayId: string): Promise<XRayValidation> {
    try {
      const xray = await apiClient.get<any>(`${this.xrayUrl}/${xrayId}/`);
      
      return {
        id: xray.id,
        has_medical_order: !!xray.medical_order,
        medical_order_id: xray.medical_order,
        medical_order_details: xray.medical_order_details,
        is_analyzed: xray.is_analyzed || false,
        patient_name: xray.patient_name,
        patient_dni: xray.patient_dni,
        uploaded_at: xray.uploaded_at,
      };
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Crear diagnóstico con validación de orden médica
   */
  async createWithOrderValidation(data: DiagnosisOrderFormData): Promise<DiagnosisOrderCreateResponse> {
    try {
      // Validar que se proporcione el ID de radiografía
      if (!data.xray) {
        throw {
          response: {
            status: 400,
            data: { 
              xray: ['La radiografía es obligatoria'],
              non_field_errors: ['Debe seleccionar una radiografía para crear el diagnóstico']
            }
          }
        };
      }

      // Validar que la radiografía tenga orden médica
      const validation = await this.validateXRayHasOrder(data.xray);
      
      if (!validation.has_medical_order) {
        throw {
          response: {
            status: 400,
            data: { 
              xray: [VALIDATION_MESSAGES.MISSING_ORDER],
              non_field_errors: ['No se puede crear un diagnóstico para una radiografía sin orden médica']
            }
          }
        };
      }

      const warnings: string[] = [];

      // Validar que no esté ya analizada (opcional, según tu lógica de negocio)
      if (validation.is_analyzed && !data.force_create) {
        const confirmReAnalyze = confirm(
          'Esta radiografía ya tiene un diagnóstico. ¿Desea crear un nuevo análisis?'
        );
        if (!confirmReAnalyze) {
          throw {
            response: {
              status: 400,
              data: { 
                xray: [VALIDATION_MESSAGES.ALREADY_ANALYZED],
                non_field_errors: ['Operación cancelada por el usuario']
              }
            }
          };
        }
        warnings.push('Se creó un nuevo diagnóstico para una radiografía ya analizada');
      }

      // Crear el diagnóstico
      const diagnosis = await apiClient.post<DiagnosisWithOrderResult>(`${this.baseUrl}/`, data);
      
      return {
        diagnosis,
        validation,
        warnings: warnings.length > 0 ? warnings : undefined,
        messages: ['Diagnóstico creado exitosamente']
      };
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Analizar radiografía con validación de orden médica
   */
  async analyzeWithOrderValidation(xrayId: string): Promise<DiagnosisWithOrderResult> {
    try {
      if (!xrayId || xrayId.trim().length === 0) {
        throw {
          response: {
            status: 400,
            data: { 
              xray_id: ['ID de radiografía inválido'],
              non_field_errors: ['Debe proporcionar un ID válido de radiografía']
            }
          }
        };
      }

      // Validar que la radiografía tenga orden médica
      const validation = await this.validateXRayHasOrder(xrayId);
      
      if (!validation.has_medical_order) {
        throw {
          response: {
            status: 400,
            data: { 
              xray_id: [VALIDATION_MESSAGES.MISSING_ORDER],
              non_field_errors: ['No se puede analizar una radiografía sin orden médica. Por favor, cree primero una orden médica.']
            }
          }
        };
      }

      // Enviar a análisis
      const result = await apiClient.post<DiagnosisWithOrderResult>(`/diagnosis/analyze/`, { 
        xray_id: xrayId 
      });
      
      return result;
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Obtener diagnósticos de mis órdenes médicas
   */
  async getMyOrdersDiagnoses(filters?: DiagnosisOrderFilters): Promise<DiagnosisOrderListResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.predicted_class) params.predicted_class = filters.predicted_class;
      if (filters?.severity) params.severity = filters.severity;
      if (filters?.medical_order) params.medical_order = filters.medical_order;
      if (filters?.requested_by) params.requested_by = filters.requested_by;
      if (filters?.patient) params.patient = filters.patient;
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;
      if (filters?.has_order !== undefined) params.has_order = String(filters.has_order);
      if (filters?.is_reviewed !== undefined) params.is_reviewed = String(filters.is_reviewed);
      if (filters?.page) params.page = String(filters.page);
      if (filters?.page_size) params.page_size = String(filters.page_size);
      if (filters?.ordering) params.ordering = filters.ordering;

      return await apiClient.get<DiagnosisOrderListResponse>(
        `${this.baseUrl}/by-my-orders/`,
        { params }
      );
    } catch (error) {
      throw this.formatApiError(error);
    }
  }

  /**
   * Validar múltiples radiografías antes de crear diagnósticos en lote
   */
  async validateMultipleXRays(xrayIds: string[]): Promise<BatchValidationResult> {
    const valid: XRayValidationItem[] = [];
    const invalid: XRayValidationItem[] = [];

    for (const xrayId of xrayIds) {
      try {
        const validation = await this.validateXRayHasOrder(xrayId);
        
        if (!validation.has_medical_order) {
          invalid.push({
            id: xrayId,
            is_valid: false,
            reason: VALIDATION_MESSAGES.MISSING_ORDER,
            has_diagnosis: validation.is_analyzed,
          });
        } else if (validation.is_analyzed) {
          invalid.push({
            id: xrayId,
            is_valid: false,
            reason: VALIDATION_MESSAGES.ALREADY_ANALYZED,
            medical_order_id: validation.medical_order_id,
            has_diagnosis: true,
          });
        } else {
          valid.push({
            id: xrayId,
            is_valid: true,
            medical_order_id: validation.medical_order_id,
            has_diagnosis: false,
          });
        }
      } catch (error) {
        invalid.push({
          id: xrayId,
          is_valid: false,
          reason: 'Error al validar radiografía',
        });
      }
    }

    return {
      valid,
      invalid,
      total: xrayIds.length,
      valid_count: valid.length,
      invalid_count: invalid.length,
    };
  }

  /**
   * Obtener estadísticas de diagnósticos por orden médica
   */
  async getOrderDiagnosisStats(orderId: string): Promise<OrderDiagnosisStats> {
    try {
      // Este endpoint debería implementarse en el backend
      // Por ahora hacemos una llamada genérica
      const response = await apiClient.get<DiagnosisOrderListResponse>(
        `${this.baseUrl}/`,
        { params: { medical_order: orderId, page_size: 1000 } }
      );

      const diagnoses = response.results;
      const stats: OrderDiagnosisStats = {
        order_id: orderId,
        total_diagnoses: diagnoses.length,
        by_class: {},
        by_severity: {},
        reviewed_count: diagnoses.filter(d => d.is_reviewed).length,
        pending_review_count: diagnoses.filter(d => !d.is_reviewed).length,
        normal_count: diagnoses.filter(d => d.predicted_class === 'NORMAL').length,
        pneumonia_count: diagnoses.filter(d => d.predicted_class !== 'NORMAL').length,
        average_confidence: 0,
      };

      // Calcular confianza promedio
      if (diagnoses.length > 0) {
        const totalConfidence = diagnoses.reduce((sum, d) => {
          return sum + (d.confidence_percentage || parseFloat(d.confidence) * 100);
        }, 0);
        stats.average_confidence = totalConfidence / diagnoses.length;
      }

      // Agrupar por clase predicha
      diagnoses.forEach(d => {
        stats.by_class[d.predicted_class] = (stats.by_class[d.predicted_class] || 0) + 1;
        if (d.severity) {
          stats.by_severity[d.severity] = (stats.by_severity[d.severity] || 0) + 1;
        }
      });

      // Última fecha de diagnóstico
      if (diagnoses.length > 0) {
        const sortedByDate = [...diagnoses].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        stats.last_diagnosis_date = sortedByDate[0].created_at;
      }

      return stats;
    } catch (error) {
      throw this.formatApiError(error);
    }
  }
}

const diagnosisOrderService = new DiagnosisOrderService();
export default diagnosisOrderService;