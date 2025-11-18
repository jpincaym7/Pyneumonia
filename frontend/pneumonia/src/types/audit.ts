/**
 * Tipos TypeScript para Auditoría de Usuarios
 */

export type AuditAction = 'A' | 'M' | 'E'; // Adición, Modificación, Eliminación

export interface AuditUser {
  id: number;
  usuario: number;
  usuario_nombre: string;
  usuario_username: string;
  tabla: string;
  registroid: number;
  accion: AuditAction;
  accion_display: string;
  fecha: string;
  hora: string;
  estacion: string;
}

export interface AuditUserFilters {
  search?: string;
  usuario?: number;
  tabla?: string;
  accion?: AuditAction;
  fecha?: string;
  ordering?: string;
}

export interface PaginatedAuditUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditUser[];
}

export const AUDIT_ACTIONS: { value: AuditAction; label: string; color: string }[] = [
  { value: 'A', label: 'Adición', color: 'green' },
  { value: 'M', label: 'Modificación', color: 'blue' },
  { value: 'E', label: 'Eliminación', color: 'red' },
];
