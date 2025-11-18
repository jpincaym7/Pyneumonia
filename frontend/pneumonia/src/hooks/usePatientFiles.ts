/**
 * Hook para agrupar radiografías por paciente (expedientes)
 */
import { XRayImage } from '@/types/xray';
import { PatientFile } from '@/components/xrays/PatientFileList';
import { Patient } from '@/types/patient';
import { useMemo } from 'react';

export function usePatientFiles(xrays: XRayImage[], patients: Patient[]) {
  const patientFiles = useMemo(() => {
    const filesMap = new Map<string, PatientFile>();

    // Primero, agregar todos los pacientes activos
    patients.forEach((patient) => {
      if (!patient.dni) return;
      filesMap.set(patient.dni, {
        patient_dni: patient.dni,
        patient_name: patient.first_name + ' ' + patient.last_name,
        xray_count: 0,
        analyzed_count: 0,
        pending_count: 0,
        last_upload: '',
      });
    });

    // Luego, sumar las radiografías a cada paciente
    xrays.forEach((xray) => {
      const dni = xray.patient_dni;
      if (!dni) return;

      if (!filesMap.has(dni)) {
        // Si el paciente no está en la lista, agregarlo con datos mínimos
        filesMap.set(dni, {
          patient_dni: dni,
          patient_name: xray.patient_name || 'Sin nombre',
          xray_count: 0,
          analyzed_count: 0,
          pending_count: 0,
          last_upload: '',
        });
      }

      const file = filesMap.get(dni)!;
      file.xray_count++;
      if (xray.is_analyzed) {
        file.analyzed_count++;
      } else {
        file.pending_count++;
      }
      // Actualizar última carga si es más reciente
      if (!file.last_upload || new Date(xray.uploaded_at) > new Date(file.last_upload)) {
        file.last_upload = xray.uploaded_at;
      }
    });

    return Array.from(filesMap.values()).sort((a, b) =>
      a.patient_name.localeCompare(b.patient_name)
    );
  }, [xrays, patients]);

  const getPatientXRays = (dni: string) => {
    return xrays
      .filter((x) => x.patient_dni === dni)
      .sort(
        (a, b) =>
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
  };

  return {
    patientFiles,
    getPatientXRays,
  };
}
