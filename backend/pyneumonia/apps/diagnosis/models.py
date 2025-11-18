from django.db import models
from django.core.validators import FileExtensionValidator
from apps.security.models import User
import uuid
from decimal import Decimal
import re
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
import math
from django.utils import timezone



def validate_ecuadorian_dni(value):
    """
    Valida una cédula ecuatoriana de 10 dígitos.
    Implementa el algoritmo de validación oficial del Registro Civil de Ecuador.
    """
    # Eliminar espacios y guiones
    dni = re.sub(r'[-\s]', '', str(value))
    
    # Verificar que tenga exactamente 10 dígitos
    if not re.match(r'^\d{10}$', dni):
        raise ValidationError('La cédula debe tener exactamente 10 dígitos numéricos.')
    
    # Verificar que los dos primeros dígitos correspondan a una provincia válida (01-24)
    provincia = int(dni[:2])
    if provincia < 1 or provincia > 24:
        raise ValidationError('Los dos primeros dígitos deben corresponder a una provincia válida (01-24).')
    
    # Verificar el tercer dígito (debe ser menor a 6 para cédulas de personas naturales)
    # Nota: Se permite hasta 6 para casos especiales
    tercer_digito = int(dni[2])
    if tercer_digito > 6:
        raise ValidationError('El tercer dígito debe ser menor o igual a 6 para cédulas de personas naturales.')
    
    # Algoritmo de validación del dígito verificador
    multiplicador = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    ced_array = [int(d) for d in dni[:9]]
    ultimo_digito = int(dni[9])
    resultado = []
    
    for i, coef in zip(ced_array, multiplicador):
        valor = i * coef
        if valor < 10:
            resultado.append(valor)
        else:
            resultado.append(valor - 9)
    
    suma = sum(resultado)
    digito_verificador = int(math.ceil(suma / 10.0) * 10) - suma
    
    if digito_verificador != ultimo_digito:
        raise ValidationError('La cédula ingresada no es válida. El dígito verificador no coincide.')
    
    return value


def validate_ecuadorian_phone(value):
    """
    Valida que el número de celular ecuatoriano comience con 09 y tenga 10 dígitos.
    """
    # Eliminar espacios, guiones y paréntesis
    phone = re.sub(r'[-\s()]', '', str(value))
    
    if not re.match(r'^09\d{8}$', phone):
        raise ValidationError('El número de celular debe comenzar con 09 y tener 10 dígitos (ejemplo: 0987654321).')
    
    return value


class Patient(models.Model):
    """Modelo para almacenar información de pacientes"""
    
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dni = models.CharField(
        'DNI/Cédula', 
        max_length=20, 
        unique=True,
        validators=[validate_ecuadorian_dni],
        help_text='Ingrese la cédula ecuatoriana de 10 dígitos'
    )
    first_name = models.CharField('Nombres', max_length=100)
    last_name = models.CharField('Apellidos', max_length=100)
    date_of_birth = models.DateField('Fecha de Nacimiento')
    gender = models.CharField('Género', max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(
        'Teléfono', 
        max_length=20, 
        blank=True, 
        null=True,
        validators=[validate_ecuadorian_phone],
        help_text='Número de celular que comience con 09 (ejemplo: 0987654321)'
    )
    email = models.EmailField('Email', blank=True, null=True)
    address = models.TextField('Dirección', blank=True, null=True)
    
    # Información médica básica
    blood_type = models.CharField('Tipo de Sangre', max_length=5, blank=True, null=True)
    allergies = models.TextField('Alergias', blank=True, null=True)
    medical_history = models.TextField('Historia Clínica Resumida', blank=True, null=True)
    
    # Auditoría
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='patients_created')
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    is_active = models.BooleanField('Activo', default=True)
    
    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dni']),
            models.Index(fields=['last_name', 'first_name']),
        ]
    
    def __str__(self):
        return f"{self.dni} - {self.get_full_name()}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    # MÉTODO DELETE ELIMINADO - Ahora permite borrado físico real
    
    def soft_delete(self):
        """Método alternativo para desactivar sin borrar"""
        self.is_active = False
        self.save()
    
    def clean(self):
        """Validación adicional a nivel de modelo"""
        super().clean()
        
        # Normalizar DNI (eliminar espacios y guiones)
        if self.dni:
            self.dni = re.sub(r'[-\s]', '', self.dni)
        
        # Normalizar teléfono (eliminar espacios, guiones y paréntesis)
        if self.phone:
            self.phone = re.sub(r'[-\s()]', '', self.phone)
    
    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class MedicalOrder(models.Model):
    """Modelo para órdenes de estudios radiológicos"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('urgent', 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Paciente y médico solicitante
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_orders')
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='orders_requested',
        help_text='Médico tratante que solicita el estudio'
    )
    
    # Información de la orden
    order_type = models.CharField(
        'Tipo de Estudio',
        max_length=50,
        default='CHEST_XRAY',
        choices=[('CHEST_XRAY', 'Radiografía de Tórax')]
    )
    reason = models.TextField('Motivo de la Solicitud')
    clinical_notes = models.TextField('Notas Clínicas Relevantes', blank=True, null=True)
    priority = models.CharField('Prioridad', max_length=20, choices=PRIORITY_CHOICES, default='normal')
    
    # Estado
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Auditoría
    created_at = models.DateTimeField('Fecha de Solicitud', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    scheduled_date = models.DateTimeField('Fecha Programada', blank=True, null=True)
    completed_date = models.DateTimeField('Fecha Completada', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Orden Médica'
        verbose_name_plural = 'Órdenes Médicas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['requested_by']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"Orden #{self.id} - {self.patient.get_full_name()} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_completed(self):
        return self.status == 'completed'


class XRayImage(models.Model):
    """Modelo para almacenar radiografías de tórax"""
    
    QUALITY_CHOICES = [
        ('excellent', 'Excelente'),
        ('good', 'Buena'),
        ('fair', 'Regular'),
        ('poor', 'Deficiente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Vincular con orden médica
    medical_order = models.OneToOneField(
        MedicalOrder,
        on_delete=models.CASCADE,
        related_name='xray_image',
        help_text='Orden médica asociada',
        null=True,
        blank=True
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='xrays')
    image = models.ImageField(
        'Imagen de Radiografía',
        upload_to='xrays/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'dcm'])]
    )
    
    # Metadata de la imagen
    description = models.TextField('Descripción/Notas', blank=True, null=True)
    quality = models.CharField('Calidad de Imagen', max_length=20, choices=QUALITY_CHOICES, default='good')
    view_position = models.CharField('Posición', max_length=50, default='PA')  # PA, AP, Lateral, etc.
    
    # Estado del análisis
    is_analyzed = models.BooleanField('Analizada', default=False)
    
    # Auditoría
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='xrays_uploaded')
    uploaded_at = models.DateTimeField('Fecha de Carga', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Radiografía'
        verbose_name_plural = 'Radiografías'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['patient', '-uploaded_at']),
            models.Index(fields=['is_analyzed']),
        ]
    
    def __str__(self):
        return f"Radiografía de {self.patient.get_full_name()} - {self.uploaded_at.strftime('%Y-%m-%d')}"


class DiagnosisResult(models.Model):
    """Modelo para almacenar resultados de diagnóstico de IA"""
    
    DIAGNOSIS_CLASSES = [
        ('NORMAL', 'Normal'),
        ('PNEUMONIA_BACTERIA', 'Neumonía Bacteriana'),
        ('PNEUMONIA_BACTERIAL', 'Neumonía Bacterial'),
        ('PNEUMONIA_VIRAL', 'Neumonía Viral'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('analyzing', 'Analizando'),
        ('completed', 'Completado'),
        ('error', 'Error'),
    ]
    
    SEVERITY_CHOICES = [
        ('mild', 'Leve'),
        ('moderate', 'Moderada'),
        ('severe', 'Severa'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    xray = models.OneToOneField(XRayImage, on_delete=models.CASCADE, related_name='diagnosis')
    
    # Resultado de Roboflow (automático, sin responsable humano)
    predicted_class = models.CharField('Clase Predicha', max_length=50, choices=DIAGNOSIS_CLASSES)
    class_id = models.IntegerField('ID de Clase')
    confidence = models.DecimalField('Confianza', max_digits=5, decimal_places=3)  # 0.766 -> 76.6%
    
    # Información adicional del análisis
    raw_response = models.JSONField('Respuesta Raw de API', blank=True, null=True)
    processing_time = models.FloatField('Tiempo de Procesamiento (s)', blank=True, null=True)
    
    # Estado del diagnóstico
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='completed')
    error_message = models.TextField('Mensaje de Error', blank=True, null=True)
    
    # Revisión Médica Rápida (médico que valida/revisa el diagnóstico)
    is_reviewed = models.BooleanField('Revisado por Médico', default=False)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='diagnoses_reviewed',
        help_text='Médico que revisa el diagnóstico'
    )
    reviewed_at = models.DateTimeField('Fecha de Revisión', blank=True, null=True)
    
    # Revisión Radiológica (especialista que interpreta la IA)
    radiologist_review = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='diagnoses_radiologist_reviewed',
        help_text='Radiólogo que revisa la predicción de IA'
    )
    radiologist_notes = models.TextField('Notas del Radiólogo', blank=True, null=True)
    radiologist_reviewed_at = models.DateTimeField('Fecha Revisión Radióloga', blank=True, null=True)
    
    # Severidad asignada por radiólogo (no automatizada)
    severity = models.CharField('Severidad (Radiólogo)', max_length=20, choices=SEVERITY_CHOICES, blank=True, null=True)
    
    # Aprobación médica tratante
    treating_physician_approval = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='diagnoses_approved',
        help_text='Médico tratante que aprueba el diagnóstico'
    )
    treating_physician_notes = models.TextField('Notas del Médico Tratante', blank=True, null=True)
    approved_at = models.DateTimeField('Fecha de Aprobación', blank=True, null=True)
    
    # Auditoría
    created_at = models.DateTimeField('Fecha de Análisis IA', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Resultado de Diagnóstico'
        verbose_name_plural = 'Resultados de Diagnósticos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['predicted_class']),
            models.Index(fields=['status']),
            models.Index(fields=['radiologist_review']),
            models.Index(fields=['treating_physician_approval']),
        ]
    
    def __str__(self):
        return f"Diagnóstico: {self.get_predicted_class_display()} ({self.confidence}%)"
    
    @property
    def confidence_percentage(self):
        """Retorna la confianza como porcentaje"""
        return float(self.confidence * 100)
    
    @property
    def is_pneumonia(self):
        """Verifica si el diagnóstico es algún tipo de neumonía"""
        return self.predicted_class in ['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    
    @property
    def requires_attention(self):
        """Determina si requiere atención médica urgente"""
        return self.is_pneumonia and self.confidence >= Decimal('0.7')
    
    @property
    def patient(self):
        """Obtener el paciente desde la radiografía y orden"""
        return self.xray.medical_order.patient
    
    @property
    def medical_order(self):
        """Obtener la orden médica desde la radiografía"""
        return self.xray.medical_order
    
    @property
    def is_fully_reviewed(self):
        """Verifica si pasó todas las revisiones"""
        return self.radiologist_review is not None and self.treating_physician_approval is not None


class MedicalReport(models.Model):
    """Modelo para reportes médicos basados en diagnósticos"""
    
    REPORT_STATUS = [
        ('draft', 'Borrador'),
        ('final', 'Final'),
        ('revised', 'Revisado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagnosis = models.ForeignKey(DiagnosisResult, on_delete=models.CASCADE, related_name='reports')
    # Contenido del reporte
    title = models.CharField('Título', max_length=200)
    findings = models.TextField('Hallazgos')
    impression = models.TextField('Impresión Diagnóstica')
    recommendations = models.TextField('Recomendaciones')
    
    # Estado del reporte
    status = models.CharField('Estado', max_length=20, choices=REPORT_STATUS, default='draft')
    
    # Separación de roles
    # Médico tratante que genera el reporte
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports_created',
        help_text='Médico tratante que redacta el reporte'
    )
    
    # (El reporte lo firma el mismo médico tratante que lo genera)
    
    # Médico tratante que recibe el reporte
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_received',
        help_text='Médico tratante que recibe el reporte'
    )
    received_at = models.DateTimeField('Fecha Recepción', blank=True, null=True)
    
    # Auditoría
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Reporte Médico'
        verbose_name_plural = 'Reportes Médicos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Reporte: {self.title} - {self.patient.get_full_name()}"

    @property
    def patient(self):
        """Obtener el paciente desde el diagnóstico"""
        return self.diagnosis.xray.medical_order.patient
    
    @property
    def medical_order(self):
        """Obtener la orden médica asociada"""
        return self.diagnosis.xray.medical_order
    
    @property
    def xray(self):
        """Obtener la radiografía asociada"""
        return self.diagnosis.xray
    
    def clean(self):
        """Validaciones adicionales"""
        super().clean()
        
        # Verificar que el diagnóstico esté completado
        if self.diagnosis.status != 'completed':
            raise ValidationError('Solo se pueden generar reportes para diagnósticos completados.')
        
        # Verificar que la orden no esté cancelada
        if self.medical_order.status == 'cancelled':
            raise ValidationError('No se puede generar un reporte para una orden cancelada.')
    
    def save(self, *args, **kwargs):
        """Actualizar estado de la orden al crear reporte"""
        super().save(*args, **kwargs)
        
        # Marcar la orden como completada al generar el reporte
        if self.medical_order.status != 'completed':
            self.medical_order.status = 'completed'
            self.medical_order.completed_date = timezone.now()
            self.medical_order.save()

class DiagnosticStatistics(models.Model):
    """Estadísticas y métricas para médicos/radiólogos"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diagnostic_statistics')
    
    # Período de análisis
    period_start = models.DateField('Inicio del Período')
    period_end = models.DateField('Fin del Período')
    
    # Métricas generales
    total_cases_analyzed = models.IntegerField('Total de Casos Analizados', default=0)
    total_xrays_reviewed = models.IntegerField('Total de Radiografías Revisadas', default=0)
    total_reports_generated = models.IntegerField('Total de Reportes Generados', default=0)
    
    # Diagnósticos por tipo
    normal_cases = models.IntegerField('Casos Normales', default=0)
    pneumonia_bacterial_cases = models.IntegerField('Neumonía Bacteriana', default=0)
    pneumonia_viral_cases = models.IntegerField('Neumonía Viral', default=0)
    
    # Métricas de confianza
    average_confidence = models.DecimalField(
        'Confianza Promedio', 
        max_digits=5, 
        decimal_places=2,
        blank=True,
        null=True
    )
    high_confidence_cases = models.IntegerField('Casos Alta Confianza (>80%)', default=0)
    low_confidence_cases = models.IntegerField('Casos Baja Confianza (<50%)', default=0)
    
    # Métricas de severidad
    mild_cases = models.IntegerField('Casos Leves', default=0)
    moderate_cases = models.IntegerField('Casos Moderados', default=0)
    severe_cases = models.IntegerField('Casos Severos', default=0)
    
    # Métricas de tiempo
    average_processing_time = models.FloatField(
        'Tiempo Promedio de Procesamiento (s)', 
        blank=True, 
        null=True
    )
    average_review_time = models.FloatField(
        'Tiempo Promedio de Revisión (min)', 
        blank=True, 
        null=True
    )
    
    # Calidad y precisión
    peer_agreement_rate = models.DecimalField(
        'Tasa de Acuerdo con Pares (%)', 
        max_digits=5, 
        decimal_places=2,
        blank=True,
        null=True
    )
    revision_rate = models.DecimalField(
        'Tasa de Revisión (%)', 
        max_digits=5, 
        decimal_places=2,
        blank=True,
        null=True
    )
    
    # Auditoría
    calculated_at = models.DateTimeField('Fecha de Cálculo', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Estadística de Diagnóstico'
        verbose_name_plural = 'Estadísticas de Diagnóstico'
        ordering = ['-period_end', '-calculated_at']
        indexes = [
            models.Index(fields=['user', '-period_end']),
            models.Index(fields=['period_start', 'period_end']),
        ]
        unique_together = ['user', 'period_start', 'period_end']
    
    def __str__(self):
        return f"Estadísticas de {self.user.get_full_name()} ({self.period_start} - {self.period_end})"
    
    @property
    def pneumonia_detection_rate(self):
        """Tasa de detección de neumonía"""
        if self.total_cases_analyzed == 0:
            return 0
        pneumonia_total = self.pneumonia_bacterial_cases + self.pneumonia_viral_cases
        return (pneumonia_total / self.total_cases_analyzed) * 100
    
    @property
    def cases_requiring_attention(self):
        """Total de casos que requieren atención"""
        return self.moderate_cases + self.severe_cases


class UserPerformanceMetrics(models.Model):
    """Métricas de rendimiento acumulativas por usuario"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='performance_metrics')
    
    # Contadores acumulativos
    total_diagnoses_lifetime = models.IntegerField('Total Diagnósticos (Histórico)', default=0)
    total_reports_lifetime = models.IntegerField('Total Reportes (Histórico)', default=0)
    total_reviews_lifetime = models.IntegerField('Total Revisiones (Histórico)', default=0)
    
    # Promedios históricos
    lifetime_average_confidence = models.DecimalField(
        'Confianza Promedio Histórica',
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00')
    )
    lifetime_average_processing_time = models.FloatField(
        'Tiempo Promedio Histórico (s)',
        default=0.0
    )
    
    # Ranking y calidad
    accuracy_score = models.DecimalField(
        'Puntuación de Precisión',
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Basado en concordancia con diagnósticos confirmados'
    )
    quality_score = models.DecimalField(
        'Puntuación de Calidad',
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Basado en revisiones por pares y completitud de reportes'
    )
    
    # Especialización
    specialty_focus = models.CharField(
        'Enfoque de Especialidad',
        max_length=100,
        blank=True,
        null=True,
        help_text='Área donde el usuario tiene más experiencia'
    )
    
    # Fechas
    first_diagnosis_date = models.DateTimeField('Primera Diagnosis', blank=True, null=True)
    last_activity_date = models.DateTimeField('Última Actividad', blank=True, null=True)
    
    # Auditoría
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Métrica de Rendimiento de Usuario'
        verbose_name_plural = 'Métricas de Rendimiento de Usuarios'
    
    def __str__(self):
        return f"Métricas de {self.user.get_full_name()}"
    
    @property
    def experience_level(self):
        """Determina el nivel de experiencia basado en casos analizados"""
        if self.total_diagnoses_lifetime < 50:
            return 'Principiante'
        elif self.total_diagnoses_lifetime < 200:
            return 'Intermedio'
        elif self.total_diagnoses_lifetime < 500:
            return 'Avanzado'
        else:
            return 'Experto'
    
    @property
    def overall_performance_score(self):
        """Puntuación general de rendimiento"""
        return (float(self.accuracy_score) + float(self.quality_score)) / 2


class SystemStatistics(models.Model):
    """Estadísticas generales del sistema"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Período
    date = models.DateField('Fecha', unique=True)
    
    # Contadores diarios
    daily_patients_registered = models.IntegerField('Pacientes Registrados Hoy', default=0)
    daily_xrays_uploaded = models.IntegerField('Radiografías Subidas Hoy', default=0)
    daily_diagnoses_made = models.IntegerField('Diagnósticos Realizados Hoy', default=0)
    daily_reports_generated = models.IntegerField('Reportes Generados Hoy', default=0)
    
    # Totales acumulados
    total_patients = models.IntegerField('Total Pacientes', default=0)
    total_xrays = models.IntegerField('Total Radiografías', default=0)
    total_diagnoses = models.IntegerField('Total Diagnósticos', default=0)
    total_reports = models.IntegerField('Total Reportes', default=0)
    
    # Distribución de diagnósticos
    normal_percentage = models.DecimalField(
        'Porcentaje Normal',
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00')
    )
    pneumonia_percentage = models.DecimalField(
        'Porcentaje Neumonía',
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Métricas de sistema
    average_system_response_time = models.FloatField(
        'Tiempo Respuesta Promedio (s)',
        default=0.0
    )
    api_success_rate = models.DecimalField(
        'Tasa Éxito API (%)',
        max_digits=5,
        decimal_places=2,
        default=Decimal('100.00')
    )
    
    # Usuarios activos
    active_users_today = models.IntegerField('Usuarios Activos Hoy', default=0)
    
    # Auditoría
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'Estadística del Sistema'
        verbose_name_plural = 'Estadísticas del Sistema'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"Estadísticas del Sistema - {self.date}"