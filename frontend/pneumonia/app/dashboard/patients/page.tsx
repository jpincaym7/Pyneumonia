/**
 * Página de gestión de pacientes
 */
'use client';

import React, { useState, useEffect } from 'react';
import patientService from '@/services/patient.service';
import { usePatientPermissions } from '@/hooks/usePatientPermissions';
import { PatientsTable } from '@/components/patients/PatientsTable';
import { PatientFormModal } from '@/components/patients/PatientFormModal';
import { DeletePatientModal } from '@/components/patients/DeletePatientModal';
import NoPermissionModal from '@/components/NoPermissionModal';
import { ToastContainer, useToast } from '@/components/Toast';
import { Patient, PatientFormData, PatientFilters } from '@/types/patient';
import { GENDER_CHOICES, BLOOD_TYPES } from '@/types/patient';

export default function PatientsPage() {
  const { canView, canAdd, canChange, canDelete, isLoading: permissionsLoading } =
    usePatientPermissions();

  const { toasts, removeToast, success, error: showError } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPermissionMessage, setNoPermissionMessage] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState<PatientFilters>({
    search: '',
    is_active: undefined,
    gender: undefined,
    blood_type: undefined,
    ordering: '-created_at',
  });

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Cargar pacientes
  const loadPatients = async () => {
    if (!canView) {
      // Si no tiene permisos de vista, no mostrar modal aquí
      // El modal ya se mostrará automáticamente por usePermissionCheck si corresponde
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await patientService.list({
        ...filters,
        page: currentPage,
        page_size: pageSize,
      });

      setPatients(response.results);
      setTotalCount(response.count);
    } catch (err) {
      const error = err as { status?: number; message?: string };
      console.error('Error al cargar pacientes:', error);
      
      if (error?.status === 403) {
        setNoPermissionMessage('No tienes permisos para ver pacientes');
        setError('No tienes permisos para ver pacientes');
      } else {
        setError('Error al cargar pacientes. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, canView, permissionsLoading]);

  // Handlers
  const handleCreate = () => {
    if (!canAdd) {
      setNoPermissionMessage('No tienes permisos para crear pacientes');
      return;
    }
    setSelectedPatient(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    if (!canChange) {
      setNoPermissionMessage('No tienes permisos para editar pacientes');
      return;
    }
    setSelectedPatient(patient);
    setIsFormModalOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    if (!canDelete) {
      setNoPermissionMessage('No tienes permisos para eliminar pacientes');
      return;
    }
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const handleToggleActive = async (patient: Patient) => {
    if (!canChange) {
      setNoPermissionMessage('No tienes permisos para cambiar el estado de pacientes');
      return;
    }

    try {
      await patientService.toggleActive(patient.id, !patient.is_active);
      await loadPatients();
    } catch (err) {
      const error = err as { status?: number };
      console.error('Error al cambiar estado:', error);
      if (error?.status === 403) {
        setNoPermissionMessage('No tienes permisos para cambiar el estado de pacientes');
      } else {
        alert('Error al cambiar estado del paciente');
      }
    }
  };

  const handleFormSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (selectedPatient) {
        await patientService.update(selectedPatient.id, data);
        success('Paciente actualizado correctamente', 3000);
      } else {
        await patientService.create(data);
        success('Paciente creado correctamente', 3000);
      }

      setIsFormModalOpen(false);
      setSelectedPatient(null);
      await loadPatients();
    } catch (err) {
      // Log detallado para depuración
      console.error('Error al guardar paciente:', err);
      // Si el error es un objeto con campos (errores de validación)
      if (typeof err === 'object' && err !== null) {
        // Si viene con .data (estructura del apiClient)
        const backendErrors = (err as Record<string, unknown>)?.data;
        if (backendErrors && typeof backendErrors === 'object') {
          setFormErrors(backendErrors as Record<string, string[]>);
          return;
        }
        // Si el error es directamente el objeto de errores
        if (Object.keys(err).length > 0 && Object.values(err).some(v => Array.isArray(v))) {
          setFormErrors(err as Record<string, string[]>);
          return;
        }
        // Si es error de permisos
        if ((err as Record<string, unknown>).status === 403) {
          setIsFormModalOpen(false);
          setNoPermissionMessage('No tienes permisos para guardar pacientes');
          showError('No tienes permisos para guardar pacientes');
          return;
        }
      }
      // Si el error es un string, mostrarlo como error general
      if (typeof err === 'string') {
        setFormErrors({ general: [err] });
        showError(err);
        return;
      }
      // Si no se reconoce, mostrar error genérico
      setFormErrors({ general: ['Error al guardar paciente. Por favor, intenta nuevamente.'] });
      showError('Error al guardar paciente. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatient) return;

    setIsSubmitting(true);

    try {
      await patientService.delete(selectedPatient.id);
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
      success('Paciente eliminado correctamente', 3000);
      await loadPatients();
    } catch (err) {
      const error = err as { status?: number };
      console.error('Error al eliminar paciente:', error);
      
      if (error?.status === 403) {
        setIsDeleteModalOpen(false);
        setNoPermissionMessage('No tienes permisos para eliminar pacientes');
        showError('No tienes permisos para eliminar pacientes');
      } else {
        showError('Error al eliminar paciente. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (name: string, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Calcular paginación
  const totalPages = Math.ceil(totalCount / pageSize);

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
              No tienes permisos para acceder al módulo de pacientes. 
              Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Administra la información de los pacientes del sistema
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 space-y-4">
        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por DNI, nombre o apellido..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 font-medium"
            />
          </div>
          {canAdd && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              + Nuevo Paciente
            </button>
          )}
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.is_active === undefined ? '' : filters.is_active ? 'true' : 'false'}
              onChange={(e) =>
                handleFilterChange(
                  'is_active',
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género
            </label>
            <select
              value={filters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
            >
              <option value="">Todos</option>
              {GENDER_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Sangre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Sangre
            </label>
            <select
              value={filters.blood_type || ''}
              onChange={(e) => handleFilterChange('blood_type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
            >
              <option value="">Todos</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <PatientsTable
          patients={patients}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          canEdit={canChange}
          canDelete={canDelete}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedPatient(null);
          setFormErrors({});
        }}
        onSubmit={handleFormSubmit}
        patient={selectedPatient}
        isLoading={isSubmitting}
        backendErrors={formErrors}
      />

      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPatient(null);
        }}
        onConfirm={handleDeleteConfirm}
        patient={selectedPatient}
        isLoading={isSubmitting}
      />

      <NoPermissionModal
        isOpen={!!noPermissionMessage}
        message={noPermissionMessage}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
