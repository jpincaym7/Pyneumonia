from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.diagnosis.models import Patient, XRayImage, DiagnosisResult, MedicalReport

User = get_user_model()


class Command(BaseCommand):
    help = 'Asignar permisos del módulo diagnosis a grupos de usuarios'

    def handle(self, *args, **kwargs):
        self.stdout.write('Asignando permisos del módulo diagnosis...')
        
        # Obtener content types
        patient_ct = ContentType.objects.get_for_model(Patient)
        xray_ct = ContentType.objects.get_for_model(XRayImage)
        diagnosis_ct = ContentType.objects.get_for_model(DiagnosisResult)
        report_ct = ContentType.objects.get_for_model(MedicalReport)
        
        # Crear o obtener grupos
        admin_group, _ = Group.objects.get_or_create(name='Administradores')
        medicos_group, _ = Group.objects.get_or_create(name='Médicos')
        radiologos_group, _ = Group.objects.get_or_create(name='Radiólogos')
        recepcionistas_group, _ = Group.objects.get_or_create(name='Recepcionistas')
        
        # PERMISOS PARA ADMINISTRADORES (todos los permisos)
        admin_permissions = Permission.objects.filter(
            content_type__in=[patient_ct, xray_ct, diagnosis_ct, report_ct]
        )
        admin_group.permissions.set(admin_permissions)
        self.stdout.write(self.style.SUCCESS(f'✓ Permisos asignados a Administradores: {admin_permissions.count()}'))
        
        # PERMISOS PARA MÉDICOS
        medico_permissions = [
            # Pacientes
            Permission.objects.get(content_type=patient_ct, codename='view_patient'),
            Permission.objects.get(content_type=patient_ct, codename='add_patient'),
            Permission.objects.get(content_type=patient_ct, codename='change_patient'),
            # Radiografías
            Permission.objects.get(content_type=xray_ct, codename='view_xrayimage'),
            # Diagnósticos
            Permission.objects.get(content_type=diagnosis_ct, codename='view_diagnosisresult'),
            Permission.objects.get(content_type=diagnosis_ct, codename='change_diagnosisresult'),
            # Reportes
            Permission.objects.get(content_type=report_ct, codename='view_medicalreport'),
            Permission.objects.get(content_type=report_ct, codename='add_medicalreport'),
            Permission.objects.get(content_type=report_ct, codename='change_medicalreport'),
        ]
        medicos_group.permissions.set(medico_permissions)
        self.stdout.write(self.style.SUCCESS(f'✓ Permisos asignados a Médicos: {len(medico_permissions)}'))
        
        # PERMISOS PARA RADIÓLOGOS
        radiologo_permissions = [
            # Pacientes
            Permission.objects.get(content_type=patient_ct, codename='view_patient'),
            # Radiografías
            Permission.objects.get(content_type=xray_ct, codename='view_xrayimage'),
            Permission.objects.get(content_type=xray_ct, codename='add_xrayimage'),
            # Diagnósticos
            Permission.objects.get(content_type=diagnosis_ct, codename='view_diagnosisresult'),
            Permission.objects.get(content_type=diagnosis_ct, codename='add_diagnosisresult'),
            Permission.objects.get(content_type=diagnosis_ct, codename='change_diagnosisresult'),
        ]
        radiologos_group.permissions.set(radiologo_permissions)
        self.stdout.write(self.style.SUCCESS(f'✓ Permisos asignados a Radiólogos: {len(radiologo_permissions)}'))
        
        # PERMISOS PARA RECEPCIONISTAS
        recepcionista_permissions = [
            # Pacientes
            Permission.objects.get(content_type=patient_ct, codename='view_patient'),
            Permission.objects.get(content_type=patient_ct, codename='add_patient'),
            Permission.objects.get(content_type=patient_ct, codename='change_patient'),
        ]
        recepcionistas_group.permissions.set(recepcionista_permissions)
        self.stdout.write(self.style.SUCCESS(f'✓ Permisos asignados a Recepcionistas: {len(recepcionista_permissions)}'))
        
        # Asignar todos los usuarios al grupo Administradores si no tienen grupo
        users_without_group = User.objects.filter(groups__isnull=True, is_active=True)
        for user in users_without_group:
            user.groups.add(admin_group)
            self.stdout.write(self.style.SUCCESS(f'✓ Usuario {user.username} agregado a Administradores'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Permisos asignados exitosamente!'))
