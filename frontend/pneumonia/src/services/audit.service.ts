/**
 * Servicio para gestión de auditoría
 * Solo lectura - ViewSet ReadOnly
 */
import { apiClient } from '@/lib/api';
import type {
  AuditUser,
  AuditUserFilters,
  PaginatedAuditUsers,
} from '@/types/audit';

class AuditService {
  private baseUrl = '/security/audit/';

  /**
   * Obtener lista de registros de auditoría con paginación y filtros
   */
  async list(
    params?: AuditUserFilters & {
      page?: number;
      page_size?: number;
    }
  ): Promise<PaginatedAuditUsers> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<PaginatedAuditUsers>(url);
  }

  /**
   * Obtener registro de auditoría por ID
   */
  async get(id: number): Promise<AuditUser> {
    return apiClient.get<AuditUser>(`${this.baseUrl}${id}/`);
  }
}

const auditService = new AuditService();
export default auditService;
