"""
Vista para análisis de radiografías con IA (Roboflow) y estadísticas
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q, Avg, Sum, F
from django.contrib.auth.models import Group
from datetime import datetime, timedelta
from decimal import Decimal
import time

from .models import (
    XRayImage, DiagnosisResult, Patient, MedicalReport, MedicalOrder,
    DiagnosticStatistics, UserPerformanceMetrics, SystemStatistics
)
from apps.security.models import User
from .serializers import (
    DiagnosisResultSerializer, DiagnosticStatisticsSerializer,
    UserPerformanceMetricsSerializer, SystemStatisticsSerializer
)
from .roboflow_service import roboflow_service
import logging

logger = logging.getLogger(__name__)


def determine_stats_scope(user):
    """
    Determina el alcance de las estadísticas según rol/grupo del usuario.
    
    Returns:
        dict: {
            'scope': 'all' | 'group' | 'personal',
            'user_ids': set de IDs de usuarios incluidos
        }
    
    Reglas:
        - superuser o staff => 'all' (todas las estadísticas)
        - pertenece a grupos con otros usuarios => 'group' (estadísticas del grupo)
        - sin grupos o solo él en grupos => 'personal' (solo sus estadísticas)
    """
    if user.is_superuser or getattr(user, 'is_staff', False):
        return {'scope': 'all', 'user_ids': set()}

    groups = user.groups.all()
    if not groups.exists():
        return {'scope': 'personal', 'user_ids': {user.id}}

    # Reunir todos los usuarios de los grupos del usuario
    group_user_ids = set()
    for group in groups:
        group_user_ids.update(group.user_set.values_list('id', flat=True))

    # Si solo está el propio usuario, tratar como personal
    if group_user_ids == {user.id}:
        return {'scope': 'personal', 'user_ids': {user.id}}

    return {'scope': 'group', 'user_ids': group_user_ids}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_xray_view(request):
    """
    Analizar una radiografía usando el servicio de Roboflow
    
    Requiere:
        - xray_id: UUID de la radiografía a analizar
        
    Retorna:
        - DiagnosisResult creado con los resultados del análisis
    """
    xray_id = request.data.get('xray_id')
    
    if not xray_id:
        return Response(
            {'error': 'xray_id es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Obtener la radiografía
    xray = get_object_or_404(XRayImage, id=xray_id)
    
    # Verificar si ya tiene un diagnóstico
    if hasattr(xray, 'diagnosis'):
        return Response(
            {
                'error': 'Esta radiografía ya tiene un diagnóstico asociado',
                'diagnosis_id': str(xray.diagnosis.id)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    diagnosis = None
    
    try:
        # Crear diagnóstico en estado "analyzing"
        diagnosis = DiagnosisResult.objects.create(
            xray=xray,
            predicted_class='NORMAL',
            class_id=0,
            confidence=0.0,
            status='analyzing'
        )
        
        logger.info(f"Starting analysis for X-ray {xray_id} by user {request.user.username}")
        
        # Analizar con Roboflow
        roboflow_response = roboflow_service.analyze_image(xray.image.path)
        
        if not roboflow_response:
            raise ValueError("No se recibió respuesta del servicio de análisis")
        
        # Parsear la predicción
        parsed_result = roboflow_service.parse_prediction(roboflow_response)
        
        if not parsed_result:
            raise ValueError("No se pudo interpretar la respuesta del análisis")
        
        # Validar la clase predicha
        predicted_class = parsed_result['predicted_class']
        if not roboflow_service.validate_prediction_class(predicted_class):
            logger.warning(f"Unexpected predicted class: {predicted_class}")
        
        # Obtener interpretación del diagnóstico
        interpretation = roboflow_service.get_diagnosis_interpretation(
            predicted_class,
            parsed_result['confidence']
        )
        
        # Actualizar diagnóstico con resultados
        diagnosis.predicted_class = parsed_result['predicted_class']
        diagnosis.class_id = parsed_result.get('class_id', 0)
        diagnosis.confidence = parsed_result['confidence']
        diagnosis.raw_response = parsed_result.get('raw_response', {})
        diagnosis.processing_time = parsed_result.get('processing_time', 0)
        diagnosis.severity = interpretation.get('severity')
        diagnosis.status = 'completed'
        
        # Agregar notas médicas automáticas
        auto_notes = (
            f"{interpretation['description']}\n\n"
            f"Nivel de confianza: {interpretation['confidence_level']} ({diagnosis.confidence * 100:.1f}%)\n\n"
            f"Recomendación: {interpretation['recommendation']}"
        )
        diagnosis.radiologist_notes = auto_notes
        
        diagnosis.save()
        
        # Marcar radiografía como analizada
        xray.is_analyzed = True
        xray.save()
        
        logger.info(f"Analysis completed successfully for X-ray {xray_id}. Result: {predicted_class}")
        
        # Serializar y retornar
        serializer = DiagnosisResultSerializer(diagnosis, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        logger.error(f"Validation error analyzing X-ray {xray_id}: {str(e)}")
        if diagnosis:
            diagnosis.status = 'error'
            diagnosis.error_message = f"Error de validación: {str(e)}"
            diagnosis.save()
        
        return Response(
            {
                'error': 'Error al validar el análisis de la radiografía',
                'detail': str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
        
    except Exception as e:
        logger.error(f"Unexpected error analyzing X-ray {xray_id}: {str(e)}")
        if diagnosis:
            diagnosis.status = 'error'
            diagnosis.error_message = str(e)
            diagnosis.save()
        
        return Response(
            {
                'error': 'Error al analizar la radiografía',
                'detail': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def diagnosis_statistics_view(request):
    """
    Obtener estadísticas generales de diagnósticos
    
    Retorna:
        - total: Total de diagnósticos
        - by_class: Diagnósticos por clase predicha
        - by_status: Diagnósticos por estado
        - reviewed: Diagnósticos revisados vs no revisados
        - pneumonia_cases: Casos de neumonía detectados
        - high_confidence: Diagnósticos con alta confianza (>= 70%)
    """
    scope_info = determine_stats_scope(request.user)

    if scope_info['scope'] == 'all':
        base_qs = DiagnosisResult.objects.all()
    else:
        user_ids = scope_info['user_ids']
        # Filtrar diagnósticos donde usuarios del grupo participaron
        base_qs = DiagnosisResult.objects.filter(
            Q(radiologist_review__id__in=user_ids) |
            Q(reviewed_by__id__in=user_ids) |
            Q(treating_physician_approval__id__in=user_ids) |
            Q(xray__uploaded_by__id__in=user_ids)
        ).distinct()

    # Estadísticas por clase predicha
    by_class = base_qs.values('predicted_class').annotate(
        count=Count('id')
    ).order_by('-count')

    # Estadísticas por estado
    by_status = base_qs.values('status').annotate(
        count=Count('id')
    ).order_by('-count')

    # Revisados vs no revisados
    reviewed_stats = base_qs.aggregate(
        reviewed=Count('id', filter=Q(is_reviewed=True)),
        pending=Count('id', filter=Q(is_reviewed=False))
    )

    # Casos de neumonía
    pneumonia_cases = base_qs.filter(
        predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    ).count()

    # Alta confianza
    high_confidence = base_qs.filter(confidence__gte=0.7).count()

    # Total
    total = base_qs.count()
    
    return Response({
        'scope': scope_info['scope'],
        'total': total,
        'by_class': list(by_class),
        'by_status': list(by_status),
        'reviewed': reviewed_stats,
        'pneumonia_cases': pneumonia_cases,
        'high_confidence_count': high_confidence,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_statistics_view(request):
    """
    Obtener estadísticas de pacientes
    
    Retorna:
        - total_patients: Total de pacientes registrados
        - active_patients: Pacientes activos
        - inactive_patients: Pacientes inactivos
        - by_gender: Distribución por género
        - age_distribution: Distribución por rangos de edad
        - patients_with_xrays: Pacientes con radiografías
        - patients_with_diagnoses: Pacientes con diagnósticos
        - avg_xrays_per_patient: Promedio de radiografías por paciente
    """
    scope_info = determine_stats_scope(request.user)

    if scope_info['scope'] == 'all':
        patient_qs = Patient.objects.all()
    else:
        user_ids = scope_info['user_ids']
        # Pacientes relacionados con actividades del grupo
        patient_qs = Patient.objects.filter(
            Q(xrays__uploaded_by__id__in=user_ids) |
            Q(xrays__diagnosis__radiologist_review__id__in=user_ids) |
            Q(xrays__diagnosis__reviewed_by__id__in=user_ids) |
            Q(xrays__diagnosis__treating_physician_approval__id__in=user_ids) |
            Q(medical_orders__requested_by__id__in=user_ids) |
            Q(created_by__id__in=user_ids)
        ).distinct()

    # Contadores básicos
    total_patients = patient_qs.count()
    active_patients = patient_qs.filter(is_active=True).count()
    inactive_patients = patient_qs.filter(is_active=False).count()
    
    # Distribución por género
    by_gender = patient_qs.values('gender').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Distribución por edad
    from datetime import date
    today = date.today()
    
    age_ranges = {
        '0-18': patient_qs.filter(date_of_birth__gte=today.replace(year=today.year-18)).count(),
        '19-35': patient_qs.filter(
            date_of_birth__gte=today.replace(year=today.year-35),
            date_of_birth__lt=today.replace(year=today.year-18)
        ).count(),
        '36-50': patient_qs.filter(
            date_of_birth__gte=today.replace(year=today.year-50),
            date_of_birth__lt=today.replace(year=today.year-35)
        ).count(),
        '51-65': patient_qs.filter(
            date_of_birth__gte=today.replace(year=today.year-65),
            date_of_birth__lt=today.replace(year=today.year-50)
        ).count(),
        '65+': patient_qs.filter(date_of_birth__lt=today.replace(year=today.year-65)).count(),
    }
    
    # Pacientes con radiografías
    patients_with_xrays = patient_qs.filter(xrays__isnull=False).distinct().count()

    # Pacientes con diagnósticos
    patients_with_diagnoses = patient_qs.filter(
        xrays__diagnosis__isnull=False
    ).distinct().count()

    # Promedio de radiografías por paciente
    xray_stats = patient_qs.annotate(
        xray_count=Count('xrays')
    ).aggregate(
        avg_xrays=Avg('xray_count'),
        total_xrays=Sum('xray_count')
    )
    
    return Response({
        'scope': scope_info['scope'],
        'total_patients': total_patients,
        'active_patients': active_patients,
        'inactive_patients': inactive_patients,
        'by_gender': list(by_gender),
        'age_distribution': age_ranges,
        'patients_with_xrays': patients_with_xrays,
        'patients_with_diagnoses': patients_with_diagnoses,
        'avg_xrays_per_patient': round(xray_stats['avg_xrays'] or 0, 2),
        'total_xrays': xray_stats['total_xrays'] or 0,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def xray_statistics_view(request):
    """
    Obtener estadísticas de radiografías
    
    Retorna:
        - total_xrays: Total de radiografías subidas
        - analyzed: Radiografías analizadas
        - pending: Radiografías pendientes de análisis
        - by_quality: Distribución por calidad de imagen
        - by_view_position: Distribución por posición de la vista
        - uploads_by_month: Subidas por mes (últimos 12 meses)
        - recent_uploads: Subidas recientes (última semana)
    """
    scope_info = determine_stats_scope(request.user)

    if scope_info['scope'] == 'all':
        xray_qs = XRayImage.objects.all()
    else:
        user_ids = scope_info['user_ids']
        xray_qs = XRayImage.objects.filter(
            Q(uploaded_by__id__in=user_ids) |
            Q(diagnosis__radiologist_review__id__in=user_ids) |
            Q(diagnosis__reviewed_by__id__in=user_ids) |
            Q(diagnosis__treating_physician_approval__id__in=user_ids)
        ).distinct()

    # Contadores básicos
    total_xrays = xray_qs.count()
    analyzed = xray_qs.filter(is_analyzed=True).count()
    pending = xray_qs.filter(is_analyzed=False).count()
    
    # Por calidad
    by_quality = xray_qs.values('quality').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Por posición de vista
    by_view_position = xray_qs.values('view_position').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Subidas por mes (últimos 12 meses)
    from django.db.models.functions import TruncMonth
    twelve_months_ago = timezone.now() - timedelta(days=365)
    
    uploads_by_month = xray_qs.filter(
        uploaded_at__gte=twelve_months_ago
    ).annotate(
        month=TruncMonth('uploaded_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Subidas recientes (última semana)
    one_week_ago = timezone.now() - timedelta(days=7)
    recent_uploads = xray_qs.filter(uploaded_at__gte=one_week_ago).count()
    
    # Subidas por usuario (top 5)
    top_uploaders = xray_qs.values(
        'uploaded_by__username',
        'uploaded_by__first_name',
        'uploaded_by__last_name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    return Response({
        'scope': scope_info['scope'],
        'total_xrays': total_xrays,
        'analyzed': analyzed,
        'pending': pending,
        'analysis_rate': round((analyzed / total_xrays * 100) if total_xrays > 0 else 0, 2),
        'by_quality': list(by_quality),
        'by_view_position': list(by_view_position),
        'uploads_by_month': list(uploads_by_month),
        'recent_uploads': recent_uploads,
        'top_uploaders': list(top_uploaders),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_performance_view(request):
    """
    Obtener métricas de rendimiento del usuario actual
    
    Retorna las métricas de rendimiento del usuario autenticado
    """
    user = request.user
    
    # Obtener o crear métricas de rendimiento
    metrics, created = UserPerformanceMetrics.objects.get_or_create(
        user=user,
        defaults={
            'total_diagnoses_lifetime': 0,
            'total_reports_lifetime': 0,
            'total_reviews_lifetime': 0,
            'lifetime_average_confidence': Decimal('0.00'),
            'lifetime_average_processing_time': 0.0,
            'accuracy_score': Decimal('0.00'),
            'quality_score': Decimal('0.00'),
        }
    )
    
    # Si es recién creado, calcular métricas iniciales
    if created or not metrics.last_activity_date:
        update_user_performance_metrics(user)
        metrics.refresh_from_db()
    
    serializer = UserPerformanceMetricsSerializer(metrics)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_statistics_view(request):
    """
    Obtener estadísticas generales del sistema
    
    Retorna las estadísticas del sistema para hoy o la fecha especificada
    """
    # Obtener fecha (hoy por defecto)
    date_str = request.query_params.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        target_date = timezone.now().date()
    
    # Obtener o crear estadísticas del sistema para la fecha
    stats, created = SystemStatistics.objects.get_or_create(
        date=target_date,
        defaults={
            'daily_patients_registered': 0,
            'daily_xrays_uploaded': 0,
            'daily_diagnoses_made': 0,
            'daily_reports_generated': 0,
            'total_patients': 0,
            'total_xrays': 0,
            'total_diagnoses': 0,
            'total_reports': 0,
        }
    )
    
    # Si es hoy, actualizar las estadísticas
    if target_date == timezone.now().date():
        update_system_statistics(target_date)
        stats.refresh_from_db()
    
    serializer = SystemStatisticsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview_view(request):
    """
    Vista general para el dashboard con estadísticas combinadas
    Retorna métricas específicas según el grupo del usuario
    
    Retorna un resumen completo de todas las estadísticas principales
    """
    # Determinar alcance según rol/grupo
    scope_info = determine_stats_scope(request.user)
    
    # Obtener información del grupo principal del usuario
    user_groups = request.user.groups.all()
    primary_group = user_groups.first() if user_groups.exists() else None
    group_name = primary_group.name if primary_group else None

    # Construir querysets base según scope
    if scope_info['scope'] == 'all':
        dr_qs = DiagnosisResult.objects.all()
        patient_qs = Patient.objects.filter(is_active=True)
        xray_qs = XRayImage.objects.all()
        report_qs = MedicalReport.objects.all()
    else:
        user_ids = scope_info['user_ids']
        
        # QuerySet de diagnósticos - todos los roles que pueden participar
        dr_qs = DiagnosisResult.objects.filter(
            Q(radiologist_review__id__in=user_ids) |
            Q(reviewed_by__id__in=user_ids) |
            Q(treating_physician_approval__id__in=user_ids) |
            Q(xray__uploaded_by__id__in=user_ids)
        ).distinct()
        
        # QuerySet de pacientes - múltiples puntos de interacción
        patient_qs = Patient.objects.filter(
            Q(xrays__uploaded_by__id__in=user_ids) |
            Q(xrays__diagnosis__radiologist_review__id__in=user_ids) |
            Q(xrays__diagnosis__reviewed_by__id__in=user_ids) |
            Q(xrays__diagnosis__treating_physician_approval__id__in=user_ids) |
            Q(medical_orders__requested_by__id__in=user_ids) |
            Q(created_by__id__in=user_ids)
        ).distinct()
        
        # QuerySet de radiografías
        xray_qs = XRayImage.objects.filter(
            Q(uploaded_by__id__in=user_ids) |
            Q(diagnosis__radiologist_review__id__in=user_ids) |
            Q(diagnosis__reviewed_by__id__in=user_ids) |
            Q(diagnosis__treating_physician_approval__id__in=user_ids)
        ).distinct()
        
        # QuerySet de reportes
        report_qs = MedicalReport.objects.filter(
            Q(created_by__id__in=user_ids) |
            Q(received_by__id__in=user_ids)
        ).distinct()

    # ==================== ESTADÍSTICAS GENERALES ====================
    total_diagnoses = dr_qs.count()
    pending_reviews = dr_qs.filter(is_reviewed=False).count()
    pneumonia_cases = dr_qs.filter(
        predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    ).count()

    total_patients = patient_qs.count()
    total_xrays = xray_qs.count()
    pending_analysis = xray_qs.filter(is_analyzed=False).count()
    total_reports = report_qs.count()
    draft_reports = report_qs.filter(status='draft').count()
    
    # ==================== ACTIVIDAD RECIENTE ====================
    one_week_ago = timezone.now() - timedelta(days=7)
    recent_activity = {
        'new_patients': patient_qs.filter(created_at__gte=one_week_ago).count(),
        'new_xrays': xray_qs.filter(uploaded_at__gte=one_week_ago).count(),
        'new_diagnoses': dr_qs.filter(created_at__gte=one_week_ago).count(),
        'new_reports': report_qs.filter(created_at__gte=one_week_ago).count(),
    }
    
    # ==================== CASOS PRIORITARIOS ====================
    high_priority = dr_qs.filter(
        Q(predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']) &
        Q(confidence__gte=0.7) &
        Q(radiologist_review__isnull=True)
    ).count()
    
    # ==================== DISTRIBUCIÓN DE DIAGNÓSTICOS ====================
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_diagnoses = dr_qs.filter(
        created_at__gte=thirty_days_ago
    ).values('predicted_class').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # ==================== MÉTRICAS ESPECÍFICAS POR GRUPO ====================
    group_metrics = {}
    
    if request.user.is_superuser:
        # ============= MÉTRICAS PARA ADMINISTRADORES =============
        all_users = User.objects.all()
        active_users_count = all_users.filter(is_active=True).count()
        
        # Distribución por grupos
        users_by_group_dict = {}
        for group in Group.objects.all():
            users_by_group_dict[group.name] = group.user_set.count()
        
        # Usuarios sin grupo
        users_without_group_count = all_users.filter(groups__isnull=True).count()
        
        # Actividad de usuarios (últimos periodos)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)
        
        group_metrics = {
            'total_users': all_users.count(),
            'active_users': active_users_count,
            'inactive_users': all_users.filter(is_active=False).count(),
            'total_groups': Group.objects.count(),
            'users_by_group': users_by_group_dict,
            'users_without_group': users_without_group_count,
            'new_users_week': all_users.filter(date_joined__gte=week_ago).count(),
            
            # Actividad de login
            'logins_today': all_users.filter(
                last_login__gte=today_start,
                last_login__isnull=False
            ).count(),
            'logins_week': all_users.filter(
                last_login__gte=week_ago,
                last_login__isnull=False
            ).count(),
            'logins_month': all_users.filter(
                last_login__gte=month_ago,
                last_login__isnull=False
            ).count(),
            
            # Métricas del sistema
            'total_permissions': sum(group.permissions.count() for group in Group.objects.all()),
            'system_health': 'optimal',  # Puede expandirse con métricas reales
        }
        
    elif group_name:
        # ============= MÉTRICAS PARA RADIÓLOGOS =============
        if 'Radiólogo' in group_name or 'Radiología' in group_name:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Diagnósticos revisados por el radiólogo actual
            user_radiologist_reviews = dr_qs.filter(
                radiologist_review=request.user
            )
            
            group_metrics = {
                'total_analyses': dr_qs.count(),
                'my_reviews': user_radiologist_reviews.count(),
                'pending_analyses': xray_qs.filter(is_analyzed=False).count(),
                'pending_radiologist_review': dr_qs.filter(
                    radiologist_review__isnull=True,
                    status='completed'
                ).count(),
                
                # Métricas de calidad
                'avg_confidence': round(float(dr_qs.aggregate(
                    avg=Avg('confidence'))['avg'] or 0), 3),
                'high_quality_xrays': xray_qs.filter(
                    quality__in=['excellent', 'good']
                ).count(),
                'low_quality_xrays': xray_qs.filter(
                    quality__in=['fair', 'poor']
                ).count(),
                
                # Productividad
                'analyses_today': dr_qs.filter(
                    created_at__gte=today_start
                ).count(),
                'my_reviews_today': user_radiologist_reviews.filter(
                    radiologist_reviewed_at__gte=today_start
                ).count(),
                'avg_processing_time': round(float(dr_qs.aggregate(
                    avg=Avg('processing_time'))['avg'] or 0), 2),
                
                # Distribución de severidad
                'severe_cases': dr_qs.filter(severity='severe').count(),
                'moderate_cases': dr_qs.filter(severity='moderate').count(),
                'mild_cases': dr_qs.filter(severity='mild').count(),
            }
            
        # ============= MÉTRICAS PARA MÉDICOS =============
        elif 'Médicos' in group_name:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Revisiones del médico actual
            user_reviews = dr_qs.filter(reviewed_by=request.user)
            user_approvals = dr_qs.filter(treating_physician_approval=request.user)
            
            group_metrics = {
                'total_patients_treated': patient_qs.count(),
                'my_reviews': user_reviews.count(),
                'my_approvals': user_approvals.count(),
                
                # Casos críticos
                'critical_cases': dr_qs.filter(
                    severity='severe',
                    is_reviewed=False
                ).count(),
                'reviews_completed': user_reviews.filter(is_reviewed=True).count(),
                'reviews_pending': dr_qs.filter(is_reviewed=False).count(),
                'approvals_pending': dr_qs.filter(
                    treating_physician_approval__isnull=True,
                    radiologist_review__isnull=False
                ).count(),
                
                # Casos de neumonía
                'pneumonia_cases_active': dr_qs.filter(
                    predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL'],
                    is_reviewed=False
                ).count(),
                'pneumonia_cases_my_review': user_reviews.filter(
                    predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
                ).count(),
                
                # Reportes
                'reports_generated': report_qs.filter(created_by=request.user).count(),
                'reports_pending': report_qs.filter(
                    status='draft',
                    created_by=request.user
                ).count(),
                'reports_today': report_qs.filter(
                    created_at__gte=today_start,
                    created_by=request.user
                ).count(),
                
                # Órdenes médicas
                'orders_requested': MedicalOrder.objects.filter(
                    requested_by=request.user
                ).count(),
                'orders_pending': MedicalOrder.objects.filter(
                    requested_by=request.user,
                    status='pending'
                ).count(),
            }
            
            print(group_metrics)
            
        # ============= MÉTRICAS PARA RECEPCIONISTAS/ADMINISTRATIVOS =============
        elif 'Recepcion' in group_name or 'Administrat' in group_name:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = timezone.now() - timedelta(days=7)
            
            group_metrics = {
                # Registro de pacientes
                'patients_registered_today': patient_qs.filter(
                    created_at__gte=today_start
                ).count(),
                'patients_registered_week': patient_qs.filter(
                    created_at__gte=week_ago
                ).count(),
                'patients_registered_by_me': patient_qs.filter(
                    created_by=request.user
                ).count(),
                
                # Estado de pacientes
                'patients_with_pending_xrays': patient_qs.filter(
                    xrays__is_analyzed=False
                ).distinct().count(),
                'patients_with_pending_orders': patient_qs.filter(
                    medical_orders__status='pending'
                ).distinct().count(),
                'active_patients': patient_qs.filter(is_active=True).count(),
                
                # Radiografías
                'xrays_uploaded_today': xray_qs.filter(
                    uploaded_at__gte=today_start
                ).count(),
                'xrays_uploaded_by_me': xray_qs.filter(
                    uploaded_by=request.user
                ).count(),
                'xrays_pending_analysis': xray_qs.filter(
                    is_analyzed=False
                ).count(),
                
                # Órdenes médicas
                'orders_today': MedicalOrder.objects.filter(
                    created_at__gte=today_start
                ).count(),
                'orders_pending': MedicalOrder.objects.filter(
                    status='pending'
                ).count(),
                'orders_in_progress': MedicalOrder.objects.filter(
                    status='in_progress'
                ).count(),
            }
            
        else:
            # ============= MÉTRICAS GENÉRICAS PARA OTROS GRUPOS =============
            group_metrics = {
                'total_diagnoses': dr_qs.count(),
                'total_patients': patient_qs.count(),
                'total_xrays': xray_qs.count(),
                'pending_tasks': pending_reviews + pending_analysis,
                'my_activity': {
                    'xrays_uploaded': xray_qs.filter(uploaded_by=request.user).count(),
                    'patients_created': patient_qs.filter(created_by=request.user).count(),
                    'reports_created': report_qs.filter(created_by=request.user).count(),
                }
            }
    
    # ==================== RESPUESTA FINAL ====================
    return Response({
        'scope': scope_info['scope'],
        'user_group': group_name,
        'user_role': 'admin' if request.user.is_superuser else 'staff' if request.user.is_staff else 'user',
        'user_info': {
            'username': request.user.username,
            'full_name': request.user.get_full_name,
            'email': request.user.email,
        },
        
        # Resumen general
        'summary': {
            'total_diagnoses': total_diagnoses,
            'total_patients': total_patients,
            'total_xrays': total_xrays,
            'total_reports': total_reports,
        },
        
        # Tareas pendientes
        'pending_tasks': {
            'pending_reviews': pending_reviews,
            'pending_analysis': pending_analysis,
            'draft_reports': draft_reports,
            'high_priority_cases': high_priority,
        },
        
        # Estadísticas de enfermedades
        'disease_stats': {
            'pneumonia_cases': pneumonia_cases,
            'normal_cases': total_diagnoses - pneumonia_cases,
            'pneumonia_rate': round((pneumonia_cases / total_diagnoses * 100) if total_diagnoses > 0 else 0, 2),
        },
        
        # Actividad reciente
        'recent_activity': recent_activity,
        
        # Distribución de diagnósticos recientes
        'recent_diagnoses_distribution': list(recent_diagnoses),
        
        # Métricas específicas del grupo
        'group_specific_metrics': group_metrics,
    })


def update_user_performance_metrics(user):
    """
    Actualiza las métricas de rendimiento de un usuario
    
    Args:
        user: Usuario del cual actualizar métricas
        
    Returns:
        UserPerformanceMetrics: Métricas actualizadas
    """
    # Diagnósticos donde el usuario participó como radiólogo
    user_radiologist_diagnoses = DiagnosisResult.objects.filter(
        radiologist_review=user
    )
    
    # Diagnósticos donde el usuario participó como revisor
    user_reviewed_diagnoses = DiagnosisResult.objects.filter(
        reviewed_by=user
    )
    
    # Aprobaciones como médico tratante
    user_approvals = DiagnosisResult.objects.filter(
        treating_physician_approval=user
    )
    
    # Reportes creados
    user_reports = MedicalReport.objects.filter(
        created_by=user
    )
    
    # Totales
    total_diagnoses = user_radiologist_diagnoses.count()
    total_reports = user_reports.count()
    total_reviews = user_reviewed_diagnoses.count() + user_approvals.count()
    
    # Calcular promedios - solo de diagnósticos completados
    completed_diagnoses = user_radiologist_diagnoses.filter(status='completed')
    
    avg_confidence = completed_diagnoses.aggregate(
        avg=Avg('confidence')
    )['avg'] or Decimal('0.00')
    
    avg_processing_time = completed_diagnoses.aggregate(
        avg=Avg('processing_time')
    )['avg'] or 0.0
    
    # Obtener fechas
    first_diagnosis = user_radiologist_diagnoses.order_by('created_at').first()
    
    # Última actividad (cualquier participación)
    last_activities = []
    if user_radiologist_diagnoses.exists():
        last_activities.append(
            user_radiologist_diagnoses.order_by('-radiologist_reviewed_at').first().radiologist_reviewed_at
        )
    if user_reviewed_diagnoses.exists():
        last_activities.append(
            user_reviewed_diagnoses.order_by('-reviewed_at').first().reviewed_at
        )
    if user_approvals.exists():
        last_activities.append(
            user_approvals.order_by('-approved_at').first().approved_at
        )
    
    last_activity = max([dt for dt in last_activities if dt], default=timezone.now())
    
    # Calcular puntuaciones de calidad
    # Accuracy score basado en confianza promedio y completitud
    if total_diagnoses > 0:
        accuracy_score = min(float(avg_confidence) * 100, 100.0)
    else:
        accuracy_score = 0.0
    
    # Quality score basado en reportes completos y revisiones
    if total_reports > 0:
        final_reports = user_reports.filter(status='final').count()
        quality_score = (final_reports / total_reports) * 100
    else:
        quality_score = 0.0
    
    # Determinar especialización (área con más diagnósticos)
    specialty_stats = user_radiologist_diagnoses.values('predicted_class').annotate(
        count=Count('id')
    ).order_by('-count').first()
    
    specialty_focus = None
    if specialty_stats and specialty_stats['count'] >= 10:  # Mínimo 10 casos
        class_mapping = {
            'NORMAL': 'Diagnósticos Normales',
            'PNEUMONIA_BACTERIA': 'Neumonía Bacteriana',
            'PNEUMONIA_BACTERIAL': 'Neumonía Bacterial',
            'PNEUMONIA_VIRAL': 'Neumonía Viral',
        }
        specialty_focus = class_mapping.get(
            specialty_stats['predicted_class'],
            specialty_stats['predicted_class']
        )
    
    # Actualizar o crear métricas
    metrics, created = UserPerformanceMetrics.objects.update_or_create(
        user=user,
        defaults={
            'total_diagnoses_lifetime': total_diagnoses,
            'total_reports_lifetime': total_reports,
            'total_reviews_lifetime': total_reviews,
            'lifetime_average_confidence': Decimal(str(round(float(avg_confidence), 2))),
            'lifetime_average_processing_time': avg_processing_time,
            'accuracy_score': Decimal(str(round(accuracy_score, 2))),
            'quality_score': Decimal(str(round(quality_score, 2))),
            'specialty_focus': specialty_focus,
            'first_diagnosis_date': first_diagnosis.created_at if first_diagnosis else None,
            'last_activity_date': last_activity,
        }
    )
    
    return metrics


def update_system_statistics(target_date):
    """
    Actualiza las estadísticas del sistema para una fecha específica
    
    Args:
        target_date: Fecha para la cual calcular estadísticas
    """
    # Rango de fechas para el día
    start_of_day = timezone.make_aware(
        datetime.combine(target_date, datetime.min.time())
    )
    end_of_day = timezone.make_aware(
        datetime.combine(target_date, datetime.max.time())
    )
    
    # ==================== CONTADORES DIARIOS ====================
    daily_patients = Patient.objects.filter(
        created_at__gte=start_of_day,
        created_at__lte=end_of_day
    ).count()
    
    daily_xrays = XRayImage.objects.filter(
        uploaded_at__gte=start_of_day,
        uploaded_at__lte=end_of_day
    ).count()
    
    daily_diagnoses = DiagnosisResult.objects.filter(
        created_at__gte=start_of_day,
        created_at__lte=end_of_day
    ).count()
    
    daily_reports = MedicalReport.objects.filter(
        created_at__gte=start_of_day,
        created_at__lte=end_of_day
    ).count()
    
    # ==================== TOTALES ACUMULADOS ====================
    total_patients = Patient.objects.count()
    total_xrays = XRayImage.objects.count()
    total_diagnoses = DiagnosisResult.objects.count()
    total_reports = MedicalReport.objects.count()
    
    # ==================== DISTRIBUCIÓN DE DIAGNÓSTICOS ====================
    normal_count = DiagnosisResult.objects.filter(
        predicted_class='NORMAL'
    ).count()
    
    pneumonia_count = DiagnosisResult.objects.filter(
        predicted_class__in=['PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    ).count()
    
    normal_percentage = (normal_count / total_diagnoses * 100) if total_diagnoses > 0 else Decimal('0.00')
    pneumonia_percentage = (pneumonia_count / total_diagnoses * 100) if total_diagnoses > 0 else Decimal('0.00')
    
    # ==================== MÉTRICAS DE RENDIMIENTO ====================
    # Tiempo promedio de respuesta del sistema
    avg_response_time = DiagnosisResult.objects.filter(
        processing_time__isnull=False,
        status='completed'
    ).aggregate(avg=Avg('processing_time'))['avg'] or 0.0
    
    # Tasa de éxito de la API (diagnósticos completados vs total)
    total_api_calls = DiagnosisResult.objects.filter(
        created_at__gte=start_of_day,
        created_at__lte=end_of_day
    ).count()
    
    successful_api_calls = DiagnosisResult.objects.filter(
        created_at__gte=start_of_day,
        created_at__lte=end_of_day,
        status='completed'
    ).count()
    
    api_success_rate = (successful_api_calls / total_api_calls * 100) if total_api_calls > 0 else Decimal('100.00')
    
    # ==================== USUARIOS ACTIVOS ====================
    # Usuarios que realizaron alguna acción hoy
    active_users = User.objects.filter(
        Q(xrays_uploaded__uploaded_at__gte=start_of_day, xrays_uploaded__uploaded_at__lte=end_of_day) |
        Q(diagnoses_radiologist_reviewed__radiologist_reviewed_at__gte=start_of_day, 
          diagnoses_radiologist_reviewed__radiologist_reviewed_at__lte=end_of_day) |
        Q(diagnoses_reviewed__reviewed_at__gte=start_of_day, diagnoses_reviewed__reviewed_at__lte=end_of_day) |
        Q(diagnoses_approved__approved_at__gte=start_of_day, diagnoses_approved__approved_at__lte=end_of_day) |
        Q(reports_created__created_at__gte=start_of_day, reports_created__created_at__lte=end_of_day) |
        Q(patients_created__created_at__gte=start_of_day, patients_created__created_at__lte=end_of_day)
    ).distinct().count()
    
    # ==================== ACTUALIZAR ESTADÍSTICAS ====================
    SystemStatistics.objects.update_or_create(
        date=target_date,
        defaults={
            'daily_patients_registered': daily_patients,
            'daily_xrays_uploaded': daily_xrays,
            'daily_diagnoses_made': daily_diagnoses,
            'daily_reports_generated': daily_reports,
            'total_patients': total_patients,
            'total_xrays': total_xrays,
            'total_diagnoses': total_diagnoses,
            'total_reports': total_reports,
            'normal_percentage': Decimal(str(round(normal_percentage, 2))),
            'pneumonia_percentage': Decimal(str(round(pneumonia_percentage, 2))),
            'average_system_response_time': avg_response_time,
            'api_success_rate': Decimal(str(round(api_success_rate, 2))),
            'active_users_today': active_users,
        }
    )