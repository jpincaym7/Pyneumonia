import { useState } from 'react';
import { Activity, ClipboardList } from 'lucide-react';
// ...existing code...

interface MedicalOrder {
  id: number;
  reason: string;
  status?: string;
}

interface Diagnosis {
  id: number;
  predicted_class: string;
  medical_order?: MedicalOrder;
}


interface MedicalOrderViewerProps {
  orders: MedicalOrder[];
  diagnostics: Diagnosis[];
  selectedDiagnosisId: string;
  onSelectDiagnosis: (diagnosisId: string) => void;
  loading?: boolean;
}


export default function MedicalOrderViewer({ orders, diagnostics, selectedDiagnosisId, onSelectDiagnosis, loading }: MedicalOrderViewerProps) {
  const selectedDiagnosis = diagnostics.find(d => d.id.toString() === selectedDiagnosisId);
  const associatedOrder = selectedDiagnosis?.medical_order;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Activity className="w-4 h-4 text-blue-500" />
          Seleccionar Diagnóstico
        </label>
        <div className="relative">
          <select
            name="diagnosis"
            value={selectedDiagnosisId}
            onChange={e => onSelectDiagnosis(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none text-slate-700 font-medium disabled:opacity-60"
          >
            <option value="">Seleccionar diagnóstico...</option>
            {diagnostics.map(diagnosis => (
              <option key={diagnosis.id} value={diagnosis.id.toString()}>
                {diagnosis.predicted_class}
              </option>
            ))}
          </select>
          {loading && (
            <div className="absolute right-3 top-3.5">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
      {selectedDiagnosis && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Detalles del Diagnóstico
          </div>
          <div className="text-slate-600 text-sm mb-2">Clase predicha: <span className="font-bold">{selectedDiagnosis.predicted_class}</span></div>
          {associatedOrder ? (
            <div className="mt-2">
              <div className="text-xs font-semibold text-slate-700 mb-1">Orden médica asociada:</div>
              <div className="text-slate-600 text-sm mb-2">{associatedOrder.reason}</div>
              <div className="text-xs text-slate-400 mb-2">Estado: {associatedOrder.status || 'Sin estado'}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">No hay orden médica asociada.</div>
          )}
        </div>
      )}
    </div>
  );
}
