/**
 * Página de Gestión de Órdenes Médicas de Radiografías
 * Interfaz profesional moderna para radiología con eliminación integrada
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import xrayService from '@/services/xray.service';
import medicalOrderService from '@/services/medical-order.service';
import { useXRayPermissions } from '@/hooks/useXRayPermissions';
import { useDiagnosisPermissions } from '@/hooks/useDiagnosisPermissions';
import { ToastContainer, useToast } from '@/components/Toast';
import { XRayGridCard } from '@/components/xrays/XRayGridCard';
import { XRayViewerModal } from '@/components/xrays/XRayViewerModal';
import { UploadXRayModal } from '@/components/xrays/UploadXRayModal';
import { EditXRayModal } from '@/components/xrays/EditXRayModal';
import { DeleteXRayModal } from '@/components/xrays/DeleteXRayModal';
import { XRayImage, XRayFormData } from '@/types/xray';
import type { MedicalOrder } from '@/types/medical-order';
import { PRIORITY_CHOICES, STATUS_CHOICES, PRIORITY_ORDER } from '@/types/medical-order';
import {
  MdImage,
  MdSearch,
  MdPerson,
  MdHealthAndSafety,
  MdRefresh,
  MdErrorOutline,
  MdCloudUpload,
  MdArrowBack,
  MdArrowForward,
  MdExpandMore,
} from 'react-icons/md';

const ZOOM_STEP = 0.25;

export default function RadiografiasPage() {
  const { canView, canAdd, canChange, isLoading: permissionsLoading } = useXRayPermissions();
  const { canAdd: canAddDiagnosis } = useDiagnosisPermissions();
  const { toasts, removeToast, success, error: showError } = useToast();

  // Estado
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [xrays, setXrays] = useState<XRayImage[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingXRays, setIsLoadingXRays] = useState(false);

  // Selección
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedXRayId, setSelectedXRayId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [imageZoom, setImageZoom] = useState(1);
  const [currentXRayPage, setCurrentXRayPage] = useState(0);
  const xraysPerPage = 6;

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const hasLoadedRef = useRef(false);

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);

    try {
      const response = await medicalOrderService.list({
        ordering: '-priority,-created_at',
        page_size: 1000,
      });
      setOrders(response.results);
    } catch (err) {
      const error = err as { status?: number; message?: string };
      console.error('Error al cargar órdenes:', error);
      if (error?.status === 403) {
        showError('No tienes permisos para ver órdenes médicas');
      } else {
        showError('Error al cargar órdenes. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, [showError]);

  const loadXRays = useCallback(async () => {
    setIsLoadingXRays(true);
    try {
      const response = await xrayService.list({
        ordering: '-uploaded_at',
        page_size: 1000,
      });
      if (response.results) {
        setXrays(response.results);
      }
    } catch (err) {
      console.error('Error al cargar radiografías:', err);
      showError('Error al cargar radiografías');
    } finally {
      setIsLoadingXRays(false);
    }
  }, [showError]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canView) {
      setIsLoadingOrders(false);
      return;
    }
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadOrders();
    loadXRays();
  }, [permissionsLoading, canView, loadOrders, loadXRays]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Si no hay filtro de estado, mostrar solo pendientes o en progreso
    if (!statusFilter) {
      filtered = filtered.filter(order => order.status === 'pending' || order.status === 'in_progress');
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.patient_name?.toLowerCase().includes(term) ||
          order.patient_dni?.toLowerCase().includes(term) ||
          order.requested_by_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 999;
      const priorityB = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, searchTerm, statusFilter, priorityFilter]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return filteredOrders.find((order) => order.id === selectedOrderId) || null;
  }, [selectedOrderId, filteredOrders]);

  const selectedOrderXRays = useMemo(() => {
    if (!selectedOrder) return [];
    // Mostrar solo radiografías asociadas a la orden seleccionada
    return xrays
      .filter(
        (xray) =>
          String(xray.patient) === String(selectedOrder.patient) &&
          String(xray.medical_order) === String(selectedOrder.id)
      )
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }, [selectedOrder, xrays]);

  const paginatedXRays = useMemo(() => {
    const start = currentXRayPage * xraysPerPage;
    return selectedOrderXRays.slice(start, start + xraysPerPage);
  }, [selectedOrderXRays, currentXRayPage]);

  const selectedXRay = useMemo(() => {
    if (!selectedXRayId) return null;
    return selectedOrderXRays.find((x) => x.id === selectedXRayId) || null;
  }, [selectedXRayId, selectedOrderXRays]);

  const stats = useMemo(() => {
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      completedOrders: orders.filter((o) => o.status === 'completed').length,
      urgentOrders: orders.filter((o) => o.priority === 'urgent').length,
      totalXRays: xrays.length,
      analyzedXRays: xrays.filter((x) => x.is_analyzed).length,
    };
  }, [orders, xrays]);

  const getPriorityBadge = (priority: string) => {
    const choice = PRIORITY_CHOICES.find((c) => c.value === priority);
    return choice ? { label: choice.label, color: choice.color } : { label: priority, color: '#6B7280' };
  };

  const getStatusInfo = (status: string) => {
    const choice = STATUS_CHOICES.find((c) => c.value === status);
    return {
      label: choice?.label || status,
      color: choice?.color || '#6B7280',
    };
  };

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedXRayId(null);
    setCurrentXRayPage(0);
  }, []);

  const handleUploadXRay = useCallback(() => {
    if (!canAdd) {
      showError('No tienes permisos para subir radiografías');
      return;
    }
    if (!selectedOrder) {
      showError('Selecciona una orden médica primero');
      return;
    }
    if (selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') {
      showError('No se pueden subir radiografías a una orden completada o cancelada');
      return;
    }
    setSelectedXRayId(null);
    setIsUploadModalOpen(true);
  }, [canAdd, selectedOrder, showError]);

  const handleViewXRay = useCallback((xray: XRayImage) => {
    if (!canView) {
      showError('No tienes permisos para ver radiografías');
      return;
    }
    setSelectedXRayId(xray.id);
    setIsViewModalOpen(true);
  }, [canView, showError]);

  const handleEditXRay = useCallback((xray: XRayImage) => {
    if (!canChange) {
      showError('No tienes permisos para editar radiografías');
      return;
    }
    if (selectedOrder?.status === 'completed' || selectedOrder?.status === 'cancelled') {
      showError('No se pueden editar radiografías de una orden completada o cancelada');
      return;
    }
    setSelectedXRayId(xray.id);
    setIsEditModalOpen(true);
  }, [canChange, selectedOrder, showError]);

  const handleDeleteXRay = useCallback((xray: XRayImage) => {
    if (!canChange) {
      showError('No tienes permisos para eliminar radiografías');
      return;
    }
    if (selectedOrder?.status === 'completed' || selectedOrder?.status === 'cancelled') {
      showError('No se pueden eliminar radiografías de una orden completada o cancelada');
      return;
    }
    setSelectedXRayId(xray.id);
    setIsDeleteModalOpen(true);
  }, [canChange, selectedOrder, showError]);

  const handleSubmitXRay = useCallback(
    async (data: XRayFormData) => {
      setIsSubmitting(true);
      try {
        if (selectedXRay) {
          await xrayService.update(selectedXRay.id, data);
          success('Radiografía actualizada correctamente', 3000);
        } else {
          // Agregar el id de la orden médica seleccionada al crear la radiografía
          await xrayService.create({
            ...data,
            medical_order: selectedOrder?.id ?? null,
          });
          success('Radiografía subida correctamente', 3000);
        }
        setIsUploadModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedXRayId(null);
        await loadXRays();
      } catch (err: unknown) {
        console.error('Error al guardar radiografía:', err);
        const error = err as { response?: { data?: { message?: string } } };
        const errorMessage = error.response?.data?.message || 'Error al guardar la radiografía';
        showError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedXRay, loadXRays, success, showError, selectedOrder]
  );

  const handleDeleteXRayConfirm = useCallback(async () => {
    if (!selectedXRay) {
      showError('No hay radiografía seleccionada para eliminar');
      return;
    }
    setIsSubmitting(true);
    try {
      await xrayService.delete(selectedXRay.id);
      setIsDeleteModalOpen(false);
      setSelectedXRayId(null);
      success('Radiografía eliminada correctamente. La orden está lista para una nueva radiografía.', 3000);
      await loadXRays();
      // Recargar órdenes para actualizar contadores
      await loadOrders();
    } catch (err) {
      console.error('Error al eliminar radiografía:', err);
      showError('Error al eliminar la radiografía');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedXRay, loadXRays, loadOrders, success, showError]);

  const handleRefresh = useCallback(async () => {
    await loadOrders();
    await loadXRays();
    success('Datos actualizados', 2000);
  }, [loadOrders, loadXRays, success]);

  const handleMarkOrderComplete = useCallback(async () => {
    if (!selectedOrder) return;

    // Validar que todas las radiografías estén analizadas
    if (selectedOrderXRays.length === 0) {
      showError('No hay radiografías en esta orden');
      return;
    }

    const allAnalyzed = selectedOrderXRays.every((x) => x.is_analyzed);
    if (!allAnalyzed) {
      showError('Todas las radiografías deben ser analizadas antes de completar la orden');
      return;
    }

    setIsMarkingComplete(true);
    try {
      await medicalOrderService.updateStatus(selectedOrder.id, 'completed');
      success('Orden marcada como completada', 3000);
      await loadOrders();
      setSelectedOrderId(null);
    } catch (err) {
      console.error('Error al marcar orden como completada:', err);
      showError('Error al marcar la orden como completada');
    } finally {
      setIsMarkingComplete(false);
    }
  }, [selectedOrder, selectedOrderXRays, loadOrders, success, showError]);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="max-w-md text-center bg-white rounded-lg p-8 border border-gray-200">
          <MdErrorOutline className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-lg">
                <MdHealthAndSafety className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Órdenes de Radiología</h1>
                <p className="text-sm text-gray-500">Gestión de estudios radiológicos</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoadingOrders || isLoadingXRays}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              <MdRefresh className={`w-5 h-5 ${isLoadingOrders || isLoadingXRays ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
              <div className="text-xs text-blue-700 font-semibold">Total</div>
              <div className="text-xl font-bold text-blue-900">{stats.totalOrders}</div>
            </div>
            <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <div className="text-xs text-amber-700 font-semibold">Pendientes</div>
              <div className="text-xl font-bold text-amber-900">{stats.pendingOrders}</div>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-200">
              <div className="text-xs text-green-700 font-semibold">Completadas</div>
              <div className="text-xl font-bold text-green-900">{stats.completedOrders}</div>
            </div>
            <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              <div className="text-xs text-red-700 font-semibold">Urgentes</div>
              <div className="text-xl font-bold text-red-900">{stats.urgentOrders}</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
              <div className="text-xs text-purple-700 font-semibold">Radiografías</div>
              <div className="text-xl font-bold text-purple-900">{stats.totalXRays}</div>
            </div>
            <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-200">
              <div className="text-xs text-indigo-700 font-semibold">Analizadas</div>
              <div className="text-xl font-bold text-indigo-900">{stats.analyzedXRays}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar paciente, DNI, médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MdSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* Filtro Estado */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="">Todos los estados</option>
                {STATUS_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <MdExpandMore className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Filtro Prioridad */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="">Todas las prioridades</option>
                {PRIORITY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <MdExpandMore className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Panel Izquierdo - Lista de Órdenes */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-32">
              <div className="h-[calc(100vh-200px)] overflow-y-auto">
                {isLoadingOrders ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-500">
                    <MdSearch className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium">No hay órdenes que coincidan</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const isSelected = selectedOrderId === order.id;
                      const priority = getPriorityBadge(order.priority);
                      const status = getStatusInfo(order.status);
                      // Solo contar radiografías asociadas a la orden
                      const orderXRays = xrays.filter(
                        (x) => String(x.patient) === String(order.patient) && String(x.medical_order) === String(order.id)
                      );

                      return (
                        <button
                          key={order.id}
                          onClick={() => handleSelectOrder(order.id)}
                          className={`w-full text-left p-4 transition-colors border-l-4 ${
                            isSelected
                              ? 'bg-blue-50 border-l-blue-600'
                              : 'border-l-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {order.patient_name || 'Sin nombre'}
                              </h3>
                              <p className="text-xs text-gray-500 font-mono">{order.patient_dni}</p>
                            </div>
                            <div
                              className="px-2 py-0.5 rounded text-xs font-semibold text-white flex-shrink-0"
                              style={{ backgroundColor: priority.color }}
                            >
                              {priority.label}
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{order.reason}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                            <div
                              className="px-2 py-0.5 rounded text-white font-medium"
                              style={{ backgroundColor: status.color }}
                            >
                              {status.label}
                            </div>
                            <span className="font-semibold text-gray-700">{orderXRays.length} imágenes</span>
                          </div>

                          {order.requested_by_name && (
                            <p className="text-xs text-gray-500 mt-2 truncate">Dr. {order.requested_by_name}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Panel Derecho - Detalles y Radiografías */}
          <main className="lg:col-span-3">
            {!selectedOrder ? (
              <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
                <MdHealthAndSafety className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecciona una orden</h2>
                <p className="text-gray-600">Elige una orden médica para ver sus radiografías</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tarjeta de Información */}
                <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white/20 rounded-lg">
                          <MdPerson className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedOrder.patient_name}</h2>
                          <p className="text-blue-100 text-sm">DNI: {selectedOrder.patient_dni}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <div
                          className="inline-flex items-center px-3 py-1 rounded-lg text-white font-semibold text-sm"
                          style={{ backgroundColor: getStatusInfo(selectedOrder.status).color }}
                        >
                          {getStatusInfo(selectedOrder.status).label}
                        </div>
                        <div
                          className="inline-flex items-center px-3 py-1 rounded-lg text-white font-semibold text-sm"
                          style={{ backgroundColor: getPriorityBadge(selectedOrder.priority).color }}
                        >
                          {getPriorityBadge(selectedOrder.priority).label}
                        </div>
                        {selectedOrder.status !== 'completed' && (canAdd) && (
                          <button
                            onClick={handleMarkOrderComplete}
                            disabled={
                              isMarkingComplete ||
                              selectedOrderXRays.length === 0 ||
                              !selectedOrderXRays.every((x) => x.is_analyzed)
                            }
                            title={
                              selectedOrderXRays.length === 0
                                ? 'No hay radiografías'
                                : !selectedOrderXRays.every((x) => x.is_analyzed)
                                ? 'Todas las radiografías deben ser analizadas'
                                : 'Marcar orden como completada'
                            }
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:hover:bg-white/20 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isMarkingComplete ? 'Completando...' : 'Marcar Completada'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-6">
                    {/* Información Médica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                          Razón de Solicitud
                        </label>
                        <p className="text-gray-900 font-medium">{selectedOrder.reason}</p>
                      </div>
                    </div>

                    {/* Solicitado Por */}
                    {selectedOrder.requested_by_name && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
                          Solicitado por
                        </label>
                        <p className="text-gray-900 font-medium">Dr. {selectedOrder.requested_by_name}</p>
                      </div>
                    )}

                    {/* Estadísticas */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                        <p className="text-xs text-blue-700 font-bold mb-1">RADIOGRAFÍAS</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedOrderXRays.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                        <p className="text-xs text-green-700 font-bold mb-1">ANALIZADAS</p>
                        <p className="text-2xl font-bold text-green-900">
                          {selectedOrderXRays.filter((x) => x.is_analyzed).length}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                        <p className="text-xs text-amber-700 font-bold mb-1">PENDIENTES</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {selectedOrderXRays.filter((x) => !x.is_analyzed).length}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                        <p className="text-xs text-purple-700 font-bold mb-1">DIAGNÓSTICOS</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {selectedOrderXRays.filter((x) => x.has_diagnosis).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sección de Radiografías */}
                <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Radiografías</h3>
                    {canAdd && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled' && (
                      <button
                        onClick={handleUploadXRay}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        <MdCloudUpload className="w-4 h-4" />
                        Subir Radiografía
                      </button>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    {isLoadingXRays ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-100 rounded-lg aspect-square animate-pulse border border-gray-200"
                          ></div>
                        ))}
                      </div>
                    ) : selectedOrderXRays.length === 0 ? (
                      <div className="text-center py-12">
                        <MdImage className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin radiografías</h3>
                        <p className="text-gray-600 mb-6">Esta orden no tiene radiografías registradas</p>
                        {canAdd && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled' && (
                          <button
                            onClick={handleUploadXRay}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                          >
                            <MdCloudUpload className="w-4 h-4" />
                            Subir Primera Radiografía
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {paginatedXRays.map((xray) => (
                            <XRayGridCard
                              key={xray.id}
                              xray={xray}
                              onView={() => handleViewXRay(xray)}
                              onEdit={() => handleEditXRay(xray)}
                              onDelete={() => handleDeleteXRay(xray)}
                              canEdit={canChange && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled'}
                              canDelete={canChange && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled' && !xray.is_analyzed}
                            />
                          ))}
                        </div>

                        {/* Paginación */}
                        {selectedOrderXRays.length > xraysPerPage && (
                          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              {currentXRayPage * xraysPerPage + 1} a{' '}
                              {Math.min((currentXRayPage + 1) * xraysPerPage, selectedOrderXRays.length)} de{' '}
                              {selectedOrderXRays.length}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentXRayPage((p) => Math.max(0, p - 1))}
                                disabled={currentXRayPage === 0}
                                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                <MdArrowBack className="w-4 h-4" />
                                Anterior
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentXRayPage((p) =>
                                    Math.min(Math.ceil(selectedOrderXRays.length / xraysPerPage) - 1, p + 1)
                                  )
                                }
                                disabled={(currentXRayPage + 1) * xraysPerPage >= selectedOrderXRays.length}
                                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                Siguiente
                                <MdArrowForward className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </main>

      {/* Modals */}
      <UploadXRayModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedXRayId(null);
        }}
        onSubmit={handleSubmitXRay}
        isLoading={isSubmitting}
        medicalOrder={selectedOrder}
      />

      <EditXRayModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedXRayId(null);
        }}
        onSubmit={handleSubmitXRay}
        xray={selectedXRay}
        isLoading={isSubmitting}
      />

      <DeleteXRayModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedXRayId(null);
        }}
        onConfirm={handleDeleteXRayConfirm}
        xray={selectedXRay}
        isLoading={isSubmitting}
      />

      <XRayViewerModal
        isOpen={isViewModalOpen}
        xray={selectedXRay}
        imageZoom={imageZoom}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedXRayId(null);
        }}
        onZoomIn={() => setImageZoom((prev) => Math.min(3, prev + ZOOM_STEP))}
        onZoomOut={() => setImageZoom((prev) => Math.max(0.5, prev - ZOOM_STEP))}
        onZoomReset={() => setImageZoom(1)}
        onDelete={() => {
          setIsViewModalOpen(false);
          if (selectedXRay) {
            handleDeleteXRay(selectedXRay);
          }
        }}
        canAnalyze={canAddDiagnosis && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled'}
        canDelete={canChange && selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled'}
        onAnalysisComplete={loadXRays}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};