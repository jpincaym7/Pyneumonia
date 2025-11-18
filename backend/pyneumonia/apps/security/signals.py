"""
Signals para auditoría automática y gestión de usuarios
"""
from django.contrib.auth.models import Group
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import Permission
from django.db.models.signals import post_migrate
from datetime import datetime
import socket
from crum import get_current_request

from apps.security.models import User, Menu, Module, GroupModulePermission, AuditUser


# ==================== SEÑALES DE AUDITORÍA ====================

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


# ==================== AUDITORÍA DE USUARIOS ====================

@receiver(post_save, sender=User)
def audit_user_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de usuarios"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'User', instance.id, action)
        
        # Asignar grupo a usuarios nuevos
        if created and instance.is_superuser:
            admin_group, _ = Group.objects.get_or_create(name='Administradores')
            instance.groups.add(admin_group)


@receiver(post_delete, sender=User)
def audit_user_delete(sender, instance, **kwargs):
    """Auditar eliminación de usuarios"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'User', instance.id, 'E')


# ==================== AUDITORÍA DE MENÚS ====================

@receiver(post_save, sender=Menu)
def audit_menu_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de menús"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'Menu', instance.id, action)


@receiver(post_delete, sender=Menu)
def audit_menu_delete(sender, instance, **kwargs):
    """Auditar eliminación de menús"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'Menu', instance.id, 'E')


# ==================== AUDITORÍA DE MÓDULOS ====================

@receiver(post_save, sender=Module)
def audit_module_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de módulos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'Module', instance.id, action)


@receiver(post_delete, sender=Module)
def audit_module_delete(sender, instance, **kwargs):
    """Auditar eliminación de módulos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'Module', instance.id, 'E')


# ==================== AUDITORÍA DE GRUPOS ====================

@receiver(post_save, sender=Group)
def audit_group_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de grupos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'Group', instance.id, action)


@receiver(post_delete, sender=Group)
def audit_group_delete(sender, instance, **kwargs):
    """Auditar eliminación de grupos"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'Group', instance.id, 'E')


# ==================== AUDITORÍA DE PERMISOS DE GRUPO-MÓDULO ====================

@receiver(post_save, sender=GroupModulePermission)
def audit_group_module_permission_save(sender, instance, created, **kwargs):
    """Auditar creación y modificación de permisos grupo-módulo"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        action = 'A' if created else 'M'
        create_audit_record(request.user, 'GroupModulePermission', instance.id, action)


@receiver(post_delete, sender=GroupModulePermission)
def audit_group_module_permission_delete(sender, instance, **kwargs):
    """Auditar eliminación de permisos grupo-módulo"""
    request = get_current_request()
    if request and request.user.is_authenticated:
        create_audit_record(request.user, 'GroupModulePermission', instance.id, 'E')