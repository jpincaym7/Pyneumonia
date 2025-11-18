
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipos basados en los modelos Django
export interface MedicalOrder {
  id: string;
  reason?: string;
  priority?: string;
  status?: string;
  created_at?: string;
}

export interface DiagnosisResult {
  id: string;
  predicted_class: string;
  class_id: number;
  confidence: number | string;
  status: string;
  is_reviewed: boolean;
  reviewed_by?: UserInfo | null;
  reviewed_at?: string | null;
  radiologist_review?: UserInfo | null;
  radiologist_notes?: string | null;
  radiologist_reviewed_at?: string | null;
  severity?: string | null;
  treating_physician_approval?: UserInfo | null;
  treating_physician_notes?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at?: string;
  notes?: string;
  xray_details: XRayDetails;
  reviewed_by_name?: string;
  medical_order?: MedicalOrder;
  confidence_percentage?: number;
  is_pneumonia?: boolean;
}

export interface XRayDetails {
  id: string;
  image_url?: string;
  patient_name: string;
  patient_dni: string;
  uploaded_by?: UserInfo | string;
  uploaded_by_name?: string;
  uploaded_at?: string;
}

export interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  specialty_focus?: string;
}

/**
 * Carga una imagen de forma asíncrona para jsPDF.
 * @param {string} url - La URL de la imagen.
 * @returns {Promise<HTMLImageElement>} - Promesa que resuelve con el objeto de imagen cargado.
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Asegurarse de que estamos en el navegador
    if (typeof window === 'undefined') {
      return reject(new Error('La carga de imágenes solo puede ocurrir en el cliente.'));
    }
    const img = new window.Image();
    img.crossOrigin = 'Anonymous'; // Necesario para cargar imágenes de otros dominios
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`No se pudo cargar la imagen de: ${url}. Error: ${err}`));
  });
};

/**
 * Genera un PDF de Diagnóstico Radiológico profesional.
 * @param {DiagnosisResult} diagnosis - El objeto con los datos del diagnóstico.
 */
export async function generateDiagnosisPDF(diagnosis: DiagnosisResult) {
  // Guard clause: Asegura que solo se ejecute en el navegador
  if (typeof window === 'undefined') {
    console.error('La generación de PDF solo puede ocurrir en el cliente.');
    return;
  }

  console.log(diagnosis)

  const doc = new jsPDF('p', 'mm', 'a4'); // 'p' (portrait), 'mm' (milímetros), 'a4' (tamaño)
  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (pageMargin * 2);
  let startY = 50; // Posición Y inicial

  // --- Funciones de Ayuda (Tus funciones) ---
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleString('es-ES');
  };
  const formatConfidence = (confidence: number | string | null | undefined): string => {
    if (confidence === null || confidence === undefined) return 'N/A';
    const num = typeof confidence === 'number' ? confidence : parseFloat(confidence);
    if (isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(1)}%`;
  };
  const formatStatus = (status?: string | null): string => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // --- Plantilla de Encabezado y Pie de Página (Tu función) ---
  // Tipo para el callback de autoTable
  type AutoTableHookData = {
    pageNumber: number;
    settings: { margin: { left: number; right: number } };
  };
  const pageHeaderAndFooter = (data: AutoTableHookData) => {
    // === ENCABEZADO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CENTRO DE IMAGENOLOGÍA DIGITAL', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Reporte Confidencial de Diagnóstico por IA', doc.internal.pageSize.getWidth() / 2, 21, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(pageMargin, 25, pageWidth - pageMargin, 25); // Línea horizontal corregida

    // === PIE DE PÁGINA ===
    const pageCount = data.pageNumber;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Página ${pageCount}`,
      data.settings.margin.left,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Generado: ${formatDateTime(new Date().toISOString())}`,
      doc.internal.pageSize.getWidth() - data.settings.margin.right,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  };

  // --- Cargar la imagen ANTES de dibujar ---
  let loadedImg: HTMLImageElement | null = null;
  if (diagnosis.xray_details?.image_url) {
    try {
      loadedImg = await loadImage(diagnosis.xray_details.image_url);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  // --- Título Principal ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Diagnóstico Radiológico', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

  // --- Tabla 1: Datos del Paciente y Estudio (Ancho completo) ---
  // (Esta es la tabla que querías "arriba")
  // --- Tabla enriquecida: Datos del Paciente y Estudio ---
  autoTable(doc, {
    startY: startY,
    head: [
      [
        { content: 'Datos del Paciente', colSpan: 2, styles: { halign: 'center', fillColor: [41, 128, 185] } },
        { content: 'Datos del Estudio', colSpan: 3, styles: { halign: 'center', fillColor: [41, 128, 185] } },
      ]
    ],
    body: [
      [
        'Nombre:', diagnosis.xray_details?.patient_name || 'N/A',
        'DNI:', diagnosis.xray_details?.patient_dni || 'N/A',
        'ID Diagnóstico:', diagnosis.id || 'N/A',
        'ID Orden:', diagnosis.medical_order?.id || 'N/A',
        'Prioridad:', diagnosis.medical_order?.priority || 'N/A',
      ],
      [
        'Motivo:', diagnosis.medical_order?.reason || 'N/A',
        'Fecha Estudio:', formatDate(diagnosis.created_at),
        'Fecha Carga RX:', formatDate(diagnosis.xray_details?.uploaded_at),
        '',
        '',
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [255, 255, 255] },
    didDrawPage: pageHeaderAndFooter,
    margin: { left: pageMargin, right: pageMargin }
  });

  startY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // --- SECCIÓN DE DOS COLUMNAS ---
  
  // --- Columna Izquierda: Imagen ---
  const leftColX = pageMargin;
  const leftColWidth = 85; // Ancho para la imagen (en mm)
  let imageBottomY = startY; // Guardará la 'Y' final de la imagen

  if (loadedImg) {
    const imgProps = doc.getImageProperties(loadedImg);
    // Calcular altura proporcional
    const imgHeight = (imgProps.height * leftColWidth) / imgProps.width;
    doc.addImage(loadedImg, 'JPEG', leftColX, startY, leftColWidth, imgHeight);
    doc.setDrawColor(200);
    doc.rect(leftColX, startY, leftColWidth, imgHeight, 'S'); // Borde sutil
    imageBottomY = startY + imgHeight;
  } else {
    // Placeholder si no hay imagen
    doc.setFillColor(245, 245, 245);
    doc.rect(leftColX, startY, leftColWidth, 85, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Imagen no disponible', leftColX + leftColWidth / 2, startY + 42.5, { align: 'center' });
    imageBottomY = startY + 85;
  }

  // --- Columna Derecha: Tablas de Análisis y Validación ---
  const rightColX = leftColX + leftColWidth + 10; // Posición X
  const rightColWidth = contentWidth - leftColWidth - 10; // Ancho
  let textBottomY = startY; // Guardará la 'Y' final de las tablas

  // Tabla 2: Análisis Asistido por IA (en la columna derecha)
  // --- Tabla: Análisis Asistido por IA ---
  autoTable(doc, {
    startY: startY,
    head: [[
      { content: 'Análisis Asistido por IA', colSpan: 2, styles: { halign: 'center', fillColor: [44, 62, 80] } }
    ]],
    body: [
      ['Predicción:', diagnosis.predicted_class || 'N/A'],
      ['Confianza:', diagnosis.confidence_percentage ? `${diagnosis.confidence_percentage}%` : formatConfidence(diagnosis.confidence)],
      ['Estado IA:', formatStatus(diagnosis.status)],
      ['¿Diagnóstico de Neumonía?:', diagnosis.is_pneumonia ? 'Sí' : 'No'],
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [255, 255, 255] },
    didDrawPage: pageHeaderAndFooter,
    margin: { left: rightColX, right: pageMargin },
    tableWidth: rightColWidth
  });

  textBottomY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Tabla 3: Validación del Especialista (debajo de la tabla 2)
  // Mostrar nombre del radiólogo y del médico revisor
  let radiologoNombre = 'N/A';
  const uploadedBy = diagnosis.xray_details?.uploaded_by;
  if (uploadedBy && typeof uploadedBy === 'object' && uploadedBy !== null) {
    const user = uploadedBy as UserInfo;
    radiologoNombre = `${user.first_name} ${user.last_name}`;
  } else if (diagnosis.xray_details?.uploaded_by_name) {
    radiologoNombre = diagnosis.xray_details.uploaded_by_name;
  } else if (typeof uploadedBy === 'string') {
    radiologoNombre = uploadedBy;
  }

  // Médico revisor
  let medicoRevisorNombre = 'N/A';
  if ('reviewed_by_name' in diagnosis && diagnosis.reviewed_by_name) {
    medicoRevisorNombre = diagnosis.reviewed_by_name;
  }

  // --- Tabla: Validación del Especialista ---
  const reviewBody: [string, string][] = [
    ['Estado de Revisión:', diagnosis.is_reviewed ? 'Revisado' : 'Pendiente de Revisión'],
    ['Radiólogo:', radiologoNombre],
    ['Médico Revisor:', medicoRevisorNombre],
  ];
  if (diagnosis.is_reviewed && diagnosis.reviewed_at) {
    reviewBody.push(['Fecha de Revisión:', formatDate(diagnosis.reviewed_at)]);
  }
  if (diagnosis.radiologist_notes) {
    reviewBody.push(['Notas del Radiólogo:', diagnosis.radiologist_notes]);
  }
  if (diagnosis.treating_physician_notes) {
    reviewBody.push(['Notas Médico Tratante:', diagnosis.treating_physician_notes]);
  }

  autoTable(doc, {
    startY: textBottomY + 5, // Inicia después de la tabla anterior
    head: [[
      { content: 'Validación del Especialista', colSpan: 2, styles: { halign: 'center', fillColor: [22, 160, 133] } }
    ]],
    body: reviewBody,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [255, 255, 255] },
    didDrawPage: pageHeaderAndFooter,
    // --- Clave para la columna derecha ---
    margin: { left: rightColX, right: pageMargin },
    tableWidth: rightColWidth
  });

  textBottomY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // --- Sincronizar 'Y' ---
  // La próxima sección debe empezar después del elemento MÁS LARGO (imagen o texto)
  startY = Math.max(imageBottomY, textBottomY) + 10;

  // --- Tabla 4: Observaciones (Ancho completo, al final) ---
  // --- Tabla: Observaciones y Notas Finales ---
  const observaciones: string[] = [];
  if (diagnosis.notes) observaciones.push(diagnosis.notes);
  if (diagnosis.treating_physician_notes) observaciones.push(`Notas Médico Tratante: ${diagnosis.treating_physician_notes}`);
  if (diagnosis.radiologist_notes) observaciones.push(`Notas Radiólogo: ${diagnosis.radiologist_notes}`);

  if (observaciones.length > 0) {
    autoTable(doc, {
      startY: startY,
      head: [[
        { content: 'Observaciones y Notas', styles: { halign: 'left', fillColor: [127, 140, 141] } }
      ]],
      body: observaciones.map(texto => [texto]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fontSize: 11, fontStyle: 'bold', textColor: [255, 255, 255] },
      didDrawPage: pageHeaderAndFooter,
      margin: { left: pageMargin, right: pageMargin }
    });
  }

  // --- Guardar el PDF (SOLO UNA VEZ) ---
  doc.save(`diagnostico_${diagnosis.id || 'sin_id'}.pdf`);
}