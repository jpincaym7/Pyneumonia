/**
 * Componente de tabla de órdenes médicas con acciones
 */
'use client';

import React from 'react';
import { MedicalOrder, STATUS_CHOICES, PRIORITY_CHOICES } from '@/types/medical-order';
import {
  MdEdit,
  MdDelete,
  MdNavigateBefore,
  MdNavigateNext,
  MdListAlt,
  MdCheckCircle,
  MdPending,
  MdCancel,
} from 'react-icons/md';

interface MedicalOrdersTableProps {
  orders: Array<MedicalOrder & {
    disableEdit?: boolean;
    disableDelete?: boolean;
    editTooltip?: string;
    deleteTooltip?: string;
  }>;
  onEdit?: (order: MedicalOrder) => void;
  onDelete?: (order: MedicalOrder) => void;
  onStatusChange?: (order: MedicalOrder, status: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isLoading?: boolean;
  // Paginación
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export const MedicalOrdersTable: React.FC<MedicalOrdersTableProps> = ({
  orders,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = false,
  canDelete = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Cargando órdenes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <MdListAlt className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No se encontraron órdenes médicas</p>
        <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    const choice = PRIORITY_CHOICES.find((p) => p.value === priority);
    return choice ? { color: choice.color, bgColor: choice.bgColor } : {};
  };

  const getPriorityLabel = (value: string) => {
    return PRIORITY_CHOICES.find((p) => p.value === value)?.label || value;
  };

  const getStatusColor = (status: string) => {
    const choice = STATUS_CHOICES.find((s) => s.value === status);
    return choice
      ? { color: choice.color, bgColor: choice.bgColor }
      : { color: '#6B7280', bgColor: '#F3F4F6' };
  };

  const getStatusLabel = (value: string) => {
    return STATUS_CHOICES.find((s) => s.value === value)?.label || value;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <MdCheckCircle className="w-5 h-5" />;
      case 'in_progress':
        return <MdPending className="w-5 h-5" />;
      case 'cancelled':
        return <MdCancel className="w-5 h-5" />;
      default:
        return <MdPending className="w-5 h-5" />;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            de <span className="font-medium">{totalCount}</span> resultados
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdNavigateBefore className="w-5 h-5" />
            </button>

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  page === currentPage
                    ? 'z-10 border-blue-500 bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdNavigateNext className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Determinar si alguna orden puede ser editada o eliminada
  const hasActions = orders.some(
    (order) =>
      (canEdit && !order.disableEdit) ||
      (canDelete && !order.disableDelete)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitado por</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radiografía</th>
              {hasActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const priorityColor = getPriorityColor(order.priority);
              const statusColor = getStatusColor(order.status);

              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">{order.patient_name}</p>
                      <p className="text-xs text-gray-500">{order.patient_dni}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 max-w-xs truncate">{order.reason}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{ color: priorityColor.color, backgroundColor: priorityColor.bgColor }}
                    >
                      {getPriorityLabel(order.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="px-3 py-1 inline-flex items-center gap-2 text-xs leading-5 font-semibold rounded-full"
                      style={{ color: statusColor.color, backgroundColor: statusColor.bgColor }}
                    >
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{order.requested_by_name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-md"
                      style={{
                        backgroundColor: order.has_xray ? '#ECFDF5' : '#FEF2F2',
                        color: order.has_xray ? '#059669' : '#DC2626',
                      }}
                    >
                      {order.has_xray ? 'Sí' : 'No'}
                    </span>
                  </td>
                  {hasActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {canEdit && !order.disableEdit && (
                          <button
                            onClick={() => onEdit?.(order)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title={order.editTooltip || 'Editar'}
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && !order.disableDelete && (
                          <button
                            onClick={() => onDelete?.(order)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title={order.deleteTooltip || 'Eliminar'}
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        )}
                        {onStatusChange && order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => onStatusChange(order, 'cancelled')}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <MdCancel className="w-5 h-5" />
                            </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};
