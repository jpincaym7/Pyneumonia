"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import SelectOrderModal from './SelectOrderModal';
import {
  X,
  FileText,
  Stethoscope,
  Activity,
  Save,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Search,
  User,
  ListChecks
} from 'lucide-react';
import medicalReportService from '@/services/medical-report.service';
import { apiClient } from '@/lib/api';

// --- Interfaces ---

interface MedicalOrder {
  id: number;
  reason: string;
  status?: string;
  patientName?: string;
  patientId?: string;
  modality?: string;
}

interface Diagnosis {
  id: number;
  predicted_class: string;
  medical_order?: MedicalOrder;
}

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  report?: any;
}

// --- Viewer simulado ---
interface ViewerProps {
  order: MedicalOrder;
  diagnostics: Diagnosis[];
}

function MedicalOrderViewer({ order, diagnostics }: ViewerProps) {
  const xrayDetails = diagnostics[0]?.xray_details;
  return (
    <div className="space-y-6 p-6">
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          Información del Paciente
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Paciente:</span>
            <span className="font-medium text-slate-700">{xrayDetails?.patient_name || 'No disponible'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ID Paciente:</span>
            <span className="font-medium text-slate-700">{xrayDetails?.patient_dni || 'No disponible'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Modalidad:</span>
            <span className="font-medium text-slate-700">{xrayDetails?.modality || 'No disponible'}</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Detalles de la Orden
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">ID de Orden:</span>
            <span className="font-mono font-medium text-blue-600">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Razón del Estudio:</span>
            <span className="font-medium text-slate-700 text-right">{order.reason}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estado:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {order.status || 'Completada'}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-blue-500" />
          Diagnósticos (IA)
        </h4>
        {diagnostics.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
            {diagnostics.map(d => (
              <li key={d.id}>{d.predicted_class}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 italic">No hay diagnósticos asociados.</p>
        )}
      </div>
    </div>
  );
}

export default function MedicalReportModal({ isOpen, onClose, onSuccess, report }: MedicalReportModalProps) {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnosis[]>([]);
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    diagnosis: '', // Debe ser el id del diagnóstico
    title: '',
    findings: '',
    impression: '',
    recommendations: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado derivado
  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id.toString() === selectedOrderId) || null;
  }, [selectedOrderId, orders]);
  const selectedDiagnostics = useMemo(() => {
    if (!selectedOrderId) return [];
    return diagnostics.filter(d => d.medical_order?.id.toString() === selectedOrderId);
  }, [selectedOrderId, diagnostics]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsLoading(true);
    const loadData = async () => {
      try {
        const [diagData, orderData] = await Promise.all([
          apiClient.get<Diagnosis[]>('/diagnosis/results/by-my-orders/'),
          apiClient.get<MedicalOrder[]>('/diagnosis/medical-orders/')
        ]);
        setDiagnostics(Array.isArray(diagData) ? diagData : (diagData as any).results || []);
        setOrders(Array.isArray(orderData) ? orderData : (orderData as any).results || []);
      } catch (err) {
        setError("No se pudieron cargar los datos de la orden.");
        setDiagnostics([]);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    if (report) {
      setForm({
        diagnosis: report.diagnosis_id,
        title: report.title,
        findings: report.findings,
        impression: report.impression,
        recommendations: report.recommendations || '',
      });
      setSelectedOrderId(report.diagnosis_id?.toString() || null);
    } else {
      setForm({ diagnosis: '', title: '', findings: '', impression: '', recommendations: '' });
      setSelectedOrderId(null);
    }
  }, [isOpen, report]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // UX Mejorada: Selección de orden
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    // Buscar el diagnóstico único asociado a la orden
    const diag = diagnostics.find(d => d.medical_order?.id.toString() === orderId);
    setForm(prev => ({
      ...prev,
      diagnosis: diag ? diag.id.toString() : '',
      title: prev.title || orders.find(o => o.id.toString() === orderId)?.reason || ''
    }));
    setOrderModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError("Debe seleccionar una orden médica para asociar el reporte.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (report) {
        await medicalReportService.update(report.id, form);
      } else {
        await medicalReportService.create(form);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo procesar el reporte. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-7xl transform rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <Dialog.Title as="h2" className="text-lg font-bold text-slate-800">
                          {report ? 'Edición de Informe Médico' : 'Redacción de Informe Médico'}
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">Sistema de Reportes Radiológicos</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 flex overflow-hidden">
                    {/* Columna Izquierda */}
                    <div className="w-1/3 flex-shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200 scrollbar-thin">
                      <div className="p-4 sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                        <button
                          type="button"
                          onClick={() => setOrderModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                          disabled={!!report || isLoading}
                        >
                          <Search className="w-4 h-4" />
                          {selectedOrder ? 'Cambiar Orden' : 'Seleccionar Orden Médica'}
                        </button>
                      </div>
                      {isLoading && (
                        <div className="p-6 text-center text-slate-500">Cargando datos...</div>
                      )}
                      {!isLoading && !selectedOrder && (
                        <div className="p-10 flex flex-col items-center justify-center text-center text-slate-500 h-full">
                          <ClipboardList className="w-16 h-16 text-slate-300 mb-4" />
                          <h4 className="font-semibold text-slate-700">Sin Orden Seleccionada</h4>
                          <p className="text-sm">Por favor, seleccione una orden para comenzar a redactar el informe.</p>
                        </div>
                      )}
                      {selectedOrder && (
                        <MedicalOrderViewer order={selectedOrder} diagnostics={selectedDiagnostics} />
                      )}
                    </div>
                    {/* Columna Derecha */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">
                      {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-lg shadow-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{error}</span>
                        </div>
                      )}
                      <form id="medical-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Diagnóstico asociado automático */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Diagnóstico Asociado
                          </label>
                          <input
                            type="text"
                            name="diagnosis"
                            value={selectedOrder?.reason || ''}
                            readOnly
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg font-medium shadow-sm text-slate-700"
                            placeholder="No hay diagnóstico para esta orden"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Título del Estudio
                          </label>
                          <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="Ej: TC de Tórax con Contraste"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-blue-600" />
                              Hallazgos Radiológicos
                            </span>
                            <span className="text-xs font-normal text-slate-400">Detalle técnico</span>
                          </label>
                          <textarea
                            name="findings"
                            value={form.findings}
                            onChange={handleChange}
                            required
                            rows={8}
                            className="w-full p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm text-slate-700 leading-relaxed resize-y group-hover:border-slate-400"
                            placeholder="Describa las observaciones detalladas, morfología, densidad y estructuras evaluadas..."
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Impresión Diagnóstica
                            </label>
                            <textarea
                              name="impression"
                              value={form.impression}
                              onChange={handleChange}
                              required
                              rows={5}
                              className="w-full p-3 bg-emerald-50/30 border border-emerald-200/60 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-700 placeholder:text-emerald-700/30"
                              placeholder="Conclusión sintética..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-amber-600" />
                              Recomendaciones
                            </label>
                            <textarea
                              name="recommendations"
                              value={form.recommendations}
                              onChange={handleChange}
                              rows={5}
                              className="w-full p-3 bg-amber-50/30 border border-amber-200/60 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-700 placeholder:text-amber-700/30"
                              placeholder="Sugerencias de seguimiento..."
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      * Campos obligatorios
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all hover:shadow-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        form="medical-form"
                        disabled={submitting || isLoading || !selectedOrderId}
                        className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {report ? 'Actualizar Informe' : 'Finalizar y Guardar'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <SelectOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        orders={orders}
        diagnostics={diagnostics}
        onSelect={handleOrderSelect}
        loading={isLoading}
      />
    </>
  );
}