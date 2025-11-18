from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.security.models import Menu, Module, GroupModulePermission
from apps.diagnosis.models import Patient, XRayImage, DiagnosisResult, MedicalReport


class Command(BaseCommand):
    help = 'Inicializa los módulos de diagnóstico en el sistema de seguridad'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina y recrea los módulos de diagnóstico'
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)

        if reset:
            self.stdout.write(self.style.WARNING('Eliminando módulos de diagnóstico existentes...'))
            Module.objects.filter(url__in=['patients', 'xrays', 'diagnoses', 'reports']).delete()
            self.stdout.write(self.style.SUCCESS('✓ Módulos eliminados'))

        # 1. Verificar/Crear menús
        self.stdout.write(self.style.MIGRATE_HEADING('\n1. Verificando menús...'))
        
        # Menú de Gestión Médica (ya debería existir)
        medical_menu, created = Menu.objects.get_or_create(
            name='Gestión Médica',
            defaults={'icon': 'bi bi-heart-pulse-fill'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Gestión Médica" creado'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Gestión Médica" ya existe'))
        
        # Menú de Diagnóstico (ya debería existir)
        diagnosis_menu, created = Menu.objects.get_or_create(
            name='Diagnóstico',
            defaults={'icon': 'bi bi-file-medical-fill'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Diagnóstico" creado'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Diagnóstico" ya existe'))
        
        # Menú de Reportes (ya debería existir)
        reports_menu, created = Menu.objects.get_or_create(
            name='Reportes',
            defaults={'icon': 'bi bi-graph-up'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Reportes" creado'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ Menú "Reportes" ya existe'))

        # 2. Crear/Actualizar módulos
        self.stdout.write(self.style.MIGRATE_HEADING('\n2. Creando módulos de diagnóstico...'))
        
        modules_data = [
            {
                'url': 'patients',
                'name': 'Pacientes',
                'menu': medical_menu,
                'description': 'Gestión de pacientes',
                'icon': 'bi bi-people-fill',
                'model': Patient
            },
            {
                'url': 'xrays',
                'name': 'Radiografías',
                'menu': diagnosis_menu,
                'description': 'Gestión de radiografías de tórax',
                'icon': 'bi bi-file-earmark-medical',
                'model': XRayImage
            },
            {
                'url': 'diagnoses',
                'name': 'Resultados IA',
                'menu': diagnosis_menu,
                'description': 'Resultados de análisis con IA',
                'icon': 'bi bi-cpu',
                'model': DiagnosisResult
            },
            {
                'url': 'reports',
                'name': 'Reportes Médicos',
                'menu': reports_menu,
                'description': 'Reportes médicos de diagnósticos',
                'icon': 'bi bi-file-text',
                'model': MedicalReport
            },
        ]

        for module_data in modules_data:
            model = module_data.pop('model')
            content_type = ContentType.objects.get_for_model(model)
            
            module, created = Module.objects.update_or_create(
                url=module_data['url'],
                defaults=module_data
            )
            
            # Asignar permisos al módulo
            permissions = Permission.objects.filter(content_type=content_type)
            module.permissions.set(permissions)
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Módulo "{module.name}" creado'))
            else:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Módulo "{module.name}" actualizado'))

        # 3. Asignar módulos a grupos existentes
        self.stdout.write(self.style.MIGRATE_HEADING('\n3. Asignando módulos a grupos...'))
        
        # Obtener módulos
        patients_module = Module.objects.get(url='patients')
        xrays_module = Module.objects.get(url='xrays')
        diagnoses_module = Module.objects.get(url='diagnoses')
        reports_module = Module.objects.get(url='reports')
        
        # Obtener permisos
        patient_ct = ContentType.objects.get_for_model(Patient)
        xray_ct = ContentType.objects.get_for_model(XRayImage)
        diagnosis_ct = ContentType.objects.get_for_model(DiagnosisResult)
        report_ct = ContentType.objects.get_for_model(MedicalReport)
        
        # ADMINISTRADORES - Acceso completo
        try:
            admin_group = Group.objects.get(name='Administradores')
            
            # Pacientes
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=admin_group,
                module=patients_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=patient_ct))
            
            # Radiografías
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=admin_group,
                module=xrays_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=xray_ct))
            
            # Diagnósticos
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=admin_group,
                module=diagnoses_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=diagnosis_ct))
            
            # Reportes
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=admin_group,
                module=reports_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=report_ct))
            
            self.stdout.write(self.style.SUCCESS('  ✓ Grupo "Administradores" configurado'))
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠ Grupo "Administradores" no encontrado'))

        # RADIÓLOGOS - Acceso a diagnóstico
        try:
            radio_group = Group.objects.get(name='Radiólogos')
            
            # Pacientes (ver)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=radio_group,
                module=patients_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=patient_ct,
                codename__in=['view_patient']
            ))
            
            # Radiografías (ver, crear, editar)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=radio_group,
                module=xrays_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=xray_ct,
                codename__in=['view_xrayimage', 'add_xrayimage', 'change_xrayimage']
            ))
            
            # Diagnósticos (ver, crear, editar)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=radio_group,
                module=diagnoses_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=diagnosis_ct,
                codename__in=['view_diagnosisresult', 'add_diagnosisresult', 'change_diagnosisresult']
            ))
            
            # Reportes (ver)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=radio_group,
                module=reports_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=report_ct,
                codename__in=['view_medicalreport']
            ))
            
            self.stdout.write(self.style.SUCCESS('  ✓ Grupo "Radiólogos" configurado'))
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠ Grupo "Radiólogos" no encontrado'))

        # MÉDICOS - Acceso médico completo
        try:
            medic_group = Group.objects.get(name='Médicos')
            
            # Pacientes (completo)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=medic_group,
                module=patients_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=patient_ct))
            
            # Radiografías (ver)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=medic_group,
                module=xrays_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=xray_ct,
                codename__in=['view_xrayimage']
            ))
            
            # Diagnósticos (ver, editar)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=medic_group,
                module=diagnoses_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=diagnosis_ct,
                codename__in=['view_diagnosisresult', 'change_diagnosisresult']
            ))
            
            # Reportes (completo)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=medic_group,
                module=reports_module
            )
            gmp.permissions.set(Permission.objects.filter(content_type=report_ct))
            
            self.stdout.write(self.style.SUCCESS('  ✓ Grupo "Médicos" configurado'))
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠ Grupo "Médicos" no encontrado'))

        # RECEPCIONISTAS - Acceso limitado
        try:
            recep_group = Group.objects.get(name='Recepcionistas')
            
            # Pacientes (ver, crear)
            gmp, created = GroupModulePermission.objects.get_or_create(
                group=recep_group,
                module=patients_module
            )
            gmp.permissions.set(Permission.objects.filter(
                content_type=patient_ct,
                codename__in=['view_patient', 'add_patient']
            ))
            
            self.stdout.write(self.style.SUCCESS('  ✓ Grupo "Recepcionistas" configurado'))
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠ Grupo "Recepcionistas" no encontrado'))

        # 4. Resumen
        self.stdout.write(self.style.MIGRATE_HEADING('\n4. Resumen de configuración:'))
        self.stdout.write(self.style.SUCCESS(f'  ✓ {Module.objects.filter(url__in=["patients", "xrays", "diagnoses", "reports"]).count()} módulos de diagnóstico'))
        self.stdout.write(self.style.SUCCESS(f'  ✓ {GroupModulePermission.objects.filter(module__url__in=["patients", "xrays", "diagnoses", "reports"]).count()} relaciones grupo-módulo'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Inicialización de módulos de diagnóstico completada!'))
        self.stdout.write(self.style.MIGRATE_LABEL('\nPróximos pasos:'))
        self.stdout.write('  1. Ejecuta: python manage.py makemigrations diagnosis')
        self.stdout.write('  2. Ejecuta: python manage.py migrate')
        self.stdout.write('  3. Configura tus credenciales de Roboflow en .env')
        self.stdout.write('  4. Accede al admin y verifica los módulos')
