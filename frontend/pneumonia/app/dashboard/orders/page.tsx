/**
 * Página de órdenes médicas
 * Implementa CRUD completo de órdenes de radiografía
 * Optimizado para evitar peticiones innecesarias
 */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/src/lib/api';
import { MdAdd, MdRefresh, MdWarning } from 'react-icons/md';
import medicalOrderService from '@/services/medical-order.service';
import { ToastContainer, useToast } from '@/src/components/Toast';
import patientService from '@/services/patient.service';
import xrayService from '@/services/xray.service';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { MedicalOrdersTable } from '@/src/components/orders/MedicalOrdersTable';
import { MedicalOrderFormModal } from '@/src/components/orders/MedicalOrderFormModal';
import { DeleteMedicalOrderModal } from '@/src/components/orders/DeleteMedicalOrderModal';
import { MedicalOrderFiltersComponent } from '@/src/components/orders/MedicalOrderFilters';
import type { MedicalOrder, MedicalOrderFormData, MedicalOrderFilters } from '@/types/medical-order';
import type { Patient } from '@/types/patient';

interface PageState {
  orders: MedicalOrder[];
  patients: Patient[];
  xrays: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  filters: MedicalOrderFilters;
}

export default function MedicalOrdersPage() {
  // Estado para el grupo del usuario
  const [userGroup, setUserGroup] = useState<string | null>(null);
  const [isGroupLoading, setIsGroupLoading] = useState(true);
  const { hasPermission, isChecking, showNoPermissionModal, errorMessage } = usePermissionCheck({
    moduleUrl: '/dashboard/orders',
    autoCheck: true,
    autoRedirect: true,
    redirectTo: '/dashboard',
    redirectDelay: 2,
  });

  const [pageState, setPageState] = useState<PageState>({
    orders: [],
    patients: [],
    xrays: {},
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    filters: {},
  });

  const { toasts, success, error: showError, warning, removeToast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MedicalOrder | undefined>();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<MedicalOrder | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs para evitar múltiples llamadas
  const isMountedRef = useRef(false);
  const patientsLoadedRef = useRef(false);
  const ordersLoadedRef = useRef(false);

  // Cargar pacientes (solo una vez)
  const loadPatients = useCallback(async () => {
    if (patientsLoadedRef.current) return;
    
    try {
      patientsLoadedRef.current = true;
      const response = await patientService.list({ page: 1, page_size: 1000 });
      setPageState((prev) => ({ ...prev, patients: response.results }));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      patientsLoadedRef.current = false;
      warning('No se pudieron cargar todos los pacientes');
    }
  }, [warning]);

  // Cargar radiografías (solo una vez)
  const loadXRays = useCallback(async () => {
    try {
      const response = await xrayService.list({ page_size: 1000 });
      
      // Crear un mapa de paciente -> cantidad de radiografías
      const xrayMap: Record<string, number> = {};
      response.results.forEach((xray: { patient: string | number }) => {
        const patientId = String(xray.patient);
        xrayMap[patientId] = (xrayMap[patientId] || 0) + 1;
      });
      
      setPageState((prev) => ({ ...prev, xrays: xrayMap }));
    } catch (error) {
      console.error('Error al cargar radiografías:', error);
      warning('No se pudieron cargar las radiografías');
    }
  }, [warning]);

  // Cargar órdenes con control de duplicados
  const loadOrders = useCallback(async (page: number, filters?: MedicalOrderFilters) => {
    setPageState((prev) => {
      // No hacer nada si ya está cargando
      if (prev.isLoading) return prev;
      
      return { ...prev, isLoading: true, error: null };
    });

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
      showError(message);
    }
  }, [pageState.pageSize, showError]);

  // Cargar datos iniciales y grupo de usuario (solo una vez al montar)
  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const initializeData = async () => {
      try {
        setIsGroupLoading(true);
        const resp = await apiClient.getUserGroup();
        console.log(resp)
        setUserGroup(resp.group);
      } catch (e) {
        setUserGroup(null);
      } finally {
        setIsGroupLoading(false);
      }
      await loadPatients();
      await loadXRays();
      if (!ordersLoadedRef.current) {
        ordersLoadedRef.current = true;
        await loadOrders(1);
      }
    };

    initializeData();
  }, [loadPatients, loadXRays, loadOrders]);

  // Manejar cambio de filtros
  const handleFilterChange = useCallback(
    (filters: MedicalOrderFilters) => {
      setPageState((prev) => ({ ...prev, filters, currentPage: 1 }));
      loadOrders(1, filters);
    },
    [loadOrders]
  );

  // Abrir modal de crear
  const handleOpenCreateForm = useCallback(() => {
    setSelectedOrder(undefined);
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  // Abrir modal de editar
  const handleOpenEditForm = useCallback((order: MedicalOrder) => {
    setSelectedOrder({ ...order });
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  // Cerrar modal
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedOrder(undefined);
    setFormErrors({});
  }, []);

  // Guardar orden (crear o actualizar)
  const handleSaveOrder = useCallback(async (data: MedicalOrderFormData) => {
    try {
      setFormErrors({});
      console.log('handleSaveOrder: datos recibidos', data);
      if (selectedOrder?.id) {
        console.log('Llamando a medicalOrderService.update', selectedOrder.id, data);
        const resp = await medicalOrderService.update(selectedOrder.id, data);
        console.log('Respuesta update:', resp);
        success('Orden médica actualizada correctamente');
      } else {
        console.log('Llamando a medicalOrderService.create', data);
        const resp = await medicalOrderService.create(data);
        console.log('Respuesta create:', resp);
        success('Orden médica creada correctamente');
      }
      handleCloseForm();
      // Recargar con los filtros actuales
      loadOrders(pageState.currentPage, pageState.filters);
    } catch (err: unknown) {
      console.error('Error en handleSaveOrder:', err);
      const errorObj = err as Record<string, unknown>;
      if (errorObj?.response && typeof errorObj.response === 'object') {
        const response = errorObj.response as Record<string, unknown>;
        const responseData = response.data as Record<string, unknown>;
        if (typeof responseData === 'object' && responseData !== null) {
          setFormErrors(responseData as Record<string, string[]>);
        } else {
          showError((errorObj?.message as string) || 'Error al guardar orden');
        }
      } else {
        showError((errorObj?.message as string) || 'Error al guardar orden');
      }
    }
  }, [selectedOrder, success, showError, handleCloseForm, loadOrders, pageState.currentPage, pageState.filters]);

  // Abrir modal de eliminar
  const handleOpenDeleteModal = useCallback((order: MedicalOrder) => {
    setOrderToDelete(order);
    setIsDeleteOpen(true);
  }, []);

  // Cerrar modal de eliminar
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteOpen(false);
    setOrderToDelete(undefined);
  }, []);

  // Eliminar orden
  const handleDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await medicalOrderService.delete(orderToDelete.id);
      success('Orden médica eliminada correctamente');
      handleCloseDeleteModal();
      
      // Si estamos en una página que ya no existe después de eliminar, ir a la anterior
      const newTotalCount = pageState.totalCount - 1;
      const maxPage = Math.ceil(newTotalCount / pageState.pageSize);
      const targetPage = pageState.currentPage > maxPage ? maxPage : pageState.currentPage;
      
      loadOrders(targetPage || 1, pageState.filters);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown>;
      showError((errorObj?.message as string) || 'Error al eliminar orden');
    } finally {
      setIsDeleting(false);
    }
  }, [orderToDelete, success, showError, handleCloseDeleteModal, loadOrders, pageState]);

  // Cambiar estado de orden
  const handleChangeOrderStatus = useCallback(async (order: MedicalOrder, status: string) => {
    try {
      // Si el nuevo estado es 'completed', relacionar las radiografías con la orden médica
      if (status === 'completed') {
        // Obtener radiografías del paciente
        const xrays = await xrayService.getByPatient(order.patient);
        // Relacionar cada radiografía con la orden médica
        for (const xray of xrays) {
          if (!xray.medical_order || xray.medical_order !== order.id) {
            await xrayService.toggleAnalyzed(xray.id, order.id);
          }
        }
      }
      await medicalOrderService.updateStatus(order.id, status);
      success('Estado de la orden actualizado correctamente');
      loadOrders(pageState.currentPage, pageState.filters);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown>;
      showError((errorObj?.message as string) || 'Error al cambiar estado');
    }
  }, [success, showError, loadOrders, pageState.currentPage, pageState.filters]);

  // Recargar órdenes manualmente
  const handleRefresh = useCallback(() => {
    loadOrders(pageState.currentPage, pageState.filters);
  }, [loadOrders, pageState.currentPage, pageState.filters]);

  // Cambiar página
  const handlePageChange = useCallback((page: number) => {
    loadOrders(page, pageState.filters);
  }, [loadOrders, pageState.filters]);

  // Mostrar loading mientras se verifica grupo o permisos
  if (isChecking || isGroupLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Mostrar acceso denegado si no tiene permisos
  if (!hasPermission && showNoPermissionModal) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="max-w-md text-center bg-white rounded-lg p-8 border border-gray-200">
          <MdWarning className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-2">{errorMessage}</p>
          <p className="text-sm text-gray-500">Redirigiendo en 2 segundos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene permisos, no mostrar nada (se redirigirá automáticamente)
  if (!hasPermission) {
    return null;
  }

  // Filtrar órdenes completadas solo si el filtro lo solicita
  const showCompleted = pageState.filters?.status === 'completed';
  const filteredOrders = showCompleted
    ? pageState.orders.filter((o) => o.status === 'completed')
    : pageState.orders.filter((o) => o.status !== 'completed');

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
          {/* Solo el médico puede crear órdenes */}
          {userGroup === 'Médicos' && (
            <button
              onClick={handleOpenCreateForm}
              disabled={pageState.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdAdd className="w-5 h-5" />
              Nueva Orden
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {pageState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
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
            {filteredOrders.filter((o) => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">En Progreso</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {filteredOrders.filter((o) => o.status === 'in_progress').length}
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
        orders={filteredOrders.map((order) => {
          console.log('Procesando orden para tabla:', order);
          let patientObj = null;
          if (typeof order.patient === 'object' && order.patient !== null) {
            patientObj = order.patient;
          } else {
            patientObj = pageState.patients.find((p) => p.id === order.patient);
          }
          // Nueva lógica: verificar si hay radiografía asociada a la orden
          let hasXrayForOrder = false;
          if (Array.isArray(order.xrays) && order.xrays.length > 0) {
            // Si la orden tiene un array de radiografías asociadas
            hasXrayForOrder = order.xrays.some((xray: any) => xray.medical_order === order.id);
          } else if (pageState.xrays && order.id) {
            // Si existe un mapeo de radiografías por orden
            // (Opcional: si tienes un mapeo por orden, úsalo aquí)
            // hasXrayForOrder = Boolean(pageState.xraysByOrder?.[order.id]);
            // Si solo tienes por paciente, no se puede saber con certeza
            hasXrayForOrder = false;
          }
          return {
            ...order,
            patient_name: patientObj?.full_name || '',
            patient_dni: patientObj?.dni || '',
            has_xray: hasXrayForOrder,
            disableEdit: order.status === 'completed' || userGroup !== 'Médicos',
            disableDelete: order.status === 'completed' || userGroup !== 'Médicos',
            // Tooltip para acciones deshabilitadas
            editTooltip:
              order.status === 'completed'
                ? 'No puedes editar una orden completada'
                : userGroup !== 'Médicos'
                ? 'Solo el médico puede editar órdenes'
                : '',
            deleteTooltip:
              order.status === 'completed'
                ? 'No puedes eliminar una orden completada'
                : userGroup !== 'Médicos'
                ? 'Solo el médico puede eliminar órdenes'
                : '',
          };
        })}
        isLoading={pageState.isLoading}
        currentPage={pageState.currentPage}
        totalPages={Math.ceil(pageState.totalCount / pageState.pageSize)}
        totalCount={pageState.totalCount}
        pageSize={pageState.pageSize}
        onPageChange={handlePageChange}
        onEdit={(order) => {
          if (order.status === 'completed' || userGroup !== 'Médicos') return;
          handleOpenEditForm(order);
        }}
        onDelete={(order) => {
          if (order.status === 'completed' || userGroup !== 'Médicos') return;
          handleOpenDeleteModal(order);
        }}
        onStatusChange={userGroup === 'Médicos' ? handleChangeOrderStatus : undefined}
        canEdit={userGroup === 'Médicos'}
        canDelete={userGroup === 'Médicos'}
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}