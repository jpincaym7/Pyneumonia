/**
 * Página de órdenes médicas
 * Implementa CRUD completo de órdenes de radiografía
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MdAdd, MdRefresh, MdWarning } from 'react-icons/md';
import medicalOrderService from '@/services/medical-order.service';
import patientService from '@/services/patient.service';
import { MedicalOrdersTable } from './MedicalOrdersTable';
import { MedicalOrderFormModal } from './MedicalOrderFormModal';
import { DeleteMedicalOrderModal } from './DeleteMedicalOrderModal';
import { MedicalOrderFiltersComponent } from './MedicalOrderFilters';
import {Toast} from '@/components/Toast';
import type { MedicalOrder, MedicalOrderFormData, MedicalOrderFilters } from '@/types/medical-order';
import type { Patient, PaginatedPatients } from '@/types/patient';

interface PageState {
  orders: MedicalOrder[];
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  filters: MedicalOrderFilters;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function MedicalOrdersPage() {
  const [pageState, setPageState] = useState<PageState>({
    orders: [],
    patients: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    filters: {},
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MedicalOrder | undefined>();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<MedicalOrder | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Función para mostrar toast
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Cargar pacientes
  const loadPatients = useCallback(async () => {
    try {
      const response = await patientService.list({ page: 1, page_size: 1000 });
      setPageState((prev) => ({ ...prev, patients: response.results }));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      showToast('warning', 'No se pudieron cargar todos los pacientes');
    }
  }, [showToast]);

  // Cargar órdenes
  const loadOrders = useCallback(async (page = 1, filters?: MedicalOrderFilters) => {
    setPageState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await medicalOrderService.list({
        ...filters,
        page,
        page_size: pageState.pageSize,
      });

      setPageState((prev) => ({
        ...prev,
        orders: response.results,
        currentPage: page,
        totalCount: response.count,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const message = (err?.message as string) || 'Error al cargar órdenes';
      setPageState((prev) => ({ ...prev, isLoading: false, error: message }));
      showToast('error', message);
    }
  }, [pageState.pageSize, showToast]);

  // Cargar datos iniciales
  useEffect(() => {
    loadPatients();
    loadOrders(1);
  }, []);

  // Manejar cambio de filtros
  const handleFilterChange = useCallback(
    (filters: MedicalOrderFilters) => {
      setPageState((prev) => ({ ...prev, filters }));
      loadOrders(1, filters);
    },
    [loadOrders]
  );

  // Abrir modal de crear
  const handleOpenCreateForm = () => {
    setSelectedOrder(undefined);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Abrir modal de editar
  const handleOpenEditForm = (order: MedicalOrder) => {
    setSelectedOrder({
      ...order,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Cerrar modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedOrder(undefined);
    setFormErrors({});
  };

  // Guardar orden (crear o actualizar)
  const handleSaveOrder = async (data: MedicalOrderFormData) => {
    try {
      setFormErrors({});
      if (selectedOrder?.id) {
        // Actualizar
        await medicalOrderService.update(selectedOrder.id, data);
        showToast('success', 'Orden médica actualizada correctamente');
      } else {
        // Crear
        await medicalOrderService.create(data);
        showToast('success', 'Orden médica creada correctamente');
      }
      handleCloseForm();
      loadOrders(1, pageState.filters);
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      if (err?.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        const data = response.data as Record<string, unknown>;
        if (typeof data === 'object' && data !== null) {
          setFormErrors(data as Record<string, string[]>);
        } else {
          showToast('error', (err?.message as string) || 'Error al guardar orden');
        }
      } else {
        showToast('error', (err?.message as string) || 'Error al guardar orden');
      }
    }
  };

  // Abrir modal de eliminar
  const handleOpenDeleteModal = (order: MedicalOrder) => {
    setOrderToDelete(order);
    setIsDeleteOpen(true);
  };

  // Cerrar modal de eliminar
  const handleCloseDeleteModal = () => {
    setIsDeleteOpen(false);
    setOrderToDelete(undefined);
  };

  // Eliminar orden
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await medicalOrderService.delete(orderToDelete.id);
      showToast('success', 'Orden médica eliminada correctamente');
      handleCloseDeleteModal();
      loadOrders(1, pageState.filters);
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      showToast('error', (err?.message as string) || 'Error al eliminar orden');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cambiar estado de orden
  const handleChangeOrderStatus = async (order: MedicalOrder, status: string) => {
    try {
      await medicalOrderService.updateStatus(order.id, status);
      showToast('success', 'Estado de la orden actualizado correctamente');
      loadOrders(pageState.currentPage, pageState.filters);
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      showToast('error', (err?.message as string) || 'Error al cambiar estado');
    }
  };

  // Recargar órdenes
  const handleRefresh = () => {
    loadOrders(1, pageState.filters);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes Médicas</h1>
          <p className="text-gray-600 mt-1">Gestión de órdenes de radiografía</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={pageState.isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={`w-5 h-5 ${pageState.isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleOpenCreateForm}
            disabled={pageState.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdAdd className="w-5 h-5" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {pageState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <MdWarning className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{pageState.error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <MedicalOrderFiltersComponent
        onFilterChange={handleFilterChange}
        isLoading={pageState.isLoading}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Total de Órdenes</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{pageState.totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {pageState.orders.filter((o) => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">En Progreso</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {pageState.orders.filter((o) => o.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Completadas</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {pageState.orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <MedicalOrdersTable
        orders={pageState.orders}
        isLoading={pageState.isLoading}
        currentPage={pageState.currentPage}
        totalPages={Math.ceil(pageState.totalCount / pageState.pageSize)}
        totalCount={pageState.totalCount}
        pageSize={pageState.pageSize}
        onPageChange={(page) => loadOrders(page, pageState.filters)}
        onEdit={handleOpenEditForm}
        onDelete={handleOpenDeleteModal}
        onStatusChange={handleChangeOrderStatus}
        canEdit={true}
        canDelete={true}
      />

      {/* Modals */}
      <MedicalOrderFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSaveOrder}
        initialData={
          selectedOrder
            ? {
                patient: selectedOrder.patient,
                reason: selectedOrder.reason,
                priority: selectedOrder.priority,
                notes: selectedOrder.notes,
                id: selectedOrder.id,
              }
            : undefined
        }
        patients={pageState.patients}
        isLoading={pageState.isLoading}
        errors={formErrors}
      />

      <DeleteMedicalOrderModal
        isOpen={isDeleteOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteOrder}
        order={orderToDelete}
        isLoading={isDeleting}
      />

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
}
