/**
 * Utilidades para el manejo de diagnósticos
 */

import { DiagnosisResult } from '@/types/diagnosis';

/**
 * Agrupa los diagnósticos por paciente
 * @param diagnoses - Lista de diagnósticos
 * @returns Map con la clave paciente y lista de diagnósticos
 */
export function groupDiagnosesByPatient(
  diagnoses: DiagnosisResult[]
): Map<string, DiagnosisResult[]> {
  const grouped = new Map<string, DiagnosisResult[]>();

  diagnoses.forEach((diagnosis) => {
    if (diagnosis.xray_details) {
      const key = `${diagnosis.xray_details.patient_dni}-${diagnosis.xray_details.patient_name}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(diagnosis);
    }
  });

  // Ordenar análisis dentro de cada grupo por fecha descendente
  grouped.forEach((analyses) => {
    analyses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return grouped;
}

/**
 * Filtra pacientes por término de búsqueda y letra seleccionada
 * @param grouped - Map de diagnósticos agrupados por paciente
 * @param searchTerm - Término de búsqueda
 * @param selectedLetter - Letra seleccionada para filtrar
 * @returns Map filtrado
 */
export function filterPatientsBySearch(
  grouped: Map<string, DiagnosisResult[]>,
  searchTerm: string,
  selectedLetter: string | null
): Map<string, DiagnosisResult[]> {
  let filtered = grouped;

  // Filtrar por búsqueda de texto
  if (searchTerm.trim()) {
    const tempFiltered = new Map<string, DiagnosisResult[]>();
    const searchLower = searchTerm.toLowerCase();

    filtered.forEach((diagnoses, key) => {
      const firstDiagnosis = diagnoses[0];
      const patientName =
        firstDiagnosis.xray_details?.patient_name?.toLowerCase() || '';
      const patientDNI =
        firstDiagnosis.xray_details?.patient_dni?.toLowerCase() || '';

      if (patientName.includes(searchLower) || patientDNI.includes(searchLower)) {
        tempFiltered.set(key, diagnoses);
      }
    });

    filtered = tempFiltered;
  }

  // Filtrar por letra seleccionada
  if (selectedLetter) {
    const tempFiltered = new Map<string, DiagnosisResult[]>();

    filtered.forEach((diagnoses, key) => {
      const firstDiagnosis = diagnoses[0];
      const patientName = firstDiagnosis.xray_details?.patient_name || '';
      const firstLetter = patientName.charAt(0).toUpperCase();

      if (firstLetter === selectedLetter) {
        tempFiltered.set(key, diagnoses);
      }
    });

    filtered = tempFiltered;
  }

  return filtered;
}

/**
 * Obtiene las letras disponibles de los pacientes
 * @param diagnoses - Lista de diagnósticos
 * @returns Array de letras ordenadas alfabéticamente
 */
export function getAvailableLetters(diagnoses: DiagnosisResult[]): string[] {
  const letters = new Set<string>();
  const grouped = groupDiagnosesByPatient(diagnoses);

  grouped.forEach((diagnoses) => {
    const firstDiagnosis = diagnoses[0];
    const patientName = firstDiagnosis.xray_details?.patient_name || '';
    const firstLetter = patientName.charAt(0).toUpperCase();

    if (firstLetter.match(/[A-Z]/)) {
      letters.add(firstLetter);
    }
  });

  return Array.from(letters).sort();
}

/**
 * Calcula estadísticas de diagnósticos
 * @param diagnoses - Lista de diagnósticos
 * @returns Objeto con estadísticas
 */
export function calculateDiagnosisStats(diagnoses: DiagnosisResult[]) {
  return {
    total: diagnoses.length,
    analyzed: diagnoses.filter((d) => d.is_reviewed).length,
    pneumonia: diagnoses.filter((d) => d.is_pneumonia).length,
    pending: diagnoses.filter((d) => !d.is_reviewed).length,
  };
}

/**
 * Calcula estadísticas de un paciente específico
 * @param patientDiagnoses - Lista de diagnósticos del paciente
 * @returns Objeto con estadísticas del paciente
 */
export function calculatePatientStats(patientDiagnoses: DiagnosisResult[]) {
  return {
    total: patientDiagnoses.length,
    reviewed: patientDiagnoses.filter((d) => d.is_reviewed).length,
    pneumonia: patientDiagnoses.filter((d) => d.is_pneumonia).length,
    pending: patientDiagnoses.filter((d) => !d.is_reviewed).length,
  };
}

/**
 * Obtiene información del paciente desde el primer diagnóstico
 * @param patientDiagnoses - Lista de diagnósticos del paciente
 * @returns Objeto con información del paciente
 */
export function getPatientInfo(patientDiagnoses: DiagnosisResult[]) {
  const firstDiagnosis = patientDiagnoses[0];
  return {
    name: firstDiagnosis.xray_details?.patient_name || 'Paciente Desconocido',
    dni: firstDiagnosis.xray_details?.patient_dni || 'Sin DNI',
  };
}
