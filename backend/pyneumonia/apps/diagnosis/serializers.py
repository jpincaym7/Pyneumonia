from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from .models import (
    Patient, XRayImage, DiagnosisResult, MedicalReport, MedicalOrder,
    DiagnosticStatistics, UserPerformanceMetrics, SystemStatistics
)
from .validators import (
    validate_patient_age, validate_medical_notes, validate_confidence_score,
    validate_severity_level, validate_diagnosis_class, validate_email_format,
    validate_no_sql_injection
)
from apps.security.serializers import UserSerializer


class PatientSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Patient con validaciones de seguridad"""
    full_name = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'dni', 'first_name', 'last_name', 'full_name', 'date_of_birth', 'age', 'gender',
            'phone', 'email', 'address', 'blood_type', 'allergies', 'medical_history',
            'created_by', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'age']

    def validate_dni(self, value):
        """Validar DNI único"""
        mensaje = _('Ya existe un paciente con este DNI.')
        if self.instance:
            if Patient.objects.exclude(id=self.instance.id).filter(dni=value).exists():
                raise serializers.ValidationError(mensaje)
        else:
            if Patient.objects.filter(dni=value).exists():
                raise serializers.ValidationError(mensaje)
        return value

    def validate_date_of_birth(self, value):
        """Validar fecha de nacimiento"""
        validate_patient_age(value)
        return value

    def validate_email(self, value):
        """Validar formato de email"""
        if value:
            validate_email_format(value)
        return value

    def validate_medical_history(self, value):
        """Validar contenido de historia médica"""
        if value:
            validate_no_sql_injection(value)
        return value

    def validate_allergies(self, value):
        """Validar contenido de alergias"""
        if value:
            validate_no_sql_injection(value)
        return value

    def validate(self, data):
        """Validación a nivel de objeto"""
        if not data.get('first_name') or not data.get('last_name'):
            raise serializers.ValidationError(
                _('El nombre y apellido son obligatorios.')
            )
        
        # Normalizar datos
        if data.get('first_name'):
            data['first_name'] = data['first_name'].strip().title()
        if data.get('last_name'):
            data['last_name'] = data['last_name'].strip().title()
        
        return data

    def get_full_name(self, obj):
        """Obtener nombre completo del paciente"""
        return str(obj.get_full_name())  # Patient.get_full_name() es un método

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and not validated_data.get('created_by'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class XRayImageSerializer(serializers.ModelSerializer):
    """Serializer para XRayImage con validaciones de seguridad"""
    patient_name = serializers.SerializerMethodField()
    patient_dni = serializers.CharField(source='patient.dni', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(read_only=True)
    image_url = serializers.SerializerMethodField()
    has_diagnosis = serializers.SerializerMethodField()
    medical_order_id = serializers.PrimaryKeyRelatedField(
        source='medical_order',
        queryset=MedicalOrder.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = XRayImage
        fields = [
            'id', 'medical_order', 'medical_order_id', 'patient', 'patient_name', 'patient_dni',
            'image', 'image_url', 'description', 'quality', 'view_position',
            'is_analyzed', 'has_diagnosis',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at', 'updated_at', 'is_analyzed']

    def validate_image(self, value):
        """Validar imagen"""
        from .validators import SecureFileValidator
        validator = SecureFileValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'dcm'])
        validator(value)
        return value

    def validate_description(self, value):
        """Validar descripción"""
        if value:
            validate_no_sql_injection(value)
            if len(value) > 1000:
                raise serializers.ValidationError(
                    _('La descripción no debe exceder 1000 caracteres.')
                )
        return value

    def validate_quality(self, value):
        """Validar calidad"""
        allowed_quality = ['excellent', 'good', 'fair', 'poor']
        if value not in allowed_quality:
            raise serializers.ValidationError(
                _('Calidad inválida. Se aceptan: %(allowed)s'),
                code='invalid_quality',
            )
        return value

    def validate(self, data):
        """Validación a nivel de objeto"""
        if not data.get('patient'):
            raise serializers.ValidationError(
                _('El paciente es obligatorio.')
            )
        return data

    def get_patient_name(self, obj):
        """Obtener nombre completo del paciente"""
        return str(obj.patient.get_full_name()) if obj.patient else None  # Patient.get_full_name() es método

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_uploaded_by_name(self, obj):
        return str(obj.uploaded_by.get_full_name) if obj.uploaded_by else None
    
    def get_has_diagnosis(self, obj):
        """Verificar si la radiografía tiene un diagnóstico asociado"""
        return hasattr(obj, 'diagnosis')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and not validated_data.get('uploaded_by'):
            validated_data['uploaded_by'] = request.user
        return super().create(validated_data)


class DiagnosisResultSerializer(serializers.ModelSerializer):
    """Serializer para DiagnosisResult con validaciones de seguridad"""
    xray_id = serializers.PrimaryKeyRelatedField(source='xray', queryset=XRayImage.objects.all(), write_only=True)
    xray_details = serializers.SerializerMethodField(read_only=True)
    radiologist_review_name = serializers.SerializerMethodField()
    treating_physician_approval_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    confidence_percentage = serializers.SerializerMethodField()
    is_pneumonia = serializers.SerializerMethodField()
    requires_attention = serializers.SerializerMethodField()
    is_fully_reviewed = serializers.SerializerMethodField()

    medical_order = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DiagnosisResult
        fields = [
            'id', 'xray', 'xray_id', 'xray_details',
            'predicted_class', 'class_id', 'confidence', 'confidence_percentage',
            'raw_response', 'processing_time', 'status', 'error_message',
            'severity', 'radiologist_notes', 'radiologist_reviewed_at',
            'radiologist_review', 'radiologist_review_name',
            'treating_physician_approval', 'treating_physician_approval_name',
            'treating_physician_notes', 'approved_at',
            'is_reviewed', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'created_at', 'updated_at',
            'is_pneumonia', 'requires_attention', 'is_fully_reviewed',
            'medical_order',
        ]
        read_only_fields = ['id', 'xray', 'created_at', 'updated_at']

    def get_medical_order(self, obj):
        """Obtener información de la orden médica asociada a la radiografía"""
        if obj.xray and obj.xray.medical_order:
            order = obj.xray.medical_order
            return {
                'id': str(order.id),
                'reason': order.reason,
                'priority': order.priority,
                'status': order.status,
                'created_at': order.created_at,
                'requested_by': str(order.requested_by.get_full_name) if order.requested_by else None,
            }
        return None
    def validate_confidence(self, value):
        """Validar score de confianza"""
        validate_confidence_score(value)
        return value

    def validate_predicted_class(self, value):
        """Validar clase de diagnóstico"""
        validate_diagnosis_class(value)
        return value

    def validate_severity(self, value):
        """Validar severidad"""
        if value:
            validate_severity_level(value)
        return value

    def validate_medical_notes(self, value):
        """Validar notas médicas"""
        if value:
            validate_medical_notes(value)
        return value

    def validate(self, data):
        """Validación a nivel de objeto"""
        if not data.get('xray'):
            raise serializers.ValidationError(
                _('La radiografía es obligatoria.')
            )
        
        if not data.get('predicted_class'):
            raise serializers.ValidationError(
                _('La clase predicha es obligatoria.')
            )
        
        return data

    def get_xray_details(self, obj):
        """Obtener detalles de la radiografía asociada"""
        if obj.xray:
            request = self.context.get('request')
            return {
                'id': str(obj.xray.id),
                'patient_name': str(obj.xray.patient.get_full_name()),
                'patient_dni': obj.xray.patient.dni,
                'uploaded_at': obj.xray.uploaded_at.isoformat(),
                'image_url': request.build_absolute_uri(obj.xray.image.url) if obj.xray.image and request else obj.xray.image.url,
                'medical_order': f"Orden #{obj.xray.medical_order.id}" if obj.xray.medical_order else None,
                    'medical_order_reason': obj.xray.medical_order.reason if obj.xray.medical_order else None,
            }
        return None

    def get_radiologist_review_name(self, obj):
        """Nombre del radiólogo que revisó"""
        return str(obj.radiologist_review.get_full_name) if obj.radiologist_review else None

    def get_treating_physician_approval_name(self, obj):
        """Nombre del médico tratante que aprobó"""
        return str(obj.treating_physician_approval.get_full_name) if obj.treating_physician_approval else None

    def get_reviewed_by_name(self, obj):
        """Nombre del médico que revisó"""
        return str(obj.reviewed_by.get_full_name) if obj.reviewed_by else None

    def get_confidence_percentage(self, obj):
        """Confianza como porcentaje"""
        return float(obj.confidence * 100)

    def get_is_pneumonia(self, obj):
        """Verificar si es algún tipo de neumonía"""
        return obj.is_pneumonia

    def get_requires_attention(self, obj):
        """Verificar si requiere atención urgente"""
        return obj.requires_attention

    def get_is_fully_reviewed(self, obj):
        """Verificar si pasó todas las revisiones"""
        return obj.is_fully_reviewed


class MedicalReportSerializer(serializers.ModelSerializer):
    """Serializer para MedicalReport"""
    created_by = UserSerializer(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    
    # NUEVOS CAMPOS: Información derivada para facilitar acceso
    patient = serializers.SerializerMethodField(read_only=True)
    patient_id = serializers.SerializerMethodField(read_only=True)
    medical_order = serializers.SerializerMethodField(read_only=True)
    medical_order_id = serializers.SerializerMethodField(read_only=True)
    xray_id = serializers.SerializerMethodField(read_only=True)
    diagnosis_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MedicalReport
        fields = [
            'id', 'diagnosis', 
            # Campos derivados (read-only)
            'patient', 'patient_id',
            'medical_order', 'medical_order_id',
            'xray_id', 'diagnosis_info',
            # Campos del reporte
            'title', 'findings', 'impression', 'recommendations',
            'status',
            'created_by', 'created_by_name',
            'received_by', 'received_by_name', 'received_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'patient', 'patient_id', 'medical_order', 'medical_order_id', 
            'xray_id', 'diagnosis_info'
        ]

    def get_patient(self, obj):
        """Obtener información del paciente desde diagnosis -> xray -> medical_order"""
        if obj.diagnosis and obj.diagnosis.xray and obj.diagnosis.xray.medical_order:
            patient = obj.diagnosis.xray.medical_order.patient
            return {
                'id': str(patient.id),
                'dni': patient.dni,
                'full_name': patient.get_full_name(),
                'date_of_birth': patient.date_of_birth,
                'gender': patient.get_gender_display(),
                'age': patient.age
            }
        return None
    
    def get_patient_id(self, obj):
        """ID del paciente para filtros"""
        try:
            return str(obj.diagnosis.xray.medical_order.patient.id)
        except AttributeError:
            return None
    
    def get_medical_order(self, obj):
        """Obtener información de la orden médica"""
        try:
            order = obj.diagnosis.xray.medical_order
            return {
                'id': str(order.id),
                'order_type': order.get_order_type_display(),
                'reason': order.reason,
                'priority': order.get_priority_display(),
                'status': order.get_status_display(),
                'requested_by': str(order.requested_by.get_full_name) if order.requested_by else None,
                'created_at': order.created_at
            }
        except AttributeError:
            return None
    
    def get_medical_order_id(self, obj):
        """ID de la orden médica para filtros"""
        try:
            return str(obj.diagnosis.xray.medical_order.id)
        except AttributeError:
            return None
    
    def get_xray_id(self, obj):
        """ID de la radiografía"""
        try:
            return str(obj.diagnosis.xray.id)
        except AttributeError:
            return None
    
    def get_diagnosis_info(self, obj):
        """Información del diagnóstico"""
        if obj.diagnosis:
            return {
                'id': str(obj.diagnosis.id),
                'predicted_class': obj.diagnosis.get_predicted_class_display(),
                'confidence': float(obj.diagnosis.confidence),
                'confidence_percentage': obj.diagnosis.confidence_percentage,
                'is_pneumonia': obj.diagnosis.is_pneumonia,
                'requires_attention': obj.diagnosis.requires_attention,
                'is_reviewed': obj.diagnosis.is_reviewed,
                'created_at': obj.diagnosis.created_at
            }
        return None

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name if obj.created_by else None

    # Eliminado método de nombre de radiólogo
    def get_received_by_name(self, obj):
        return obj.received_by.get_full_name if obj.received_by else None

    def get_received_by_name(self, obj):
        return obj.received_by.get_full_name if obj.received_by else None

    def validate_diagnosis(self, value):
        """Validar que el diagnóstico tenga todo el flujo completo"""
        if not value:
            raise serializers.ValidationError("Debe proporcionar un diagnóstico válido.")
        
        # Verificar que el diagnóstico tenga radiografía
        if not hasattr(value, 'xray') or not value.xray:
            raise serializers.ValidationError(
                "El diagnóstico debe estar asociado a una radiografía."
            )
        
        # Verificar que la radiografía tenga orden médica
        if not hasattr(value.xray, 'medical_order') or not value.xray.medical_order:
            raise serializers.ValidationError(
                "La radiografía debe estar asociada a una orden médica."
            )
        
        # Verificar que el diagnóstico esté completado
        if value.status != 'completed':
            raise serializers.ValidationError(
                "Solo se pueden crear reportes para diagnósticos completados."
            )
        
        # Verificar que la orden no esté cancelada
        if value.xray.medical_order.status == 'cancelled':
            raise serializers.ValidationError(
                "No se puede crear un reporte para una orden médica cancelada."
            )
        
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and not validated_data.get('created_by'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class DiagnosticStatisticsSerializer(serializers.ModelSerializer):
    """Serializer para estadísticas de diagnóstico"""
    user_name = serializers.SerializerMethodField()
    pneumonia_detection_rate = serializers.SerializerMethodField()
    cases_requiring_attention = serializers.SerializerMethodField()
    
    class Meta:
        model = DiagnosticStatistics
        fields = [
            'id', 'user', 'user_name',
            'period_start', 'period_end',
            'total_cases_analyzed', 'total_xrays_reviewed', 'total_reports_generated',
            'normal_cases', 'pneumonia_bacterial_cases', 'pneumonia_viral_cases',
            'average_confidence', 'high_confidence_cases', 'low_confidence_cases',
            'mild_cases', 'moderate_cases', 'severe_cases',
            'average_processing_time', 'average_review_time',
            'peer_agreement_rate', 'revision_rate',
            'pneumonia_detection_rate', 'cases_requiring_attention',
            'calculated_at', 'updated_at'
        ]
        read_only_fields = ['id', 'calculated_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Obtener nombre del usuario"""
        return str(obj.user.get_full_name) if obj.user else None
    
    def get_pneumonia_detection_rate(self, obj):
        return obj.pneumonia_detection_rate
    
    def get_cases_requiring_attention(self, obj):
        return obj.cases_requiring_attention


class UserPerformanceMetricsSerializer(serializers.ModelSerializer):
    """Serializer para métricas de rendimiento de usuario"""
    user_name = serializers.SerializerMethodField()
    experience_level = serializers.SerializerMethodField()
    overall_performance_score = serializers.SerializerMethodField()
    
    class Meta:
        model = UserPerformanceMetrics
        fields = [
            'id', 'user', 'user_name',
            'total_diagnoses_lifetime', 'total_reports_lifetime', 'total_reviews_lifetime',
            'lifetime_average_confidence', 'lifetime_average_processing_time',
            'accuracy_score', 'quality_score',
            'specialty_focus',
            'first_diagnosis_date', 'last_activity_date',
            'experience_level', 'overall_performance_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Obtener nombre del usuario"""
        return str(obj.user.get_full_name) if obj.user else None
    
    def get_experience_level(self, obj):
        return obj.experience_level
    
    def get_overall_performance_score(self, obj):
        return obj.overall_performance_score


class SystemStatisticsSerializer(serializers.ModelSerializer):
    """Serializer para estadísticas del sistema"""
    
    class Meta:
        model = SystemStatistics
        fields = [
            'id', 'date',
            'daily_patients_registered', 'daily_xrays_uploaded', 
            'daily_diagnoses_made', 'daily_reports_generated',
            'total_patients', 'total_xrays', 'total_diagnoses', 'total_reports',
            'normal_percentage', 'pneumonia_percentage',
            'average_system_response_time', 'api_success_rate',
            'active_users_today',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MedicalOrderSerializer(serializers.ModelSerializer):
    """Serializer para órdenes médicas - Incluye información del paciente y solicitante"""
    # Información del paciente - sin nested serializer para evitar conflictos
    patient_name = serializers.SerializerMethodField()
    patient_dni = serializers.CharField(source='patient.dni', read_only=True)
    
    # Información del médico solicitante - acceso directo al objeto
    requested_by_name = serializers.SerializerMethodField(read_only=True)
    
    # Información adicional
    has_xray = serializers.SerializerMethodField()

    class Meta:
        model = MedicalOrder
        fields = [
            'id',
            # Paciente
            'patient',
            'patient_name',
            'patient_dni',
            # Médico solicitante
            'requested_by_name',
            # Orden
            'order_type',
            'reason',
            'clinical_notes',
            'priority',
            'status',
            # Fechas
            'created_at',
            'updated_at',
            'scheduled_date',
            'completed_date',
            # Adicional
            'has_xray',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'has_xray', 'patient_name', 'patient_dni', 'requested_by_name']

    def get_patient_name(self, obj):
        """Obtener nombre completo del paciente"""
        if obj.patient:
            return str(obj.patient.get_full_name())  # Patient.get_full_name() es método
        return None

    def get_requested_by_name(self, obj):
        """Obtener nombre del médico solicitante"""
        try:
            if obj.requested_by:
                # get_full_name es una propiedad, retorna un string
                return str(obj.requested_by.get_full_name)
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in get_requested_by_name: {str(e)}")
            return None

    def get_has_xray(self, obj):
        """Verificar si la orden médica tiene una radiografía asociada"""
        try:
            return XRayImage.objects.filter(medical_order=obj).exists()
        except Exception:
            return False

    def validate_reason(self, value):
        """Validar que la razón no esté vacía"""
        if not value or not value.strip():
            raise serializers.ValidationError(_('La razón de la solicitud es obligatoria.'))
        return value

    def validate_priority(self, value):
        """Validar que la prioridad sea válida"""
        valid_priorities = ['low', 'normal', 'urgent']
        if value not in valid_priorities:
            raise serializers.ValidationError(
                _('La prioridad debe ser una de: %(values)s') % {'values': ', '.join(valid_priorities)}
            )
        return value

    def validate_status(self, value):
        """Validar que el estado sea válido"""
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                _('El estado debe ser uno de: %(values)s') % {'values': ', '.join(valid_statuses)}
            )
        return value

    def update(self, instance, validated_data):
        """Actualizar orden y establecer completed_date si se marca como completada"""
        if 'status' in validated_data and validated_data['status'] == 'completed':
            from django.utils import timezone
            if not instance.completed_date:
                validated_data['completed_date'] = timezone.now()
        return super().update(instance, validated_data)



