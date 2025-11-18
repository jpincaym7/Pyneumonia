"""
URLs del módulo de diagnóstico
Compatible con Next.js frontend
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    PatientViewSet, XRayImageViewSet, DiagnosisResultViewSet, MedicalReportViewSet, MedicalOrderViewSet
)
from .views import (
    analyze_xray_view, 
    diagnosis_statistics_view,
    patient_statistics_view,
    xray_statistics_view,
    user_performance_view,
    system_statistics_view,
    dashboard_overview_view
)

app_name = 'diagnosis'

# Router para ViewSets
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'xrays', XRayImageViewSet, basename='xrayimage')
router.register(r'results', DiagnosisResultViewSet, basename='diagnosisresult')
router.register(r'medical-reports', MedicalReportViewSet, basename='medicalreport')
router.register(r'medical-orders', MedicalOrderViewSet, basename='medicalorder')

urlpatterns = [
    # Vista para analizar radiografías con IA
    path('analyze/', analyze_xray_view, name='analyze-xray'),
    
    # Vistas de estadísticas
    path('statistics/diagnoses/', diagnosis_statistics_view, name='diagnosis-statistics'),
    path('statistics/patients/', patient_statistics_view, name='patient-statistics'),
    path('statistics/xrays/', xray_statistics_view, name='xray-statistics'),
    path('statistics/user-performance/', user_performance_view, name='user-performance'),
    path('statistics/system/', system_statistics_view, name='system-statistics'),
    path('statistics/dashboard/', dashboard_overview_view, name='dashboard-overview'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
]
