/**
 * Generador de PDF para informes de diagnóstico médico
 * Sistema profesional de salud con imagen de radiografía
 */
import { DiagnosisResult } from '@/types/diagnosis';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateDiagnosisPDF = async (diagnosis: DiagnosisResult): Promise<void> => {
  // Convertir imagen a base64 si existe
  let imageBase64 = '';
  if (diagnosis.xray_details?.image_url) {
    try {
      imageBase64 = await convertImageToBase64(diagnosis.xray_details.image_url);
    } catch (error) {
      console.error('Error al convertir imagen:', error);
    }
  }

  // Generar PDF usando jsPDF directamente con múltiples páginas
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Crear contenedor para la primera página (información del paciente)
    const page1Container = document.createElement('div');
    page1Container.style.position = 'absolute';
    page1Container.style.left = '-9999px';
    page1Container.style.top = '0';
    page1Container.style.width = '794px'; // Ancho A4 en píxeles (210mm a 96 DPI)
    page1Container.style.padding = '40px';
    page1Container.style.backgroundColor = '#ffffff';
    page1Container.style.fontFamily = 'Arial, sans-serif';
    page1Container.style.fontSize = '14px';
    page1Container.style.lineHeight = '1.6';
    page1Container.style.color = '#000000';
    
    // Construir el contenido de la primera página
    page1Container.innerHTML = `
      <div style="width: 100%; max-width: 714px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 28px; color: #2c3e50; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase;">
            Informe de Diagnóstico Médico
          </h1>
          <p style="font-size: 12px; color: #666; margin: 5px 0; text-transform: uppercase; letter-spacing: 1px;">
            Análisis Radiológico - Sistema de Diagnóstico por IA
          </p>
          <p style="font-size: 11px; color: #999; margin: 10px 0 0 0; font-family: monospace;">
            ID: ${diagnosis.id}
          </p>
        </div>
        
        <!-- Información del Paciente -->
        <div style="margin-bottom: 25px;">
          <div style="background: #34495e; color: white; padding: 8px 12px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
            DATOS DEL PACIENTE
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; width: 40%;">
                Nombre Completo:
              </td>
              <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                ${diagnosis.xray_details?.patient_name || 'No especificado'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold;">
                DNI / Identificación:
              </td>
              <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                ${diagnosis.xray_details?.patient_dni || 'No especificado'}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Información del Estudio -->
        <div style="margin-bottom: 25px;">
          <div style="background: #34495e; color: white; padding: 8px 12px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
            DETALLES DEL ESTUDIO
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; width: 40%;">
                Fecha de Análisis:
              </td>
              <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                ${new Date(diagnosis.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} - ${new Date(diagnosis.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </tr>
            ${diagnosis.reviewed_at ? `
              <tr>
                <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold;">
                  Fecha de Revisión:
                </td>
                <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                  ${new Date(diagnosis.reviewed_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} - ${new Date(diagnosis.reviewed_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold;">
                Estado del Estudio:
              </td>
              <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                ${diagnosis.status}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold;">
                Estado de Revisión:
              </td>
              <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                ${diagnosis.is_reviewed ? 'Revisado' : 'Pendiente de Revisión'}
              </td>
            </tr>
            ${diagnosis.processing_time ? `
              <tr>
                <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold;">
                  Tiempo de Procesamiento:
                </td>
                <td style="padding: 10px; background: #ffffff; border: 1px solid #dee2e6;">
                  ${diagnosis.processing_time.toFixed(2)} segundos
                </td>
              </tr>
            ` : ''}
          </table>
        </div>
        
        <!-- Resultado del Diagnóstico -->
        <div style="margin-bottom: 25px;">
          <div style="background: #34495e; color: white; padding: 8px 12px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
            RESULTADO DEL DIAGNÓSTICO
          </div>
          <div style="border: 3px solid #34495e; padding: 25px; text-align: center; background: #f8f9fa;">
            <div style="font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 15px;">
              ${getDiagnosisLabel(diagnosis.predicted_class)}
            </div>
            ${diagnosis.severity ? `
              <div style="margin-top: 15px;">
                <div style="font-size: 12px; color: #666; font-weight: bold; margin-bottom: 5px;">
                  NIVEL DE SEVERIDAD
                </div>
                <div style="font-size: 18px; color: #2c3e50; font-weight: bold; text-transform: capitalize;">
                  ${diagnosis.severity}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Notas Médicas -->
        ${diagnosis.medical_notes ? `
          <div style="margin-bottom: 25px;">
            <div style="background: #f39c12; color: white; padding: 8px 12px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
              NOTAS MÉDICAS
            </div>
            <div style="background: #fff9e6; border-left: 4px solid #f39c12; padding: 15px; white-space: pre-wrap;">
              ${diagnosis.medical_notes}
            </div>
          </div>
        ` : ''}
        
        <!-- Aviso Importante -->
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-left: 4px solid #ff9800; padding: 15px; margin: 25px 0;">
          <h3 style="font-size: 13px; font-weight: bold; color: #664d03; margin: 0 0 10px 0; text-transform: uppercase;">
            AVISO MÉDICO-LEGAL IMPORTANTE
          </h3>
          <p style="font-size: 12px; color: #856404; line-height: 1.6; margin: 0;">
            Este informe ha sido generado mediante un sistema de inteligencia artificial como herramienta de apoyo diagnóstico. 
            Los resultados deben ser interpretados y validados por un profesional médico certificado y con licencia vigente 
            antes de tomar cualquier decisión clínica o terapéutica. Este informe no sustituye el juicio clínico profesional 
            ni la evaluación médica directa del paciente.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #dee2e6; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 5px 0;">
            <strong>Sistema de Diagnóstico de Neumonía por Inteligencia Artificial</strong>
          </p>
          <p style="font-size: 11px; color: #999; margin: 5px 0;">
            Informe generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} a las ${new Date().toLocaleTimeString('es-ES')}
          </p>
          <p style="font-size: 10px; color: #adb5bd; margin: 10px 0 0 0;">
            Este documento es confidencial y contiene información médica protegida.
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(page1Container);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Convertir la primera página a canvas
    const canvas1 = await html2canvas(page1Container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
    });

    document.body.removeChild(page1Container);

    // Agregar la primera página al PDF
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    const pdfWidth = 210;
    const pdfHeight = 297;
    const img1Width = pdfWidth;
    const img1Height = (canvas1.height * pdfWidth) / canvas1.width;
    
    pdf.addImage(imgData1, 'JPEG', 0, 0, img1Width, Math.min(img1Height, pdfHeight), '', 'FAST');

    // Si hay imagen de radiografía, crear la segunda página
    if (imageBase64) {
      pdf.addPage();

      // Crear contenedor para la segunda página (imagen de radiografía)
      const page2Container = document.createElement('div');
      page2Container.style.position = 'absolute';
      page2Container.style.left = '-9999px';
      page2Container.style.top = '0';
      page2Container.style.width = '794px';
      page2Container.style.padding = '40px';
      page2Container.style.backgroundColor = '#ffffff';
      page2Container.style.fontFamily = 'Arial, sans-serif';
      page2Container.style.fontSize = '14px';
      page2Container.style.lineHeight = '1.6';
      page2Container.style.color = '#000000';

      page2Container.innerHTML = `
        <div style="width: 100%; max-width: 714px; margin: 0 auto;">
          <!-- Header de la segunda página -->
          <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 15px; margin-bottom: 25px;">
            <h2 style="font-size: 20px; color: #2c3e50; margin: 0;">
              Informe de Diagnóstico - ID: ${diagnosis.id}
            </h2>
          </div>

          <!-- Imagen de Radiografía -->
          <div style="margin-bottom: 25px;">
            <div style="background: #34495e; color: white; padding: 8px 12px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
              IMAGEN RADIOGRÁFICA ANALIZADA
            </div>
            <div style="text-align: center; padding: 15px; background: #000000; border: 3px solid #2c3e50;">
              <img src="${imageBase64}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Radiografía" />
            </div>
            <p style="text-align: center; font-size: 11px; color: #666; font-style: italic; margin-top: 10px;">
              Radiografía de tórax procesada mediante algoritmos de inteligencia artificial
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #dee2e6; text-align: center;">
            <p style="font-size: 11px; color: #999; margin: 5px 0;">
              Página 2 - Imagen Radiográfica
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(page2Container);

      // Esperar a que la imagen se cargue completamente
      const img = page2Container.querySelector('img');
      if (img) {
        await new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => {
              console.warn('Error al cargar imagen en el PDF');
              resolve(true);
            };
            setTimeout(() => resolve(true), 5000);
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // Convertir la segunda página a canvas
      const canvas2 = await html2canvas(page2Container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      });

      document.body.removeChild(page2Container);

      // Agregar la segunda página al PDF
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
      const img2Width = pdfWidth;
      const img2Height = (canvas2.height * pdfWidth) / canvas2.width;
      
      pdf.addImage(imgData2, 'JPEG', 0, 0, img2Width, Math.min(img2Height, pdfHeight), '', 'FAST');
    }

    // Generar nombre de archivo
    const fileName = `Informe_Diagnostico_${diagnosis.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Descargar el PDF
    pdf.save(fileName);
    
    console.log('✅ PDF descargado exitosamente:', fileName);
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
};

/**
 * Convierte una imagen a formato base64
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataURL);
      } catch (error) {
        // Si falla, intentar con la URL original
        console.warn('No se pudo convertir a base64, usando URL original:', error);
        resolve(imageUrl);
      }
    };
    
    img.onerror = () => {
      console.warn('Error al cargar imagen, usando URL original');
      resolve(imageUrl);
    };
    
    img.src = imageUrl;
  });
}

// Función auxiliar para obtener etiquetas legibles
function getDiagnosisLabel(predictedClass: string): string {
  const labels: Record<string, string> = {
    'NORMAL': 'Normal',
    'PNEUMONIA_BACTERIA': 'Neumonía Bacteriana',
    'PNEUMONIA_BACTERIAL': 'Neumonía Bacterial',
    'PNEUMONIA_VIRAL': 'Neumonía Viral',
  };
  return labels[predictedClass] || predictedClass;
}
