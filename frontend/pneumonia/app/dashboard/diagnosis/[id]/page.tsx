/**
 * Página de detalles de un diagnóstico - Diseño tipo Invoice
 * Sistema profesional de radiología con estética de factura médica
 */
'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdArrowBack,
  MdScience,
  MdCheckCircle,
  MdWarning,
  MdPerson,
  MdImage,
  MdCalendarToday,
  MdLocalHospital,
  MdVerifiedUser,
  MdAssignment,
  MdDownload,
  MdInfoOutline,
  MdAccessTime,
  MdFingerprint,
  MdBadge,
} from 'react-icons/md';
import { DiagnosisResult } from '@/types/diagnosis';
import diagnosisService from '@/services/diagnosis.service';
import { useDiagnosisPermissions } from '@/hooks/useDiagnosisPermissions';
import { useUserGroup } from '@/hooks/useUserGroup';
import { generateDiagnosisPDF } from '@/lib/pdf-generator';

// --- Componente de Spinner ---
const ProfessionalSpinner = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center bg-white p-12 rounded-lg shadow-md border border-slate-200">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
        <MdLocalHospital className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-6 text-slate-800 font-semibold text-lg">{message}</p>
      <p className="mt-2 text-slate-500 text-sm">Por favor, espere un momento</p>
    </div>
  </div>
);

// --- Componente de Mensaje de Error ---
const InfoMessage = ({
  icon: Icon,
  title,
  message,
  buttonText,
  onButtonClick,
  iconColor = 'text-amber-600',
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
  iconColor?: string;
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center bg-white p-12 rounded-lg shadow-md border border-slate-200 max-w-md">
      <div className={`bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
        <Icon className={`h-12 w-12 ${iconColor}`} />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3">{title}</h2>
      <p className="text-slate-600 mb-6">{message}</p>
      <button
        onClick={onButtonClick}
        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-colors"
      >
        {buttonText}
      </button>
    </div>
  </div>
);

// --- Componente Principal ---
export default function DiagnosisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { canView, isLoading: permissionsLoading } = useDiagnosisPermissions();
  const { isPhysician, isAdmin, isLoading: userGroupLoading } = useUserGroup();

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const loadDiagnosis = async () => {
      if (!canView || permissionsLoading) return;

      try {
        setIsLoading(true);
        const data = await diagnosisService.get(resolvedParams.id);
        setDiagnosis(data);
      } catch (err: unknown) {
        const error = err as { data?: { detail?: string } };
        console.error('Error al cargar diagnóstico:', err);
        setError(error?.data?.detail || 'Error al cargar el diagnóstico');
      } finally {
        setIsLoading(false);
      }
    };

    loadDiagnosis();
  }, [resolvedParams.id, canView, permissionsLoading]);

  const handleMarkReviewed = async () => {
    if (!diagnosis) return;

    // Validar que sea médico
    if (!isPhysician && !isAdmin) {
      setReviewError('Solo médicos pueden revisar diagnósticos');
      setTimeout(() => setReviewError(null), 3000);
      return;
    }

    try {
      setReviewError(null);
      const updated = await diagnosisService.markReviewed(diagnosis.id);
      // Actualizar el estado con el diagnóstico revisado
      setDiagnosis(updated);
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      console.error('Error al marcar como revisado:', err);
      setReviewError(error?.data?.detail || 'Error al marcar como revisado');
    }
  };

  const handleDownloadPDF = async () => {
    if (!diagnosis) return;

    try {
      setIsGeneratingPDF(true);
      await generateDiagnosisPDF(diagnosis);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (permissionsLoading || userGroupLoading || isLoading) {
    return (
      <ProfessionalSpinner
        message={permissionsLoading || userGroupLoading ? 'Verificando permisos...' : 'Cargando diagnóstico...'}
      />
    );
  }

  if (!canView) {
    return (
      <InfoMessage
        icon={MdWarning}
        title="Acceso Denegado"
        message="No tienes permisos para visualizar este diagnóstico médico."
        buttonText="Volver al Panel"
        onButtonClick={() => router.back()}
        iconColor="text-amber-600"
      />
    );
  }

  if (error || !diagnosis) {
    return (
      <InfoMessage
        icon={MdInfoOutline}
        title="Error al Cargar"
        message={error || 'Diagnóstico no encontrado en el sistema.'}
        buttonText="Volver al Panel"
        onButtonClick={() => router.back()}
        iconColor="text-red-600"
      />
    );
  }

  const getClassInfo = (predictedClass: string) => {
    const info: Record<string, { label: string; color: string; bg: string; severity: string }> = {
      NORMAL: { 
        label: 'Normal', 
        color: 'text-green-700', 
        bg: 'bg-green-50',
        severity: 'Sin hallazgos patológicos'
      },
      PNEUMONIA_BACTERIA: { 
        label: 'Neumonía Bacteriana', 
        color: 'text-amber-700', 
        bg: 'bg-amber-50',
        severity: 'Requiere atención médica'
      },
      PNEUMONIA_BACTERIAL: { 
        label: 'Neumonía Bacterial', 
        color: 'text-amber-700', 
        bg: 'bg-amber-50',
        severity: 'Requiere atención médica'
      },
      PNEUMONIA_VIRAL: { 
        label: 'Neumonía Viral', 
        color: 'text-orange-700', 
        bg: 'bg-orange-50',
        severity: 'Requiere seguimiento médico'
      },
    };
    return info[predictedClass] || { 
      label: predictedClass, 
      color: 'text-slate-700', 
      bg: 'bg-slate-50',
      severity: 'Diagnóstico pendiente'
    };
  };

  const classInfo = getClassInfo(diagnosis.predicted_class);
  const confidence = (parseFloat(diagnosis.confidence) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      {/* Botón Volver */}
      <div className="max-w-5xl mx-auto mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <MdArrowBack className="h-5 w-5" />
          Volver a Diagnósticos
        </button>
      </div>

      {/* Contenedor Principal - Estilo Invoice */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200">
        
        {/* Header - Encabezado Profesional */}
        <div className="bg-slate-800 text-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MdLocalHospital className="h-10 w-10" />
                <div>
                  <h1 className="text-2xl font-bold">INFORME RADIOLÓGICO</h1>
                  <p className="text-slate-300 text-sm">Sistema de Diagnóstico por IA</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Nº Informe</p>
              <p className="text-xl font-bold font-mono">{diagnosis.id.slice(0, 8).toUpperCase()}</p>
              <div className="mt-3 flex items-center justify-end gap-2">
                {diagnosis.is_reviewed ? (
                  <span className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    <MdCheckCircle className="h-4 w-4" />
                    REVISADO
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    <MdWarning className="h-4 w-4" />
                    PENDIENTE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información del Paciente - Estilo Factura */}
        <div className="px-8 py-6 bg-slate-50 border-b-2 border-slate-200">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Datos del Paciente */}
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdPerson className="h-4 w-4" />
                Información del Paciente
              </h2>
              {diagnosis.xray_details && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">Nombre:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {diagnosis.xray_details.patient_name}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">DNI/ID:</span>
                    <span className="text-sm font-mono font-semibold text-slate-900">
                      {diagnosis.xray_details.patient_dni}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fechas del Estudio */}
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdCalendarToday className="h-4 w-4" />
                Fechas del Estudio
              </h2>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 w-24 flex-shrink-0">Fecha análisis:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {new Date(diagnosis.created_at).toLocaleDateString('es-ES', { 
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })} - {new Date(diagnosis.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {diagnosis.reviewed_at && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-500 w-24 flex-shrink-0">Fecha revisión:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(diagnosis.reviewed_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })} - {new Date(diagnosis.reviewed_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Resultados - Tabla Estilo Invoice */}
        <div className="px-8 py-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MdScience className="h-6 w-6 text-slate-700" />
            Resultados del Análisis Radiológico
          </h2>

          {/* Tabla de Resultados */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
            {/* Header de tabla */}
            <div className="bg-slate-700 text-white px-6 py-3 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-6">Parámetro</div>
              <div className="col-span-4">Resultado</div>
              <div className="col-span-2 text-right">Confianza</div>
            </div>

            {/* Fila de Diagnóstico Principal */}
            <div className="px-6 py-4 border-b border-slate-200 grid grid-cols-12 gap-4 items-center hover:bg-slate-50">
              <div className="col-span-6">
                <p className="font-semibold text-slate-900">Diagnóstico Principal</p>
                <p className="text-xs text-slate-500 mt-0.5">{classInfo.severity}</p>
              </div>
              <div className="col-span-4">
                <span className={`inline-flex items-center gap-2 ${classInfo.bg} ${classInfo.color} px-3 py-1.5 rounded-md font-bold text-sm border border-current border-opacity-20`}>
                  {classInfo.label}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-lg font-bold text-slate-900">{confidence}%</p>
              </div>
            </div>

            {/* Fila de Estado del Análisis */}
            <div className="px-6 py-4 border-b border-slate-200 grid grid-cols-12 gap-4 items-center hover:bg-slate-50">
              <div className="col-span-6">
                <p className="font-semibold text-slate-900">Estado del Análisis</p>
                <p className="text-xs text-slate-500 mt-0.5">Procesamiento de imagen completado</p>
              </div>
              <div className="col-span-4">
                <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-bold text-sm">
                  {diagnosis.status}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm text-slate-600">100%</p>
              </div>
            </div>

            {/* Fila de Tiempo de Proceso */}
            {diagnosis.processing_time && (
              <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50">
                <div className="col-span-6">
                  <p className="font-semibold text-slate-900">Tiempo de Procesamiento</p>
                  <p className="text-xs text-slate-500 mt-0.5">Duración del análisis</p>
                </div>
                <div className="col-span-4">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <MdAccessTime className="h-4 w-4" />
                    {diagnosis.processing_time.toFixed(2)} segundos
                  </span>
                </div>
                <div className="col-span-2"></div>
              </div>
            )}
          </div>

          {/* Barra de Confianza Visual */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">NIVEL DE CONFIANZA DEL MODELO</span>
              <span className="text-2xl font-bold text-slate-900">{confidence}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden border border-slate-300">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-end pr-3"
                style={{ width: `${confidence}%` }}
              >
                <span className="text-white text-xs font-bold">{confidence}%</span>
              </div>
            </div>
          </div>

          {/* Notas Médicas */}
          {diagnosis.medical_notes && (
            <div className="border-l-4 border-blue-600 bg-blue-50 p-6 rounded-r-lg mb-6">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdAssignment className="h-5 w-5" />
                Observaciones Médicas
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {diagnosis.medical_notes}
              </p>
            </div>
          )}

          {/* Imagen de Radiografía */}
          {diagnosis.xray_details?.image_url && (
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-700 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                <MdImage className="h-5 w-5" />
                IMAGEN RADIOGRÁFICA ANALIZADA
              </div>
              <div className="bg-black p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={diagnosis.xray_details.image_url}
                  alt="Radiografía de tórax"
                  className="w-full h-auto object-contain max-h-[500px] mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Disclaimer y Acciones */}
        <div className="px-8 py-6 bg-slate-50 border-t-2 border-slate-200">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            {/* Disclaimer */}
            <div className="flex-1">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MdVerifiedUser className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Aviso Legal Importante</p>
                  <p className="text-xs leading-relaxed">
                    Este diagnóstico ha sido generado mediante inteligencia artificial y debe ser 
                    validado por un profesional médico certificado antes de tomar cualquier decisión clínica. 
                    Este documento es confidencial y está protegido por las leyes de privacidad médica.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdDownload className="h-5 w-5" />
                {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
              </button>
              
              {(isPhysician || isAdmin) && !diagnosis.is_reviewed && (
                <button
                  onClick={handleMarkReviewed}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm"
                  title="Solo médicos pueden revisar diagnósticos"
                >
                  <MdCheckCircle className="h-5 w-5" />
                  Marcar Revisado
                </button>
              )}

              {diagnosis.is_reviewed && (
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold border border-green-300">
                  <MdCheckCircle className="h-5 w-5" />
                  Revisado
                </div>
              )}
            </div>
          </div>
          
          {/* Mensaje de Error si no es Médico */}
          {reviewError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
              <MdWarning className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{reviewError}</p>
            </div>
          )}
        </div>

        {/* Firma Digital / ID del Sistema */}
        <div className="px-8 py-4 bg-slate-800 text-slate-400 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <MdFingerprint className="h-4 w-4" />
                ID: {diagnosis.id}
              </span>
              <span>Sistema certificado ISO 13485</span>
            </div>
            <div className="flex items-center gap-2">
              <MdBadge className="h-4 w-4" />
              <span>Documento electrónico válido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Espacio inferior */}
      <div className="h-8"></div>
    </div>
  );
}