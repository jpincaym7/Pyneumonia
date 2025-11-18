"""
Script para crear datos de prueba de GroupModulePermission
Ejecutar: python manage.py shell < create_test_data.py
"""

from django.contrib.auth.models import Group, Permission
from apps.security.models import Menu, Module, GroupModulePermission

# Obtener o crear grupo
grupo, created = Group.objects.get_or_create(name='Administradores')
print(f"Grupo: {grupo.name} ({'creado' if created else 'existente'})")

# Obtener o crear menú
menu, created = Menu.objects.get_or_create(
    name='Seguridad',
    defaults={'icon': 'MdSecurity'}
)
print(f"Menú: {menu.name} ({'creado' if created else 'existente'})")

# Obtener o crear módulo
modulo, created = Module.objects.get_or_create(
    url='/dashboard/users',
    defaults={
        'name': 'Usuarios',
        'menu': menu,
        'description': 'Gestión de usuarios del sistema',
        'icon': 'MdPeople',
        'is_active': True
    }
)
print(f"Módulo: {modulo.name} ({'creado' if created else 'existente'})")

# Obtener algunos permisos
permisos = Permission.objects.filter(
    content_type__app_label='security',
    content_type__model='user'
)[:4]

print(f"\nPermisos encontrados: {permisos.count()}")
for p in permisos:
    print(f"  - {p.name} ({p.codename})")

# Crear o actualizar GroupModulePermission
gmp, created = GroupModulePermission.objects.get_or_create(
    group=grupo,
    module=modulo
)

if created:
    print(f"\n✅ GroupModulePermission creado")
else:
    print(f"\n✅ GroupModulePermission actualizado")

# Asignar permisos
gmp.permissions.set(permisos)
print(f"Permisos asignados: {gmp.permissions.count()}")

# Verificar
print("\n" + "="*50)
print("VERIFICACIÓN")
print("="*50)

gmp_list = GroupModulePermission.objects.filter(group=grupo)
print(f"\nTotal de módulos asignados al grupo '{grupo.name}': {gmp_list.count()}")

for gmp in gmp_list:
    print(f"\n- Módulo: {gmp.module.name}")
    print(f"  Menú: {gmp.module.menu.name}")
    print(f"  URL: {gmp.module.url}")
    print(f"  Permisos: {gmp.permissions.count()}")
    for perm in gmp.permissions.all():
        print(f"    • {perm.name}")
