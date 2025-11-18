from django.core.management.base import BaseCommand
from apps.security.models import Module, GroupModulePermission
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = 'Verifica los módulos existentes en el sistema'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== MÓDULOS EXISTENTES ==='))
        
        modules = Module.objects.all()
        
        if not modules.exists():
            self.stdout.write(self.style.WARNING('No hay módulos registrados en el sistema'))
            return
        
        for module in modules:
            self.stdout.write(f'\n📌 Módulo: {module.name}')
            self.stdout.write(f'   URL: {module.url}')
            self.stdout.write(f'   Menú: {module.menu.name}')
            self.stdout.write(f'   Activo: {module.is_active}')
            
            # Verificar permisos asociados
            permissions = module.permissions.all()
            if permissions.exists():
                self.stdout.write(f'   Permisos asociados: {permissions.count()}')
                for perm in permissions:
                    self.stdout.write(f'      - {perm.codename}')
            
            # Verificar grupos con acceso
            group_perms = GroupModulePermission.objects.filter(module=module)
            if group_perms.exists():
                self.stdout.write(f'   Grupos con acceso: {group_perms.count()}')
                for gp in group_perms:
                    self.stdout.write(f'      - {gp.group.name}')
        
        self.stdout.write(self.style.SUCCESS('\n=== FIN ===\n'))
