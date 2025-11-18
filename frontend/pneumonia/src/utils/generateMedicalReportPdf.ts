import jsPDF from 'jspdf';
// 1. Cambia la importación
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF de reporte médico profesional usando jsPDF y jsPDF-AutoTable.
 * @param {object} report - El objeto con los datos del reporte.
 */
export function generateMedicalReportPdf(report) {
  const doc = new jsPDF();

  // --- Funciones de Ayuda ---

  // Formatea la fecha (ej: 31/12/2025)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // Formatea la fecha y hora (ej: 31/12/2025, 14:30)
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // --- Plantilla de Encabezado y Pie de Página ---
  
  const pageHeaderAndFooter = (data) => {
    // === ENCABEZADO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    // 
    doc.text('CENTRO MÉDICO SEDIMEC', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Guayas, Guayaquil. Av Centenario', doc.internal.pageSize.getWidth() / 2, 21, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25); // Línea horizontal

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
      `Generado: ${formatDateTime(new Date())}`,
      doc.internal.pageSize.getWidth() - data.settings.margin.right,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  };

  // --- Título Principal ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Médico Confidencial', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

  let startY = 50; // Posición Y inicial para la primera tabla

  // --- Tabla 1: Información del Paciente y Reporte ---
  autoTable(doc, {
    startY: startY,
    head: [
      [
        { content: 'Información del Paciente', colSpan: 2, styles: { halign: 'center', fillColor: [22, 160, 133] } },
        { content: 'Datos del Reporte', colSpan: 2, styles: { halign: 'center', fillColor: [22, 160, 133] } },
      ]
    ],
    body: [
      ['Nombre:', report.patient?.full_name || 'N/A', 'ID Reporte:', report.id || 'N/A'],
      ['DNI:', report.patient?.dni || 'N/A', 'Título:', report.title || 'N/A'],
      ['Edad:', `${report.patient?.age || 'N/A'} años`, 'Fecha:', formatDate(report.created_at)],
      ['Género:', report.patient?.gender || 'N/A', 'Estado IA:', report.diagnosis_info?.is_reviewed ? 'Revisado' : 'Pendiente'],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fontSize: 10, fontStyle: 'bold' },
    didDrawPage: pageHeaderAndFooter, // Aplica el encabezado/pie en esta y futuras páginas
  });

  startY = (doc as any).lastAutoTable.finalY + 8; // Actualiza Y para la siguiente tabla

  // --- Tabla 2: Diagnóstico Asistido por IA ---
  if (report.diagnosis_info) {
    autoTable(doc, {
      startY: startY,
      head: [[
        { content: 'Diagnóstico Asistido por IA', colSpan: 2, styles: { halign: 'center', fillColor: [44, 62, 80] } }
      ]],
      body: [
        ['Predicción:', report.diagnosis_info.predicted_class || 'N/A'],
        ['Confianza:', `${report.diagnosis_info.confidence_percentage || 'N/A'}%`],
      ],
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fontSize: 10, fontStyle: 'bold' },
      didDrawPage: pageHeaderAndFooter,
    });
    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- Tabla 3: Secciones del Reporte (Manejo de texto largo) ---
  const reportSections = [
    { title: 'Hallazgos Radiológicos', content: report.findings },
    { title: 'Impresión Diagnóstica', content: report.impression },
    { title: 'Recomendaciones Clínicas', content: report.recommendations },
  ];

  autoTable(doc, {
    startY: startY,
    head: [[
      { content: 'Secciones del Reporte', colSpan: 2, styles: { halign: 'center', fillColor: [41, 128, 185] } }
    ]],
    body: reportSections.map(sec => [sec.title, sec.content || 'Sin información.']),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fontSize: 11, fontStyle: 'bold' },
    columnStyles: {
      // Columna de Título
      0: { fontStyle: 'bold', cellWidth: 50, valign: 'top' },
      // Columna de Contenido (se ajustará automáticamente)
      1: { cellWidth: 'auto' } 
    },
    didDrawPage: pageHeaderAndFooter,
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // --- Tabla 4: Firmas y Revisiones ---
  const signatureBody = [];
  if (report.received_by_name) {
    signatureBody.push(['Médico Tratante', report.received_by_name, formatDateTime(report.received_at)]);
  }

  autoTable(doc, {
    startY: startY,
    head: [['Rol', 'Nombre', 'Fecha y Hora']],
    body: signatureBody.length > 0 ? signatureBody : [['-', 'Sin firmas registradas', '-']],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fontSize: 10, fontStyle: 'bold', fillColor: [149, 165, 166], textColor: 0 },
    didDrawPage: pageHeaderAndFooter,
  });

  // --- Guardar el PDF ---
  doc.save(`reporte_medico_${report.id || 'sin_id'}.pdf`);
}