from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, Permission
from django.utils.html import format_html
from django.db.models import Count
from apps.security.models import User, Menu, Module, GroupModulePermission, AuditUser


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Administración personalizada de usuarios
    """
    list_display = (
        'username', 'email', 'get_full_name_display', 'dni', 
        'is_active', 'is_staff', 'is_superuser', 'show_groups', 
        'date_joined', 'show_image'
    )
    list_filter = (
        'is_active', 'is_staff', 'is_superuser', 
        'groups', 'date_joined'
    )
    search_fields = (
        'username', 'email', 'first_name', 'last_name', 'dni', 'phone'
    )
    ordering = ('-date_joined',)
    filter_horizontal = ('groups', 'user_permissions')
    
    fieldsets = (
        ('Información de Acceso', {
            'fields': ('username', 'email', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'dni', 'phone', 'direction', 'image')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Información de Acceso', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Información Personal', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'dni', 'phone', 'direction'),
        }),
        ('Permisos', {
            'classes': ('wide',),
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    
    def get_full_name_display(self, obj):
        """Mostrar nombre completo"""
        return obj.get_full_name or '-'
    get_full_name_display.short_description = 'Nombre Completo'
    
    def show_groups(self, obj):
        """Mostrar grupos del usuario"""
        groups = obj.groups.all()
        if groups:
            return format_html(
                '<br>'.join([
                    f'<span style="background-color: #4CAF50; color: white; '
                    f'padding: 2px 8px; border-radius: 3px; font-size: 11px;">{g.name}</span>'
                    for g in groups
                ])
            )
        return '-'
    show_groups.short_description = 'Grupos'
    
    def show_image(self, obj):
        """Mostrar imagen del usuario"""
        if obj.image:
            return format_html(
                '<img src="{}" width="40" height="40" '
                'style="border-radius: 50%; object-fit: cover;" />',
                obj.image.url
            )
        return format_html(
            '<div style="width: 40px; height: 40px; background-color: #ddd; '
            'border-radius: 50%; display: flex; align-items: center; '
            'justify-content: center; font-size: 16px; font-weight: bold;">{}</div>',
            obj.username[0].upper() if obj.username else '?'
        )
    show_image.short_description = 'Imagen'
    
    actions = ['activate_users', 'deactivate_users', 'make_staff', 'remove_staff']
    
    def activate_users(self, request, queryset):
        """Activar usuarios seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} usuario(s) activado(s).')
    activate_users.short_description = 'Activar usuarios seleccionados'
    
    def deactivate_users(self, request, queryset):
        """Desactivar usuarios seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} usuario(s) desactivado(s).')
    deactivate_users.short_description = 'Desactivar usuarios seleccionados'
    
    def make_staff(self, request, queryset):
        """Convertir en staff"""
        updated = queryset.update(is_staff=True)
        self.message_user(request, f'{updated} usuario(s) ahora es/son staff.')
    make_staff.short_description = 'Marcar como staff'
    
    def remove_staff(self, request, queryset):
        """Quitar staff"""
        updated = queryset.update(is_staff=False)
        self.message_user(request, f'{updated} usuario(s) ya no es/son staff.')
    remove_staff.short_description = 'Quitar staff'


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    """
    Administración de menús
    """
    list_display = ('id', 'name', 'show_icon', 'module_count', 'created_info')
    search_fields = ('name',)
    ordering = ('name',)
    list_per_page = 20
    
    def show_icon(self, obj):
        """Mostrar icono del menú"""
        icon = obj.get_icon()
        return format_html(
            '<i class="{}" style="font-size: 20px;"></i> <span style="margin-left: 8px;">{}</span>',
            icon, icon
        )
    show_icon.short_description = 'Icono'
    
    def module_count(self, obj):
        """Contar módulos del menú"""
        count = obj.module_set.count()
        return format_html(
            '<span style="background-color: #2196F3; color: white; '
            'padding: 3px 10px; border-radius: 12px; font-size: 12px;">{}</span>',
            count
        )
    module_count.short_description = 'Módulos'
    
    def created_info(self, obj):
        """Información de creación"""
        return format_html(
            '<span style="color: #666; font-size: 11px;">ID: {}</span>',
            obj.id
        )
    created_info.short_description = 'Info'


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    """
    Administración de módulos
    """
    list_display = (
        'id', 'name', 'url', 'menu', 'show_icon', 
        'is_active', 'permission_count', 'show_status'
    )
    list_filter = ('is_active', 'menu')
    search_fields = ('name', 'url', 'description')
    ordering = ('menu', 'name')
    filter_horizontal = ('permissions',)
    list_editable = ('is_active',)
    list_per_page = 20
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'url', 'menu', 'description', 'icon')
        }),
        ('Configuración', {
            'fields': ('is_active', 'permissions')
        }),
    )
    
    def show_icon(self, obj):
        """Mostrar icono del módulo"""
        icon = obj.get_icon()
        return format_html(
            '<i class="{}" style="font-size: 18px;"></i>',
            icon
        )
    show_icon.short_description = 'Icono'
    
    def permission_count(self, obj):
        """Contar permisos del módulo"""
        count = obj.permissions.count()
        return format_html(
            '<span style="background-color: #FF9800; color: white; '
            'padding: 3px 10px; border-radius: 12px; font-size: 12px;">{}</span>',
            count
        )
    permission_count.short_description = 'Permisos'
    
    def show_status(self, obj):
        """Mostrar estado del módulo"""
        if obj.is_active:
            return format_html(
                '<span style="color: #4CAF50; font-weight: bold;">✓ Activo</span>'
            )
        return format_html(
            '<span style="color: #f44336; font-weight: bold;">✗ Inactivo</span>'
        )
    show_status.short_description = 'Estado'
    
    actions = ['activate_modules', 'deactivate_modules']
    
    def activate_modules(self, request, queryset):
        """Activar módulos seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} módulo(s) activado(s).')
    activate_modules.short_description = 'Activar módulos seleccionados'
    
    def deactivate_modules(self, request, queryset):
        """Desactivar módulos seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} módulo(s) desactivado(s).')
    deactivate_modules.short_description = 'Desactivar módulos seleccionados'


@admin.register(GroupModulePermission)
class GroupModulePermissionAdmin(admin.ModelAdmin):
    """
    Administración de permisos de grupo-módulo
    """
    list_display = (
        'id', 'show_group', 'show_module', 'show_menu', 
        'permission_count', 'created_info'
    )
    list_filter = ('group', 'module__menu', 'module')
    search_fields = ('group__name', 'module__name')
    ordering = ('-id',)
    filter_horizontal = ('permissions',)
    list_per_page = 20
    
    fieldsets = (
        ('Asignación', {
            'fields': ('group', 'module')
        }),
        ('Permisos', {
            'fields': ('permissions',),
            'description': 'Seleccione los permisos que tendrá este grupo para este módulo'
        }),
    )
    
    def show_group(self, obj):
        """Mostrar grupo con estilo"""
        return format_html(
            '<span style="background-color: #673AB7; color: white; '
            'padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">{}</span>',
            obj.group.name
        )
    show_group.short_description = 'Grupo'
    
    def show_module(self, obj):
        """Mostrar módulo con estilo"""
        return format_html(
            '<span style="background-color: #009688; color: white; '
            'padding: 4px 12px; border-radius: 4px; font-size: 12px;">{}</span>',
            obj.module.name
        )
    show_module.short_description = 'Módulo'
    
    def show_menu(self, obj):
        """Mostrar menú del módulo"""
        return format_html(
            '<span style="color: #666; font-size: 11px;"><i class="{}"></i> {}</span>',
            obj.module.menu.get_icon(),
            obj.module.menu.name
        )
    show_menu.short_description = 'Menú'
    
    def permission_count(self, obj):
        """Contar permisos asignados"""
        count = obj.permissions.count()
        color = '#4CAF50' if count > 0 else '#f44336'
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">{}</span>',
            color, count
        )
    permission_count.short_description = 'Permisos'
    
    def created_info(self, obj):
        """Información adicional"""
        return format_html(
            '<span style="color: #999; font-size: 10px;">ID: {}</span>',
            obj.id
        )
    created_info.short_description = 'ID'


@admin.register(AuditUser)
class AuditUserAdmin(admin.ModelAdmin):
    """
    Administración de auditoría de usuarios (solo lectura)
    """
    list_display = (
        'id', 'show_usuario', 'tabla', 'registroid', 
        'show_accion', 'fecha', 'hora', 'estacion'
    )
    list_filter = ('accion', 'tabla', 'fecha', 'usuario')
    search_fields = (
        'usuario__username', 'usuario__email', 
        'tabla', 'estacion'
    )
    ordering = ('-fecha', '-hora')
    date_hierarchy = 'fecha'
    list_per_page = 50
    
    # Solo lectura
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def show_usuario(self, obj):
        """Mostrar usuario con estilo"""
        return format_html(
            '<strong>{}</strong><br>'
            '<span style="color: #666; font-size: 11px;">{}</span>',
            obj.usuario.username,
            obj.usuario.email
        )
    show_usuario.short_description = 'Usuario'
    
    def show_accion(self, obj):
        """Mostrar acción con color"""
        colors = {
            'A': '#4CAF50',  # Verde para Adición
            'M': '#FF9800',  # Naranja para Modificación
            'E': '#f44336',  # Rojo para Eliminación
        }
        labels = {
            'A': 'Adición',
            'M': 'Modificación',
            'E': 'Eliminación',
        }
        color = colors.get(obj.accion, '#999')
        label = labels.get(obj.accion, obj.accion)
        
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 4px 12px; border-radius: 4px; font-size: 11px; '
            'font-weight: bold; display: inline-block; min-width: 80px; text-align: center;">{}</span>',
            color, label
        )
    show_accion.short_description = 'Acción'
    
    readonly_fields = (
        'usuario', 'tabla', 'registroid', 'accion', 
        'fecha', 'hora', 'estacion'
    )


# Personalizar el sitio de administración
admin.site.site_header = 'Administración de Pyneumonia'
admin.site.site_title = 'Pyneumonia Admin'
admin.site.index_title = 'Panel de Administración'


# Personalizar la administración de Group (opcional)
class GroupAdmin(admin.ModelAdmin):
    """
    Administración personalizada de grupos
    """
    list_display = ('id', 'name', 'user_count', 'permission_count')
    search_fields = ('name',)
    filter_horizontal = ('permissions',)
    ordering = ('name',)
    
    def get_queryset(self, request):
        """Agregar anotaciones"""
        qs = super().get_queryset(request)
        return qs.annotate(
            _user_count=Count('user', distinct=True)
        )
    
    def user_count(self, obj):
        """Contar usuarios del grupo"""
        count = obj._user_count
        return format_html(
            '<span style="background-color: #3F51B5; color: white; '
            'padding: 3px 10px; border-radius: 12px; font-size: 12px;">{}</span>',
            count
        )
    user_count.short_description = 'Usuarios'
    user_count.admin_order_field = '_user_count'
    
    def permission_count(self, obj):
        """Contar permisos del grupo"""
        count = obj.permissions.count()
        return format_html(
            '<span style="background-color: #E91E63; color: white; '
            'padding: 3px 10px; border-radius: 12px; font-size: 12px;">{}</span>',
            count
        )
    permission_count.short_description = 'Permisos'


# Re-registrar Group con la nueva administración
admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)
