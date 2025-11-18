"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useMemo } from 'react';
import { ClipboardList, Activity, X, Stethoscope, FileText } from 'lucide-react';

interface MedicalOrder {
  id: number;
  reason: string;
  status?: string;
  // doctorName?: string; // Sugerencia para futuro
}

interface Diagnosis {
  id: number;
  predicted_class: string;
  medical_order?: MedicalOrder;
  reports?: any[]; // Se asume array, ajusta si es diferente
}

interface SelectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: MedicalOrder[];
  diagnostics: Diagnosis[];
  onSelect: (orderId: string) => void;
  loading?: boolean;
}

/**
 * Modal optimizado y accesible para seleccionar una orden médica.
 */
export default function SelectOrderModal({
  isOpen,
  onClose,
  orders,
  diagnostics,
  onSelect,
  loading,
}: SelectOrderModalProps) {
  // Usar 'null' es más limpio para "nada seleccionado"
  const [selected, setSelected] = useState<string | null>(null);

  // Mapea los diagnósticos a sus IDs de orden para búsqueda O(1)
  // Filtra diagnósticos sin reportes asociados
  const diagnosticsByOrder = useMemo(() => {
    const map = new Map<number, Diagnosis[]>();
    diagnostics.forEach((diag) => {
      // Solo incluir si no tiene reportes asociados
      const hasReports = Array.isArray(diag.reports) ? diag.reports.length > 0 : false;
      if (!hasReports) {
        const orderId = diag.medical_order?.id;
        if (orderId) {
          if (!map.has(orderId)) {
            map.set(orderId, []);
          }
          map.get(orderId)!.push(diag);
        }
      }
    });
    return map;
  }, [diagnostics]);

  // UX: Resetea el estado al cerrar
  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  // UX: Confirma la selección
  const handleSubmit = () => {
    if (selected) {
      onSelect(selected);
      handleClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Fondo oscuro y blur */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-slate-100">
                {/* Header con botón de cierre */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-slate-900 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                    Seleccionar Orden Médica
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Title>

                {/* Contenido: Lista de Órdenes */}
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto p-1 -m-1 pr-2 -mr-2">
                  {loading && (
                    <div className="text-center py-6 text-slate-500">Cargando órdenes...</div>
                  )}
                  {!loading && orders.length === 0 && (
                    <div className="text-center py-6 text-slate-500">No hay órdenes disponibles.</div>
                  )}

                  {!loading && orders
                    .filter(order => (diagnosticsByOrder.get(order.id) || []).length > 0)
                    .map((order) => {
                      const orderDiagnostics = diagnosticsByOrder.get(order.id) || [];
                      const isSelected = selected === order.id.toString();

                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelected(order.id.toString())}
                          className={`w-full text-left p-4 rounded-lg border transition-all duration-150 shadow-sm
                            ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              {/* Si tuvieras un doctor, lo pondrías aquí:
                                <div className="text-xs font-medium text-blue-600 flex items-center gap-1.5">
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  Dr. {order.doctorName || 'Asignado'}
                                </div>
                              */}
                              <div className="font-semibold text-slate-800 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                {order.reason}
                              </div>
                            </div>
                            <span className="text-xs font-mono text-slate-400">ID: {order.id}</span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Estado: <span className="font-medium text-slate-600">{order.status || 'N/A'}</span>
                          </div>

                          {/* Lista de Diagnósticos */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Diagnósticos Asociados
                            </div>
                            <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-600">
                              {orderDiagnostics.map((d) => (
                                <li key={d.id}>{d.predicted_class}</li>
                              ))}
                            </ul>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Footer con botones de acción */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 sm:mt-0 w-full py-2.5 px-4 rounded-lg bg-white text-slate-700 font-medium border border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all
                      disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    Seleccionar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
