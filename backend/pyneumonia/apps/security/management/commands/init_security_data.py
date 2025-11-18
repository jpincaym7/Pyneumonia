"""
Comando de Django para inicializar la estructura de seguridad del sistema:
- Menús
- Módulos
- Grupos (Administradores y Radiólogos)
- Permisos

Uso:
    python manage.py init_security_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.security.models import Menu, Module, GroupModulePermission, User
from django.db import transaction


class Command(BaseCommand):
    help = 'Inicializa menús, módulos, grupos y permisos del sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina datos existentes antes de crear nuevos',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando configuración de seguridad...'))
        
        if options['reset']:
            self.stdout.write(self.style.WARNING('Eliminando datos existentes...'))
            self.reset_data()
        
        try:
            with transaction.atomic():
                # 1. Crear menús
                self.stdout.write(self.style.HTTP_INFO('\n1. Creando menús...'))
                menus = self.create_menus()
                
                # 2. Crear módulos
                self.stdout.write(self.style.HTTP_INFO('\n2. Creando módulos...'))
                modules = self.create_modules(menus)
                
                # 3. Crear grupos
                self.stdout.write(self.style.HTTP_INFO('\n3. Creando grupos...'))
                groups = self.create_groups()
                
                # 4. Asignar permisos a módulos
                self.stdout.write(self.style.HTTP_INFO('\n4. Asignando permisos a módulos...'))
                self.assign_module_permissions(modules)
                
                # 5. Configurar permisos de grupo-módulo
                self.stdout.write(self.style.HTTP_INFO('\n5. Configurando permisos de grupo-módulo...'))
                self.configure_group_module_permissions(groups, modules)
                
                self.stdout.write(self.style.SUCCESS('\n✓ Configuración completada exitosamente!'))
                self.print_summary(menus, modules, groups)
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error: {str(e)}'))
            raise

    def reset_data(self):
        """Eliminar datos existentes"""
        GroupModulePermission.objects.all().delete()
        Module.objects.all().delete()
        Menu.objects.all().delete()
        # No eliminamos grupos porque pueden tener usuarios asignados
        self.stdout.write(self.style.SUCCESS('  ✓ Datos eliminados'))

    def create_menus(self):
        """Crear o actualizar menús del sistema"""
        menus_data = [
            {
                'name': 'Administración',
                'icon': 'MdSettings',
                'description': 'Módulos de administración del sistema'
            },
            {
                'name': 'Gestión Médica',
                'icon': 'MdLocalHospital',
                'description': 'Módulos de gestión médica y pacientes'
            },
            {
                'name': 'Diagnóstico',
                'icon': 'FaXRay',
                'description': 'Módulos de análisis y diagnóstico'
            },
            {
                'name': 'Reportes',
                'icon': 'HiChartBar',
                'description': 'Módulos de reportes y estadísticas'
            },
        ]
        
        menus = {}
        for menu_data in menus_data:
            description = menu_data.pop('description')
            menu, created = Menu.objects.update_or_create(
                name=menu_data['name'],
                defaults={'icon': menu_data['icon']}
            )
            menus[menu_data['name']] = menu
            
            status = 'Creado' if created else 'Actualizado'
            self.stdout.write(f'  • {menu.name} ({menu.icon}) - {status}')
        
        return menus

    def create_modules(self, menus):
        """Crear módulos del sistema"""
        modules_data = [
            # Módulos de Administración
            {
                'name': 'Usuarios',
                'url': '/dashboard/users',
                'menu': 'Administración',
                'icon': 'FaUsers',
                'description': 'Gestión de usuarios del sistema',
                'is_active': True,
            },
            {
                'name': 'Grupos y Roles',
                'url': '/dashboard/groups',
                'menu': 'Administración',
                'icon': 'MdSecurity',
                'description': 'Gestión de grupos, roles y permisos',
                'is_active': True,
            },
            {
                'name': 'Módulos',
                'url': '/dashboard/modules',
                'menu': 'Administración',
                'icon': 'MdDashboard',
                'description': 'Configuración de módulos del sistema',
                'is_active': True,
            },
            
            # Módulos de Gestión Médica
            {
                'name': 'Pacientes',
                'url': '/medico/pacientes',
                'menu': 'Gestión Médica',
                'icon': 'FaUserInjured',
                'description': 'Gestión de información de pacientes',
                'is_active': True,
            },
            {
                'name': 'Historias Clínicas',
                'url': '/medico/historias',
                'menu': 'Gestión Médica',
                'icon': 'FaNotesMedical',
                'description': 'Historias clínicas de pacientes',
                'is_active': True,
            },
            
            # Módulos de Diagnóstico
            {
                'name': 'Análisis',
                'url': '/diagnostico/analisis',
                'menu': 'Diagnóstico',
                'icon': 'MdAnalytics',
                'description': 'Análisis de imágenes médicas y diagnósticos',
                'is_active': True,
            },
            {
                'name': 'Radiografías',
                'url': '/diagnostico/radiografias',
                'menu': 'Diagnóstico',
                'icon': 'FaXRay',
                'description': 'Gestión de radiografías de tórax',
                'is_active': True,
            },
            {
                'name': 'Resultados IA',
                'url': '/diagnostico/ia-resultados',
                'menu': 'Diagnóstico',
                'icon': 'HiCpuChip',
                'description': 'Resultados de análisis con inteligencia artificial',
                'is_active': True,
            },
            
            # Módulos de Reportes
            {
                'name': 'Reportes Médicos',
                'url': '/reportes/medicos',
                'menu': 'Reportes',
                'icon': 'HiDocumentText',
                'description': 'Generación de reportes médicos',
                'is_active': True,
            },
            {
                'name': 'Estadísticas',
                'url': '/reportes/estadisticas',
                'menu': 'Reportes',
                'icon': 'HiChartBar',
                'description': 'Estadísticas y métricas del sistema',
                'is_active': True,
            },
            {
                'name': 'Auditoría',
                'url': '/reportes/auditoria',
                'menu': 'Reportes',
                'icon': 'MdHistory',
                'description': 'Logs y auditoría del sistema',
                'is_active': True,
            },
        ]
        
        modules = {}
        for module_data in modules_data:
            menu_name = module_data.pop('menu')
            module, created = Module.objects.update_or_create(
                url=module_data['url'],
                defaults={
                    'name': module_data['name'],
                    'menu': menus[menu_name],
                    'icon': module_data['icon'],
                    'description': module_data['description'],
                    'is_active': module_data['is_active'],
                }
            )
            modules[module_data['name']] = module
            
            status = 'Creado' if created else 'Actualizado'
            self.stdout.write(f'  • {module.name} ({module.url}) - {status}')
        
        return modules

    def create_groups(self):
        """Crear grupos del sistema"""
        groups_data = [
            {
                'name': 'Administradores',
                'description': 'Acceso completo al sistema'
            },
            {
                'name': 'Radiólogos',
                'description': 'Acceso a módulos de diagnóstico y pacientes'
            },
            {
                'name': 'Médicos',
                'description': 'Acceso a módulos médicos y de pacientes'
            },
            {
                'name': 'Recepcionistas',
                'description': 'Acceso limitado a registro de pacientes'
            },
        ]
        
        groups = {}
        for group_data in groups_data:
            description = group_data.pop('description')
            group, created = Group.objects.get_or_create(
                name=group_data['name']
            )
            groups[group_data['name']] = group
            
            status = 'Creado' if created else 'Ya existe'
            self.stdout.write(f'  • {group.name} - {status}')
        
        return groups

    def assign_module_permissions(self, modules):
        """Asignar permisos a cada módulo"""
        # Obtener content types necesarios
        user_ct = ContentType.objects.get(app_label='security', model='user')
        group_ct = ContentType.objects.get(app_label='auth', model='group')
        module_ct = ContentType.objects.get(app_label='security', model='module')
        
        # Mapeo de módulos a permisos
        module_permissions = {
            'Usuarios': [
                Permission.objects.get(content_type=user_ct, codename='view_user'),
                Permission.objects.get(content_type=user_ct, codename='add_user'),
                Permission.objects.get(content_type=user_ct, codename='change_user'),
                Permission.objects.get(content_type=user_ct, codename='delete_user'),
            ],
            'Grupos y Roles': [
                Permission.objects.get(content_type=group_ct, codename='view_group'),
                Permission.objects.get(content_type=group_ct, codename='add_group'),
                Permission.objects.get(content_type=group_ct, codename='change_group'),
                Permission.objects.get(content_type=group_ct, codename='delete_group'),
            ],
            'Módulos': [
                Permission.objects.get(content_type=module_ct, codename='view_module'),
                Permission.objects.get(content_type=module_ct, codename='add_module'),
                Permission.objects.get(content_type=module_ct, codename='change_module'),
                Permission.objects.get(content_type=module_ct, codename='delete_module'),
            ],
        }
        
        # Los demás módulos tendrán permisos generales (view, add, change, delete)
        # En producción, deberías crear permisos personalizados para cada módulo
        
        for module_name, permissions in module_permissions.items():
            if module_name in modules:
                module = modules[module_name]
                module.permissions.set(permissions)
                self.stdout.write(f'  • {module_name}: {len(permissions)} permisos asignados')

    def configure_group_module_permissions(self, groups, modules):
        """Configurar permisos de grupo-módulo"""
        
        # ADMINISTRADORES: Acceso total a todos los módulos
        admin_group = groups['Administradores']
        admin_modules = [
            'Usuarios', 'Grupos y Roles', 'Módulos',
            'Pacientes', 'Historias Clínicas',
            'Análisis', 'Radiografías', 'Resultados IA',
            'Reportes Médicos', 'Estadísticas', 'Auditoría'
        ]
        
        self.stdout.write(f'\n  Configurando: {admin_group.name}')
        for module_name in admin_modules:
            if module_name in modules:
                module = modules[module_name]
                gmp, created = GroupModulePermission.objects.get_or_create(
                    group=admin_group,
                    module=module
                )
                # Asignar todos los permisos del módulo
                if module.permissions.exists():
                    gmp.permissions.set(module.permissions.all())
                
                status = 'Creado' if created else 'Actualizado'
                perm_count = gmp.permissions.count()
                self.stdout.write(f'    • {module_name}: {perm_count} permisos - {status}')
        
        # RADIÓLOGOS: Acceso a módulos de diagnóstico y pacientes
        radio_group = groups['Radiólogos']
        radio_modules = [
            'Pacientes',
            'Análisis', 'Radiografías', 'Resultados IA',
            'Reportes Médicos', 'Estadísticas'
        ]
        
        self.stdout.write(f'\n  Configurando: {radio_group.name}')
        for module_name in radio_modules:
            if module_name in modules:
                module = modules[module_name]
                gmp, created = GroupModulePermission.objects.get_or_create(
                    group=radio_group,
                    module=module
                )
                
                # Radiólogos tienen permisos de view, add, change (no delete)
                if module.permissions.exists():
                    # Filtrar permisos excluyendo delete
                    perms = module.permissions.exclude(codename__startswith='delete_')
                    gmp.permissions.set(perms)
                
                status = 'Creado' if created else 'Actualizado'
                perm_count = gmp.permissions.count()
                self.stdout.write(f'    • {module_name}: {perm_count} permisos - {status}')
        
        # MÉDICOS: Acceso a módulos médicos
        medico_group = groups['Médicos']
        medico_modules = [
            'Pacientes', 'Historias Clínicas',
            'Radiografías', 'Resultados IA',
            'Reportes Médicos'
        ]
        
        self.stdout.write(f'\n  Configurando: {medico_group.name}')
        for module_name in medico_modules:
            if module_name in modules:
                module = modules[module_name]
                gmp, created = GroupModulePermission.objects.get_or_create(
                    group=medico_group,
                    module=module
                )
                
                # Médicos tienen permisos completos en sus módulos
                if module.permissions.exists():
                    gmp.permissions.set(module.permissions.all())
                
                status = 'Creado' if created else 'Actualizado'
                perm_count = gmp.permissions.count()
                self.stdout.write(f'    • {module_name}: {perm_count} permisos - {status}')
        
        # RECEPCIONISTAS: Solo acceso a pacientes (view y add)
        recep_group = groups['Recepcionistas']
        recep_modules = ['Pacientes']
        
        self.stdout.write(f'\n  Configurando: {recep_group.name}')
        for module_name in recep_modules:
            if module_name in modules:
                module = modules[module_name]
                gmp, created = GroupModulePermission.objects.get_or_create(
                    group=recep_group,
                    module=module
                )
                
                # Recepcionistas solo view y add
                if module.permissions.exists():
                    perms = module.permissions.filter(
                        codename__in=['view_user', 'add_user']
                    )
                    gmp.permissions.set(perms)
                
                status = 'Creado' if created else 'Actualizado'
                perm_count = gmp.permissions.count()
                self.stdout.write(f'    • {module_name}: {perm_count} permisos - {status}')

    def print_summary(self, menus, modules, groups):
        """Imprimir resumen de la configuración"""
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('RESUMEN DE CONFIGURACIÓN'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        self.stdout.write(f'\n📋 Menús creados: {len(menus)}')
        for menu_name in menus:
            self.stdout.write(f'  • {menu_name}')
        
        self.stdout.write(f'\n📦 Módulos creados: {len(modules)}')
        menu_modules = {}
        for module_name, module in modules.items():
            menu_name = module.menu.name
            if menu_name not in menu_modules:
                menu_modules[menu_name] = []
            menu_modules[menu_name].append(module_name)
        
        for menu_name, module_list in menu_modules.items():
            self.stdout.write(f'  {menu_name}:')
            for mod_name in module_list:
                self.stdout.write(f'    • {mod_name}')
        
        self.stdout.write(f'\n👥 Grupos creados: {len(groups)}')
        for group_name, group in groups.items():
            module_count = GroupModulePermission.objects.filter(group=group).count()
            self.stdout.write(f'  • {group_name}: {module_count} módulos asignados')
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.WARNING('\nPróximos pasos:'))
        self.stdout.write('  1. Accede al admin: http://localhost:8000/admin/')
        self.stdout.write('  2. Crea usuarios y asígnalos a grupos')
        self.stdout.write('  3. Prueba la API: http://localhost:8000/api/security/')
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
