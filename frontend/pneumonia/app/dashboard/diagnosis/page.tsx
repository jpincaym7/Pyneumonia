/**
 * Página de gestión de análisis clínicos - Vista de Expedientes Médicos
 * Diseño profesional con búsqueda alfabética de pacientes
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdClose, 
  MdFolderOpen, 
  MdAssessment, 
  MdSearch
} from 'react-icons/md';
import { DiagnosisResult } from '@/types/diagnosis';
import diagnosisService from '@/services/diagnosis.service';
import { DeleteDiagnosisModal } from '@/components/diagnosis/DeleteDiagnosisModal';
import { PatientList } from '@/components/diagnosis/PatientList';
import { PatientDetail } from '@/components/diagnosis/PatientDetail';
import { useDiagnosisPermissions } from '@/hooks/useDiagnosisPermissions';
import { useUserGroup } from '@/hooks/useUserGroup';
import { ToastContainer, useToast } from '@/components/Toast';
import {
  groupDiagnosesByPatient,
  calculateDiagnosisStats,
} from '@/lib/diagnosis-utils';

// Constantes
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function DiagnosisPage() {
  const router = useRouter();
  const { canView, isLoading: permissionsLoading } = useDiagnosisPermissions();
  const { isPhysician, isAdmin, isLoading: userGroupLoading } = useUserGroup();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vista de expedientes
  const [selectedPatientKey, setSelectedPatientKey] = useState<string | null>(null);

  // Búsqueda alfabética de pacientes
  const [patientSearchLetter, setPatientSearchLetter] = useState<string | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [diagnosisToDelete, setDiagnosisToDelete] = useState<DiagnosisResult | null>(null);

  // Cargar diagnósticos (todos para agrupar por expedientes)
  const loadDiagnoses = useCallback(async () => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await diagnosisService.list({
        ordering: '-created_at',
        page_size: 1000, // Cargar todos para agrupar
      });
      
      setDiagnoses(response.results);
    } catch (err: unknown) {
      console.error('Error al cargar diagnósticos:', err);
      const error = err as { status?: number; data?: { detail?: string } };
      
      if (error?.status === 403) {
        setError('No tienes permisos para ver análisis clínicos');
      } else {
        setError(error?.data?.detail || 'Error al cargar los análisis clínicos');
      }
    } finally {
      setIsLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    if (!permissionsLoading && !userGroupLoading) {
      loadDiagnoses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, permissionsLoading, userGroupLoading]);

  // Handlers
  const handleViewDetails = (diagnosis: DiagnosisResult) => {
    router.push(`/dashboard/diagnosis/${diagnosis.id}`);
  };

  const handleDelete = (diagnosis: DiagnosisResult) => {
    // Solo médicos e administradores pueden eliminar
    if (!isPhysician && !isAdmin) {
      showError('Solo médicos pueden eliminar análisis clínicos');
      return;
    }
    
    setDiagnosisToDelete(diagnosis);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!diagnosisToDelete) return;

    // Validar nuevamente antes de eliminar
    if (!isPhysician && !isAdmin) {
      showError('No tienes permisos para eliminar análisis clínicos');
      return;
    }

    try {
      await diagnosisService.delete(diagnosisToDelete.id);
      
      // Actualizar el estado local removiendo el diagnóstico
      setDiagnoses(prevDiagnoses =>
        prevDiagnoses.filter(d => d.id !== diagnosisToDelete.id)
      );
      
      setIsDeleteModalOpen(false);
      setDiagnosisToDelete(null);
      success('Diagnóstico eliminado correctamente', 3000);
    } catch (err: unknown) {
      console.error('Error al eliminar diagnóstico:', err);
      const error = err as { data?: { detail?: string } };
      showError(error?.data?.detail || 'Error al eliminar el diagnóstico');
    }
  };

  const handleMarkReviewed = async (diagnosis: DiagnosisResult) => {
    // Solo médicos e administradores pueden revisar
    if (!isPhysician && !isAdmin) {
      showError('Solo médicos pueden revisar análisis clínicos');
      return;
    }

    try {
      // Actualizar optimistamente el estado local
      const updated = await diagnosisService.markReviewed(diagnosis.id);
      
      // Actualizar el diagnóstico en el estado local
      setDiagnoses(prevDiagnoses =>
        prevDiagnoses.map(d => 
          d.id === diagnosis.id ? { ...d, is_reviewed: true, reviewed_at: updated.reviewed_at } : d
        )
      );
      
      success('Diagnóstico marcado como revisado', 3000);
    } catch (err: unknown) {
      console.error('Error al marcar como revisado:', err);
      const error = err as { data?: { detail?: string } };
      showError(error?.data?.detail || 'Error al marcar como revisado');
    }
  };

  const handleSelectPatient = (patientKey: string) => {
    setSelectedPatientKey(patientKey);
  };

  // Calcular datos derivados
  const groupedDiagnoses = useMemo(() => {
    return groupDiagnosesByPatient(diagnoses);
  }, [diagnoses]);

  const filteredPatientFiles = useMemo(() => {
    let filtered = groupedDiagnoses;

    // Filtrar por letra seleccionada
    if (patientSearchLetter) {
      const tempFiltered = new Map<string, DiagnosisResult[]>();
      
      filtered.forEach((diagList, key) => {
        const patientName = diagList[0]?.xray_details?.patient_name || '';
        if (patientName.toUpperCase().startsWith(patientSearchLetter)) {
          tempFiltered.set(key, diagList);
        }
      });
      
      filtered = tempFiltered;
    }

    // Filtrar por término de búsqueda
    if (patientSearchTerm.trim()) {
      const term = patientSearchTerm.toLowerCase();
      const tempFiltered = new Map<string, DiagnosisResult[]>();
      
      filtered.forEach((diagList, key) => {
        const patientName = diagList[0]?.xray_details?.patient_name?.toLowerCase() || '';
        const patientDNI = diagList[0]?.xray_details?.patient_dni?.toLowerCase() || '';
        
        if (patientName.includes(term) || patientDNI.includes(term)) {
          tempFiltered.set(key, diagList);
        }
      });
      
      filtered = tempFiltered;
    }

    return filtered;
  }, [groupedDiagnoses, patientSearchLetter, patientSearchTerm]);

  // Obtener diagnósticos del paciente seleccionado
  const selectedPatientDiagnoses = useMemo(() => {
    if (!selectedPatientKey) return [];
    return groupedDiagnoses.get(selectedPatientKey) || [];
  }, [selectedPatientKey, groupedDiagnoses]);

  // Calcular estadísticas
  const stats = useMemo(() => calculateDiagnosisStats(diagnoses), [diagnoses]);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no tiene permisos de vista, mostrar mensaje amigable
  if (!canView) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Sin Permisos de Acceso
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              No tienes permisos para acceder al módulo de análisis clínicos. 
              Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header Principal */}
        <header className="mb-10 border-b border-neutral-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-2">Análisis Clínicos</h1>
            <p className="text-neutral-600 text-lg">Sistema institucional para gestión de diagnósticos médicos de neumonía</p>
          </div>
          <div className="flex gap-6">
            <div className="bg-white rounded-lg px-6 py-3 border border-neutral-200 text-center">
              <div className="text-xs text-neutral-500 mb-1">Pacientes</div>
              <div className="text-2xl font-bold text-neutral-900">{groupedDiagnoses.size}</div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border border-neutral-200 text-center">
              <div className="text-xs text-neutral-500 mb-1">Análisis</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border border-neutral-200 text-center">
              <div className="text-xs text-neutral-500 mb-1">Revisados</div>
              <div className="text-2xl font-bold text-blue-700">{stats.analyzed}</div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border border-neutral-200 text-center">
              <div className="text-xs text-neutral-500 mb-1">Neumonías</div>
              <div className="text-2xl font-bold text-red-600">{stats.pneumonia}</div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border border-neutral-200 text-center">
              <div className="text-xs text-neutral-500 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            </div>
          </div>
        </header>

        {/* Layout de dos columnas */}
        <div className="grid grid-cols-12 gap-8">
          {/* Panel Lateral Izquierdo: Búsqueda y Lista de Pacientes */}
          <aside className="col-span-3">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                <div className="px-6 py-5 border-b border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MdFolderOpen className="w-6 h-6 text-blue-700" />
                    <h2 className="text-lg font-semibold text-neutral-800">Expedientes</h2>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pr-10 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <MdSearch className="absolute right-3 top-2.5 w-5 h-5 text-neutral-400" />
                  </div>
                </div>
                <div className="px-6 py-3 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setPatientSearchLetter(null)}
                      className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                        patientSearchLetter === null
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                      }`}
                    >
                      Todos
                    </button>
                    {ALPHABET.map((letter) => (
                      <button
                        key={letter}
                        onClick={() => setPatientSearchLetter(letter)}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                          patientSearchLetter === letter
                            ? 'bg-blue-700 text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-[calc(100vh-400px)] overflow-y-auto px-2 py-2">
                  <PatientList
                    patients={filteredPatientFiles}
                    selectedPatient={selectedPatientKey}
                    onSelectPatient={handleSelectPatient}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Área Principal Derecha: Análisis del Paciente */}
          <main className="col-span-9">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-sm flex items-center gap-3" role="alert">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800 flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
            )}

            {!userGroupLoading && !isPhysician && !isAdmin && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-sm flex items-center gap-3" role="alert">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-800 flex-1">Solo los médicos pueden revisar o eliminar análisis clínicos. Tu rol actual permite visualizar la información.</span>
              </div>
            )}

            {!selectedPatientKey ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-20 text-center">
                <div className="mx-auto w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                  <MdFolderOpen className="w-16 h-16 text-neutral-400" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Selecciona un Expediente</h3>
                <p className="text-neutral-600 text-lg max-w-md mx-auto">Elige un paciente de la lista lateral para visualizar su historial de análisis clínicos</p>
              </div>
            ) : isLoading ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-3 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
                  <p className="text-neutral-700 font-medium text-sm">Cargando análisis clínicos...</p>
                  <p className="text-neutral-500 text-xs mt-1">Por favor espera un momento</p>
                </div>
              </div>
            ) : selectedPatientDiagnoses.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-16 text-center">
                <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <MdAssessment className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Sin Análisis</h3>
                <p className="text-neutral-600">Este paciente no tiene análisis clínicos registrados</p>
              </div>
            ) : (
              <PatientDetail
                patientDiagnoses={selectedPatientDiagnoses}
                onViewDetails={handleViewDetails}
                onMarkReviewed={(isPhysician || isAdmin) ? handleMarkReviewed : undefined}
                onDelete={(isPhysician || isAdmin) ? handleDelete : undefined}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal de eliminación */}
      <DeleteDiagnosisModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDiagnosisToDelete(null);
        }}
        onConfirm={confirmDelete}
        diagnosis={diagnosisToDelete}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
