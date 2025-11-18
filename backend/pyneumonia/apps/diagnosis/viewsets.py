from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import requests
from .models import Patient, XRayImage, DiagnosisResult, MedicalReport, MedicalOrder
from .serializers import (
    PatientSerializer, XRayImageSerializer, DiagnosisResultSerializer, MedicalReportSerializer, MedicalOrderSerializer
)
from apps.security.mixins.api_mixins import ActionPermissionMixin


class PatientViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Patient.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'gender', 'blood_type']
    search_fields = ['first_name', 'last_name', 'dni', 'email']
    ordering_fields = ['created_at', 'last_name', 'first_name']

    permission_map = {
        'list': 'view_patient',
        'retrieve': 'view_patient',
        'create': 'add_patient',
        'update': 'change_patient',
        'partial_update': 'change_patient',
        'destroy': 'delete_patient',
    }

    def perform_create(self, serializer):
        """Establece el usuario que creó el registro"""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Validación adicional en actualización"""
        # Verificar que el usuario no intente cambiar el created_by
        if 'created_by' in self.request.data:
            return Response(
                {'error': _('No puedes cambiar el creador del registro')},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()


class XRayImageViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = XRayImage.objects.select_related('patient', 'uploaded_by').order_by('-uploaded_at')
    serializer_class = XRayImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['patient', 'is_analyzed', 'quality', 'view_position']
    search_fields = ['description', 'patient__dni', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['uploaded_at', 'quality']

    def get_queryset(self):
        """Filtrar radiografías según permisos del usuario"""
        return super().get_queryset().filter()

    permission_map = {
        'list': 'view_xrayimage',
        'retrieve': 'view_xrayimage',
        'create': 'add_xrayimage',
        'update': 'change_xrayimage',
        'partial_update': 'change_xrayimage',
        'destroy': 'delete_xrayimage',
        'patient_xrays': 'view_xrayimage',
        'toggle_analyzed': 'change_xrayimage',
    }

    def perform_create(self, serializer):
        """Al crear una radiografía, elimina la anterior asociada a la orden médica (si existe)"""
        medical_order = serializer.validated_data.get('medical_order', None)
        if medical_order:
            # Buscar si ya existe una radiografía asociada a esta orden
            try:
                previous_xray = getattr(medical_order, 'xray_image', None)
                if previous_xray:
                    previous_xray.delete()
            except Exception:
                pass
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        """Validación en actualización"""
        if 'uploaded_by' in self.request.data:
            return Response(
                {'error': _('No puedes cambiar el usuario que subió la radiografía')},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
    
    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def patient_xrays(self, request, patient_id=None):
        """Obtener todas las radiografías de un paciente específico"""
        try:
            xrays = self.queryset.filter(patient_id=patient_id)
            
            # Aplicar filtros adicionales
            is_analyzed = request.query_params.get('is_analyzed')
            if is_analyzed is not None:
                xrays = xrays.filter(is_analyzed=is_analyzed.lower() == 'true')
            
            page = self.paginate_queryset(xrays)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(xrays, many=True)
            print(serializer.data)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al obtener radiografías del paciente')},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)/unassigned')
    def unassigned_patient_xrays(self, request, patient_id=None):
        """Obtener radiografías de un paciente que NO tienen orden médica asignada"""
        try:
            xrays = self.queryset.filter(
                patient_id=patient_id,
                medical_order__isnull=True  # Solo las que no tienen orden médica
            )
            
            serializer = self.get_serializer(xrays, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al obtener radiografías sin orden médica')},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['post'], url_path='delete-by-order')
    def delete_by_order(self, request):
        """Eliminar la radiografía asociada a una orden médica"""
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'order_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from .models import MedicalOrder
            order = MedicalOrder.objects.get(id=order_id)
            xray = getattr(order, 'xray_image', None)
            if xray:
                xray.delete()
                return Response({'success': 'Radiografía eliminada correctamente'})
            else:
                return Response({'error': 'No existe radiografía asociada a esta orden'}, status=status.HTTP_404_NOT_FOUND)
        except MedicalOrder.DoesNotExist:
            return Response({'error': 'Orden médica no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error al eliminar radiografía: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_analyzed(self, request, pk=None):
        """Marcar/desmarcar una radiografía como analizada"""
        try:
            xray = self.get_object()
            medical_order_id = request.data.get('medical_order_id')
            
            # Si se está marcando como analizada
            if not xray.is_analyzed:
                xray.is_analyzed = True
                
                # Solo asignar orden médica si no tiene una ya asignada
                if xray.medical_order is None and medical_order_id:
                    from .models import MedicalOrder
                    try:
                        orden = MedicalOrder.objects.get(
                            id=medical_order_id, 
                            patient=xray.patient
                        )
                        xray.medical_order = orden
                    except MedicalOrder.DoesNotExist:
                        return Response(
                            {'error': _('No se encontró la orden médica especificada para este paciente.')},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif xray.medical_order is not None and medical_order_id and str(xray.medical_order.id) != str(medical_order_id):
                    # Si ya tiene una orden médica diferente, no permitir el cambio
                    return Response(
                        {
                            'error': _('Esta radiografía ya está asociada a otra orden médica.'),
                            'current_order': str(xray.medical_order.id)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Si se está desmarcando, solo cambiar el flag
                xray.is_analyzed = False
            
            xray.save()
            serializer = self.get_serializer(xray)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al actualizar el estado de análisis')},
                status=status.HTTP_400_BAD_REQUEST
            )

        

class DiagnosisResultViewSet(ActionPermissionMixin, viewsets.ModelViewSet):

    queryset = DiagnosisResult.objects.select_related('xray__patient', 'radiologist_review', 'treating_physician_approval').order_by('-created_at')
    serializer_class = DiagnosisResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['predicted_class', 'status', 'severity', 'xray']
    search_fields = ['predicted_class', 'xray__patient__first_name', 'xray__patient__last_name', 'xray__patient__dni']
    ordering_fields = ['created_at', 'confidence']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Incluir diagnósticos relacionados con órdenes médicas
        queryset = queryset.select_related('xray__medical_order')
        return queryset

    permission_map = {
        'list': 'view_diagnosisresult',
        'retrieve': 'view_diagnosisresult',
        'create': 'add_diagnosisresult',
        'update': 'change_diagnosisresult',
        'partial_update': 'change_diagnosisresult',
        'destroy': 'delete_diagnosisresult',
        'mark_reviewed': 'change_diagnosisresult',
        'radiologist_review': 'change_diagnosisresult',
        'physician_approval': 'change_diagnosisresult',
        'by_my_orders': 'view_diagnosisresult',
    }

    def perform_update(self, serializer):
        """Validación en actualización"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Al eliminar un diagnóstico:
        - Marcar la radiografía como no analizada
        - Cambiar el estado de la orden médica asociada a 'pending'
        Solo médicos y administradores pueden eliminar diagnósticos
        """
        from django.contrib.auth.models import Group

        # Validar que el usuario sea médico o administrador
        is_physician = self.request.user.groups.filter(name='Médicos').exists()
        is_admin = self.request.user.is_staff or self.request.user.is_superuser

        if not (is_physician or is_admin):
            raise PermissionError(_('Solo médicos pueden eliminar diagnósticos'))

        # Marcar la radiografía como no analizada
        if hasattr(instance, 'xray') and instance.xray:
            instance.xray.is_analyzed = False
            instance.xray.save()
            # Cambiar estado de la orden médica asociada a 'pending'
            if instance.xray.medical_order:
                order = instance.xray.medical_order
                order.status = 'pending'
                order.save()

        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """Marcar un diagnóstico como revisado por un médico"""
        try:
            from django.utils import timezone
            from django.contrib.auth.models import Group
            
            # Validar que el usuario sea médico o administrador
            is_physician = request.user.groups.filter(name='Médicos').exists()
            is_admin = request.user.is_staff or request.user.is_superuser
            
            if not (is_physician or is_admin):
                return Response(
                    {'error': _('Solo médicos pueden revisar diagnósticos')},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            diagnosis = self.get_object()
            diagnosis.is_reviewed = True
            diagnosis.reviewed_by = request.user
            diagnosis.reviewed_at = timezone.now()
            diagnosis.save()
            
            serializer = self.get_serializer(diagnosis)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al marcar como revisado'), 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def radiologist_review(self, request, pk=None):
        """Revisión del radiólogo sobre la predicción de IA"""
        try:
            from django.utils import timezone
            
            diagnosis = self.get_object()
            
            # Validar que el radiólogo esté proporcionando notas y severidad
            severity = request.data.get('severity')
            notes = request.data.get('notes', '')
            
            if not severity:
                return Response(
                    {'error': _('La severidad es obligatoria en la revisión radiológica')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            diagnosis.radiologist_review = request.user
            diagnosis.radiologist_reviewed_at = timezone.now()
            diagnosis.severity = severity
            diagnosis.radiologist_notes = notes
            diagnosis.save()
            
            serializer = self.get_serializer(diagnosis)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al procesar revisión radiológica'), 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def physician_approval(self, request, pk=None):
        """Aprobación del médico tratante"""
        try:
            from django.utils import timezone
            
            diagnosis = self.get_object()
            
            # Validar que el diagnóstico haya sido revisado por radiólogo
            if not diagnosis.radiologist_review:
                return Response(
                    {'error': _('El diagnóstico debe ser revisado por radiólogo primero')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            notes = request.data.get('notes', '')
            
            diagnosis.treating_physician_approval = request.user
            diagnosis.approved_at = timezone.now()
            diagnosis.treating_physician_notes = notes
            diagnosis.save()
            
            serializer = self.get_serializer(diagnosis)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al procesar aprobación médica'), 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='by-my-orders')
    def by_my_orders(self, request):
        """
        Obtener diagnósticos asociados a órdenes solicitadas por el médico autenticado.
        """
        try:
            user = request.user
            # Filtrar diagnósticos ligados a órdenes y radiografías analizadas

            diagnoses = (
                DiagnosisResult.objects
                .filter(
                    xray__medical_order__requested_by=user,
                    xray__is_analyzed=True,
                    xray__medical_order__status='completed',
                    is_reviewed=True  # Solo diagnósticos revisados por médico
                )
                .exclude(reports__isnull=False)
                .select_related(
                    'xray',
                    'xray__medical_order',
                    'xray__patient'
                )
                .distinct()
            )

            print("Diagnósticos encontrados:", diagnoses.count())
            for diag in diagnoses:
                print(f"image {diag.xray.image}")

            # 3. Aplicar paginación
            page = self.paginate_queryset(diagnoses)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(diagnoses, many=True)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': 'Error al obtener diagnósticos', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



class MedicalReportViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    serializer_class = MedicalReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'findings', 'impression']
    ordering_fields = ['created_at', 'updated_at']

    permission_map = {
        'list': 'view_medicalreport',
        'retrieve': 'view_medicalreport',
        'create': 'add_medicalreport',
        'update': 'change_medicalreport',
        'partial_update': 'change_medicalreport',
        'destroy': 'delete_medicalreport',
        'physician_receive': 'change_medicalreport',
        'by_order': 'view_medicalreport',
        'by_patient': 'view_medicalreport',
    }

    def get_queryset(self):
        """
        Optimizar queries con select_related para evitar N+1
        También permite filtrar por paciente y orden médica
        """
        queryset = MedicalReport.objects.select_related(
            'diagnosis__xray__medical_order__patient',
            'diagnosis__xray__medical_order__requested_by',
            'created_by',
            'received_by'
        ).order_by('-created_at')
        # ...existing code...
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(
                diagnosis__xray__medical_order__patient_id=patient_id
            )
        # ...existing code...
        order_id = self.request.query_params.get('medical_order', None)
        if order_id:
            queryset = queryset.filter(
                diagnosis__xray__medical_order_id=order_id
            )
        # ...existing code...
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        # ...existing code...
        diagnosis_id = self.request.query_params.get('diagnosis', None)
        if diagnosis_id:
            queryset = queryset.filter(diagnosis_id=diagnosis_id)
        return queryset

    def perform_create(self, serializer):
        """Establece el usuario que creó el reporte"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='by-order/(?P<order_id>[^/.]+)')
    def by_order(self, request, order_id=None):
        """Obtener todos los reportes de una orden médica específica"""
        reports = self.get_queryset().filter(
            diagnosis__xray__medical_order_id=order_id
        )
        
        page = self.paginate_queryset(reports)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-patient/(?P<patient_id>[^/.]+)')
    def by_patient(self, request, patient_id=None):
        """Obtener todos los reportes de un paciente específico"""
        reports = self.get_queryset().filter(
            diagnosis__xray__medical_order__patient_id=patient_id
        )
        
        page = self.paginate_queryset(reports)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)

            
    @action(detail=True, methods=['post'])
    def physician_receive(self, request, pk=None):
        """Médico tratante firma y recibe el reporte"""
        try:
            from django.utils import timezone
            report = self.get_object()
            # Validar que el reporte esté en borrador
            if report.status != 'draft':
                return Response(
                    {'error': 'Solo se pueden firmar reportes en estado borrador'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Validar que el diagnóstico asociado esté completado
            if report.diagnosis.status != 'completed':
                return Response(
                    {'error': 'El diagnóstico debe estar completado antes de firmar'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Validar que no haya sido recibido previamente
            if report.received_by:
                return Response(
                    {'error': 'Este reporte ya fue recibido anteriormente'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            report.status = 'revised'
            report.received_by = request.user
            report.received_at = timezone.now()
            report.save()
            serializer = self.get_serializer(report)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Error al recibir el reporte: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MedicalOrderViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """ViewSet para órdenes médicas"""
    queryset = MedicalOrder.objects.select_related('patient', 'requested_by').order_by('-created_at')
    serializer_class = MedicalOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['patient', 'status', 'priority', 'requested_by']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__dni', 'reason']
    ordering_fields = ['created_at', 'priority', 'status']

    permission_map = {
        'list': 'view_medicalorder',
        'retrieve': 'view_medicalorder',
        'create': 'add_medicalorder',
        'update': 'change_medicalorder',
        'partial_update': 'change_medicalorder',
        'destroy': 'delete_medicalorder',
        'update_status': 'change_medicalorder',
    }

    def perform_create(self, serializer):
        """Establece el usuario que solicitó la orden"""
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Actualizar el estado de la orden médica"""
        try:
            from django.utils import timezone
            
            order = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return Response(
                    {'error': _('El estado es obligatorio')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
            if new_status not in valid_statuses:
                return Response(
                    {'error': _('Estado inválido. Valores permitidos: %(statuses)s') % {'statuses': ', '.join(valid_statuses)}},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order.status = new_status
            
            # Actualizar fecha de completación si se marca como completada
            if new_status == 'completed':
                order.completed_date = timezone.now()
            elif new_status == 'in_progress':
                order.scheduled_date = timezone.now()
            
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': _('Error al actualizar el estado de la orden')},
                status=status.HTTP_400_BAD_REQUEST
            )
