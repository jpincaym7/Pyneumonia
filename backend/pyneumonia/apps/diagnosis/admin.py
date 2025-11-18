from django.contrib import admin
from .models import (
    Patient, MedicalOrder, XRayImage, DiagnosisResult,
    MedicalReport, DiagnosticStatistics, UserPerformanceMetrics,
    SystemStatistics
)


# =======================================================
#   PATIENT ADMIN
# =======================================================
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('dni', 'get_full_name', 'gender', 'phone', 'email', 'is_active', 'created_at')
    search_fields = ('dni', 'first_name', 'last_name', 'email', 'phone')
    list_filter = ('gender', 'is_active', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Datos Personales', {
            'fields': ('dni', 'first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone', 'address')
        }),
        ('Información Médica', {
            'fields': ('blood_type', 'allergies', 'medical_history')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at', 'is_active')
        }),
    )


# =======================================================
#   MEDICAL ORDER ADMIN
# =======================================================
@admin.register(MedicalOrder)
class MedicalOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'requested_by', 'order_type', 'priority', 'status', 'created_at')
    search_fields = ('id', 'patient__dni', 'patient__first_name', 'patient__last_name')
    list_filter = ('status', 'priority', 'order_type', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


# =======================================================
#   XRAY IMAGE ADMIN
# =======================================================
@admin.register(XRayImage)
class XRayImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'quality', 'view_position', 'is_analyzed', 'uploaded_at')
    search_fields = ('patient__dni', 'patient__first_name', 'patient__last_name')
    list_filter = ('quality', 'view_position', 'is_analyzed', 'uploaded_at')
    readonly_fields = ('uploaded_at', 'updated_at')


# =======================================================
#   DIAGNOSIS RESULT ADMIN
# =======================================================
@admin.register(DiagnosisResult)
class DiagnosisResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'predicted_class', 'class_id', 'confidence', 'status', 'created_at')
    search_fields = ('id', 'predicted_class', 'xray__patient__dni')
    list_filter = ('predicted_class', 'status', 'radiologist_review', 'treating_physician_approval')
    readonly_fields = ('created_at', 'updated_at', 'processing_time')


# =======================================================
#   MEDICAL REPORT ADMIN
# =======================================================
@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'created_by')
    readonly_fields = ('created_at', 'updated_at')


# =======================================================
#   DIAGNOSTIC STATISTICS ADMIN
# =======================================================
@admin.register(DiagnosticStatistics)
class DiagnosticStatisticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'period_start', 'period_end', 'total_cases_analyzed', 'calculated_at')
    search_fields = ('user__first_name', 'user__last_name')
    list_filter = ('period_start', 'period_end')
    readonly_fields = ('calculated_at', 'updated_at')


# =======================================================
#   USER PERFORMANCE METRICS ADMIN
# =======================================================
@admin.register(UserPerformanceMetrics)
class UserPerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_diagnoses_lifetime', 'accuracy_score', 'quality_score', 'last_activity_date')
    search_fields = ('user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')


# =======================================================
#   SYSTEM STATISTICS ADMIN
# =======================================================
@admin.register(SystemStatistics)
class SystemStatisticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'daily_patients_registered', 'daily_xrays_uploaded', 'daily_diagnoses_made', 'api_success_rate')
    list_filter = ('date',)
    readonly_fields = ('created_at', 'updated_at')
