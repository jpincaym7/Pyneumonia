/**
 * Página principal de Reportes Médicos
 * Interfaz profesional con vista de lista y detalles
 */
'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  FileCheck,
  FilePlus,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { MedicalReport, MedicalReportFilters } from '@/types/report';
import medicalReportService from '@/services/medical-report.service';
import { useMedicalReportPermissions } from '@/hooks/useMedicalReportPermissions';
import MedicalReportModal from '@/components/diagnosis/MedicalReportModal';
import { generateMedicalReportPdf } from '@/utils/generateMedicalReportPdf';

export default function MedicalReportsPage() {
  const { canView, canAdd, canChange, canDelete, canSign, canReceive, isLoading: permissionsLoading } = useMedicalReportPermissions();

  // Estados
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [detailsReport, setDetailsReport] = useState<MedicalReport | null>(null);

  // Filtros
  const [filters, setFilters] = useState<MedicalReportFilters>({
    search: '',
    status: undefined,
    ordering: '-created_at',
    page: 1,
    page_size: 10,
  });

  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  // Cargar reportes
  const loadReports = async () => {
    if (!canView) return;
    
    setLoading(true);
    try {
      const response = await medicalReportService.list(filters);
      setReports(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (error: any) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters, canView]);

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterStatus = (status: MedicalReportFilters['status']) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedReport(null);
    setShowModal(true);
  };

  const handleEdit = (report: MedicalReport) => {
    if (report.status === 'draft') {
      setSelectedReport(report);
      setShowModal(true);
    }
  };

  const handleViewDetails = (report: MedicalReport) => {
    setDetailsReport(report);
    setViewMode('details');
  };

  const handleDelete = async (report: MedicalReport) => {
    if (!confirm('¿Estás seguro de eliminar este reporte?')) return;

    try {
      await medicalReportService.delete(report.id);
      loadReports();
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el reporte');
    }
  };

  // El médico tratante firma y recibe el reporte
  const handleSign = async (report: MedicalReport) => {
    if (!confirm('¿Confirmar firma y recepción del reporte?')) return;
    try {
      await medicalReportService.physicianReceive(report.id);
      loadReports();
    } catch (error: any) {
      alert(error.message || 'Error al firmar/recibir el reporte');
    }
  };

  // El flujo de recepción queda integrado en la firma
  // (ya no se requiere un botón separado para recibir)

  const handleModalSuccess = () => {
    loadReports();
    setShowModal(false);
  };

  // Descargar PDF desde el frontend
  const handleDownloadPdfFrontend = (report: MedicalReport) => {
    if (!report) return;
    generateMedicalReportPdf(report);
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
      final: { label: 'Final', class: 'bg-blue-100 text-blue-700 border-blue-300', icon: FileCheck },
      revised: { label: 'Revisado', class: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.class}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para ver reportes médicos</p>
        </div>
      </div>
    );
  }

  // Vista de detalles
  if (viewMode === 'details' && detailsReport) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setViewMode('list');
                setDetailsReport(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              ← Volver a la lista
            </button>
            <div className="flex items-center gap-3">
              {detailsReport.status === 'draft' && canChange && (
                <button
                  onClick={() => handleEdit(detailsReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              )}
              {detailsReport.status === 'draft' && canSign && (
                <button
                  onClick={() => handleSign(detailsReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileCheck className="w-4 h-4" />
                  Firmar
                </button>
              )}
              {detailsReport.status === 'final' && canReceive && !detailsReport.received_by && (
                <button
                  onClick={() => handleReceive(detailsReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Recibir
                </button>
              )}
              {detailsReport.status === 'final' && (
                <button
                  onClick={() => handleDownloadPdfFrontend(detailsReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Header del reporte */}
            <div className="border-b bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
              <div className="flex items-start justify-between text-white">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{detailsReport.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-blue-100">
                    <span>ID: {detailsReport.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(detailsReport.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                {getStatusBadge(detailsReport.status)}
              </div>
            </div>

            {/* Información del paciente */}
            {detailsReport.patient && (
              <div className="border-b bg-blue-50 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  INFORMACIÓN DEL PACIENTE
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-900">{detailsReport.patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">DNI</p>
                    <p className="font-medium text-gray-900">{detailsReport.patient.dni}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Edad</p>
                    <p className="font-medium text-gray-900">{detailsReport.patient.age} años</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Género</p>
                    <p className="font-medium text-gray-900">{detailsReport.patient.gender}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnóstico IA */}
            {detailsReport.diagnosis_info && (
              <div className="border-b bg-gray-50 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  DIAGNÓSTICO IA
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Predicción</p>
                    <p className="font-medium text-gray-900">{detailsReport.diagnosis_info.predicted_class}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Confianza</p>
                    <p className="font-medium text-gray-900">{detailsReport.diagnosis_info.confidence_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <p className="font-medium text-gray-900">
                      {detailsReport.diagnosis_info.is_reviewed ? 'Revisado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del reporte */}
            <div className="p-6 space-y-6">
              {/* Hallazgos */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Hallazgos Radiológicos
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {detailsReport.findings}
                  </p>
                </div>
              </div>

              {/* Impresión */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Impresión Diagnóstica
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {detailsReport.impression}
                  </p>
                </div>
              </div>

              {/* Recomendaciones */}
              {detailsReport.recommendations && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Recomendaciones Clínicas
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {detailsReport.recommendations}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Firmas */}
            <div className="border-t bg-gray-50 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">FIRMA DEL MÉDICO TRATANTE</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
                <p className="text-xs font-medium text-gray-500 mb-2">Médico Tratante</p>
                {detailsReport.received_by ? (
                  <>
                    <p className="font-semibold text-gray-900">{detailsReport.received_by_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Firmado: {new Date(detailsReport.received_at!).toLocaleString('es-ES')}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 italic">Pendiente de firma</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                Reportes Médicos
              </h1>
              <p className="text-gray-600 mt-1">
                Gestión de reportes radiológicos y diagnósticos
              </p>
            </div>
            {canAdd && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Nuevo Reporte
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por título, hallazgos..."
                  value={filters.search || ''}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterStatus((e.target.value || undefined) as MedicalReportFilters['status'])}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="final">Final</option>
                  <option value="revised">Revisado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de reportes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay reportes</h3>
            <p className="text-gray-600">
              {filters.search || filters.status
                ? 'No se encontraron reportes con los filtros aplicados'
                : 'Comienza creando tu primer reporte médico'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    {report.patient && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {report.patient.full_name}
                        </span>
                        <span>DNI: {report.patient.dni}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {report.status === 'draft' && canChange && (
                      <button
                        onClick={() => handleEdit(report)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(report)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Hallazgos</p>
                    <p className="text-sm text-gray-800 line-clamp-2">{report.findings}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Impresión</p>
                    <p className="text-sm text-gray-800 line-clamp-2">{report.impression}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {report.received_by_name && (
                      <span>Firmado por: {report.received_by_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === 'draft' && canSign && (
                      <button
                        onClick={() => handleSign(report)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <FileCheck className="w-4 h-4" />
                        Firmar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {pagination.count > filters.page_size! && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">
              Mostrando {reports.length} de {pagination.count} reportes
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                disabled={!pagination.previous}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                disabled={!pagination.next}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <MedicalReportModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedReport(null);
        }}
        onSuccess={handleModalSuccess}
        report={selectedReport}
      />
    </div>
  );
}