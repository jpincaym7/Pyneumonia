"""
Signals para auditoría automática de módulo de diagnóstico
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from datetime import datetime
import socket
from crum import get_current_request

from apps.diagnosis.models import Patient, XRayImage, DiagnosisResult, MedicalReport
from apps.security.models import AuditUser


def create_audit_record(user, table_name, record_id, action):
    """
    Crea un registro de auditoría
    
    Args:
        user: Usuario que realizó la acción
        table_name: Nombre de la tabla/modelo
        record_id: ID del registro afectado
        action: Acción realizada ('A', 'M', 'E')
    """
    try:
        now = datetime.now()
        hostname = socket.gethostname()
        
        AuditUser.objects.create(
            usuario=user,
            tabla=table_name,
            registroid=record_id,
            accion=action,
            fecha=now.date(),
            hora=now.time(),
            estacion=hostname
        )
    except Exception as e:
        print(f"Error al crear registro de auditoría: {e}")


# ==================== AUDITORÍA DE PACIENTES ====================

@receiver(post_save, sender=Patient)
def audit_patient_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de pacientes"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'Patient', instance.id, action)


@receiver(post_delete, sender=Patient)
def audit_patient_delete(sender, instance, **kwargs):
    """Auditar eliminación de pacientes"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'Patient', instance.id, 'E')


# ==================== AUDITORÍA DE RADIOGRAFÍAS ====================

@receiver(post_save, sender=XRayImage)
def audit_xray_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de radiografías"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'XRayImage', instance.id, action)


@receiver(post_delete, sender=XRayImage)
def audit_xray_delete(sender, instance, **kwargs):
    """Auditar eliminación de radiografías"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'XRayImage', instance.id, 'E')


# ==================== AUDITORÍA DE RESULTADOS DE DIAGNÓSTICO ====================

@receiver(post_save, sender=DiagnosisResult)
def audit_diagnosis_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de diagnósticos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'DiagnosisResult', instance.id, action)


@receiver(post_delete, sender=DiagnosisResult)
def audit_diagnosis_delete(sender, instance, **kwargs):
    """Auditar eliminación de diagnósticos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'DiagnosisResult', instance.id, 'E')


# ==================== AUDITORÍA DE REPORTES MÉDICOS ====================

@receiver(post_save, sender=MedicalReport)
def audit_medical_report_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de reportes médicos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'MedicalReport', instance.id, action)


@receiver(post_delete, sender=MedicalReport)
def audit_medical_report_delete(sender, instance, **kwargs):
    """Auditar eliminación de reportes médicos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'MedicalReport', instance.id, 'E')
