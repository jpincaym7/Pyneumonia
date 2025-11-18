"""
Serializers para el módulo de seguridad
Compatible con Next.js frontend
"""
from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext_lazy as _
from apps.security.models import User, Menu, Module, GroupModulePermission, AuditUser
from apps.security.validators import (
    validate_ecuadorian_cedula,
    validate_cedula_format,
    validate_unique_cedula,
    validate_user_email,
    validate_username_format,
    validate_user_names,
    validate_phone_format,
    validate_no_sql_injection,
)


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer para permisos"""
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']


class MenuSerializer(serializers.ModelSerializer):
    """Serializer para menús"""
    class Meta:
        model = Menu
        fields = ['id', 'name', 'icon']
    
    def to_representation(self, instance):
        """Asegurar que siempre haya un ícono"""
        data = super().to_representation(instance)
        if not data.get('icon'):
            data['icon'] = 'MdFolder'  # Ícono por defecto
        return data
    
    def validate_name(self, value):
        """Validar que el nombre sea único"""
        if self.instance:
            # Edición - excluir el registro actual
            if Menu.objects.exclude(id=self.instance.id).filter(name=value).exists():
                raise serializers.ValidationError("Ya existe un menú con este nombre")
        else:
            # Creación
            if Menu.objects.filter(name=value).exists():
                raise serializers.ValidationError("Ya existe un menú con este nombre")
        return value


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer para módulos"""
    menu_name = serializers.CharField(source='menu.name', read_only=True)
    menu_icon = serializers.CharField(source='menu.icon', read_only=True)
    permissions_data = PermissionSerializer(source='permissions', many=True, read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'url', 'name', 'menu', 'menu_name', 'menu_icon',
            'description', 'icon', 'is_active', 'permissions', 'permissions_data'
        ]
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        """Asegurar que siempre haya un ícono"""
        data = super().to_representation(instance)
        if not data.get('icon'):
            data['icon'] = 'MdViewModule'  # Ícono por defecto
        return data
    
    def validate_url(self, value):
        """Validar que la URL sea única"""
        if self.instance:
            if Module.objects.exclude(id=self.instance.id).filter(url=value).exists():
                raise serializers.ValidationError("Ya existe un módulo con esta URL")
        else:
            if Module.objects.filter(url=value).exists():
                raise serializers.ValidationError("Ya existe un módulo con esta URL")
        return value


class GroupSerializer(serializers.ModelSerializer):
    """Serializer para grupos"""
    user_count = serializers.SerializerMethodField()
    module_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'user_count', 'module_count']
    
    def get_user_count(self, obj):
        """Obtener cantidad de usuarios en el grupo"""
        return obj.user_set.count()
    
    def get_module_count(self, obj):
        """Obtener cantidad de módulos asignados"""
        return obj.groupmodulepermission_set.count()
    
    def validate_name(self, value):
        """Validar que el nombre sea único"""
        if self.instance:
            if Group.objects.exclude(id=self.instance.id).filter(name=value).exists():
                raise serializers.ValidationError("Ya existe un grupo con este nombre")
        else:
            if Group.objects.filter(name=value).exists():
                raise serializers.ValidationError("Ya existe un grupo con este nombre")
        return value


class GroupModulePermissionSerializer(serializers.ModelSerializer):
    """Serializer para permisos de grupo-módulo"""
    module_name = serializers.CharField(source='module.name', read_only=True)
    module_url = serializers.CharField(source='module.url', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    permissions_data = PermissionSerializer(source='permissions', many=True, read_only=True)
    
    # Campos para escritura (acepta IDs)
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=Group.objects.all(),
        write_only=True,
        required=False
    )
    module_id = serializers.PrimaryKeyRelatedField(
        source='module',
        queryset=Module.objects.all(),
        write_only=True,
        required=False
    )
    
    # Campos para lectura (objetos completos)
    group = serializers.SerializerMethodField(read_only=True)
    module = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = GroupModulePermission
        fields = [
            'id', 'group', 'group_id', 'group_name', 
            'module', 'module_id', 'module_name', 'module_url',
            'permissions', 'permissions_data'
        ]
        read_only_fields = ['id']
    
    def get_group(self, obj):
        """Devolver información completa del grupo"""
        return {
            'id': obj.group.id,
            'name': obj.group.name,
        }
    
    def get_module(self, obj):
        """Devolver información completa del módulo incluyendo menú"""
        return {
            'id': obj.module.id,
            'name': obj.module.name,
            'url': obj.module.url,
            'description': obj.module.description or '',
            'icon': obj.module.icon or 'MdDescription',
            'is_active': obj.module.is_active,
            'menu': {
                'id': obj.module.menu.id,
                'name': obj.module.menu.name,
                'icon': obj.module.menu.get_icon() if hasattr(obj.module.menu, 'get_icon') else 'MdFolder'
            }
        }
    
    def validate(self, data):
        """Validar que no exista duplicado grupo-módulo"""
        # Obtener group y module (pueden venir de group_id/module_id o de la instancia)
        if self.instance:
            # En actualización, usar valores existentes si no se proporcionan nuevos
            group = data.get('group', self.instance.group)
            module = data.get('module', self.instance.module)
        else:
            # En creación, ambos son requeridos
            group = data.get('group')
            module = data.get('module')
            
            if not group:
                raise serializers.ValidationError({
                    'group_id': 'El grupo es requerido al crear un nuevo registro'
                })
            if not module:
                raise serializers.ValidationError({
                    'module_id': 'El módulo es requerido al crear un nuevo registro'
                })
        
        # Validar duplicados
        queryset = GroupModulePermission.objects.filter(group=group, module=module)
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError({
                'module_id': 'Este módulo ya está asignado a este grupo'
            })
        
        return data
    
    def create(self, validated_data):
        """Crear con manejo de permisos M2M"""
        permissions = validated_data.pop('permissions', [])
        instance = GroupModulePermission.objects.create(**validated_data)
        if permissions:
            instance.permissions.set(permissions)
        return instance
    
    def update(self, instance, validated_data):
        """Actualizar con manejo de permisos M2M"""
        permissions = validated_data.pop('permissions', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar permisos si se proporcionaron
        if permissions is not None:
            instance.permissions.set(permissions)
        
        return instance


class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuarios con validaciones de seguridad"""
    groups_data = GroupSerializer(source='groups', many=True, read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'dni', 'direction', 'phone', 'is_active', 'is_superuser', 
            'date_joined', 'last_login', 'groups', 'groups_data', 'image'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def validate_email(self, value):
        """Validar email: formato y unicidad"""
        if not value:
            raise serializers.ValidationError(_("El email es requerido."))
        
        validate_user_email(value)
        
        if self.instance:
            if User.objects.exclude(id=self.instance.id).filter(email=value).exists():
                raise serializers.ValidationError(_("Ya existe un usuario con este email."))
        else:
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError(_("Ya existe un usuario con este email."))
        return value
    
    def validate_username(self, value):
        """Validar username: formato y unicidad"""
        if not value:
            raise serializers.ValidationError(_("El nombre de usuario es requerido."))
        
        validate_username_format(value)
        
        if self.instance:
            if User.objects.exclude(id=self.instance.id).filter(username=value).exists():
                raise serializers.ValidationError(_("Ya existe un usuario con este nombre de usuario."))
        else:
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError(_("Ya existe un usuario con este nombre de usuario."))
        return value
    
    def validate_dni(self, value):
        """Validar cédula: formato, checksum y unicidad"""
        if not value:
            # La cédula es opcional en el modelo pero si se proporciona, validar
            return value
        
        # Validar formato
        validate_cedula_format(value)
        
        # Validar checksum
        validate_ecuadorian_cedula(value)
        
        # Validar unicidad
        exclude_id = self.instance.id if self.instance else None
        validate_unique_cedula(value, exclude_id=exclude_id)
        
        return value.replace('-', '').replace(' ', '')
    
    def validate_first_name(self, value):
        """Validar nombre"""
        if value:
            validate_user_names(value)
        return value
    
    def validate_last_name(self, value):
        """Validar apellido"""
        if value:
            validate_user_names(value)
        return value
    
    def validate_phone(self, value):
        """Validar teléfono"""
        if value:
            validate_phone_format(value)
        return value
    
    def validate_direction(self, value):
        """Validar dirección contra SQL injection"""
        if value:
            validate_no_sql_injection(value)
            if len(value) > 200:
                raise serializers.ValidationError(_("La dirección no debe exceder 200 caracteres."))
        return value
    
    def validate(self, data):
        """Validaciones a nivel de objeto"""
        # Validar que al menos tenga nombre o apellido
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not first_name and not last_name:
            raise serializers.ValidationError(
                _("Debe proporcionar al menos un nombre o apellido.")
            )
        
        return data
    
    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        groups = validated_data.pop('groups', [])
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        if groups:
            user.groups.set(groups)
        
        return user
    
    def update(self, instance, validated_data):
        """Actualizar usuario"""
        groups = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if groups is not None:
            instance.groups.set(groups)
        
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios con validaciones completas"""
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'dni', 'direction', 'phone',
            'is_active', 'is_superuser', 'groups'
        ]
        read_only_fields = ['id']
    
    def validate_email(self, value):
        """Validar email"""
        if not value:
            raise serializers.ValidationError(_("El email es requerido."))
        validate_user_email(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("Ya existe un usuario con este email."))
        return value
    
    def validate_username(self, value):
        """Validar username"""
        if not value:
            raise serializers.ValidationError(_("El nombre de usuario es requerido."))
        validate_username_format(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(_("Ya existe un usuario con este nombre de usuario."))
        return value
    
    def validate_dni(self, value):
        """Validar cédula"""
        if not value:
            return value
        validate_cedula_format(value)
        validate_ecuadorian_cedula(value)
        validate_unique_cedula(value)
        return value.replace('-', '').replace(' ', '')
    
    def validate_first_name(self, value):
        """Validar nombre"""
        if value:
            validate_user_names(value)
        return value
    
    def validate_last_name(self, value):
        """Validar apellido"""
        if value:
            validate_user_names(value)
        return value
    
    def validate_phone(self, value):
        """Validar teléfono"""
        if value:
            validate_phone_format(value)
        return value
    
    def validate_direction(self, value):
        """Validar dirección"""
        if value:
            validate_no_sql_injection(value)
            if len(value) > 200:
                raise serializers.ValidationError(_("La dirección no debe exceder 200 caracteres."))
        return value
    
    def validate_password(self, value):
        """Validar contraseña"""
        if len(value) < 6:
            raise serializers.ValidationError(_("La contraseña debe tener al menos 6 caracteres."))
        # Validar que contenga números y letras
        has_numbers = any(c.isdigit() for c in value)
        has_letters = any(c.isalpha() for c in value)
        if not (has_numbers and has_letters):
            raise serializers.ValidationError(
                _("La contraseña debe contener números y letras.")
            )
        return value
    
    def validate(self, data):
        """Validaciones a nivel de objeto"""
        # Validar coincidencia de contraseñas
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": _("Las contraseñas no coinciden.")}
            )
        
        # Validar que al menos tenga nombre o apellido
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not first_name and not last_name:
            raise serializers.ValidationError(
                _("Debe proporcionar al menos un nombre o apellido.")
            )
        
        return data
    
    def create(self, validated_data):
        """Crear usuario"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        groups = validated_data.pop('groups', [])
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        if groups:
            user.groups.set(groups)
        
        return user


class AuditUserSerializer(serializers.ModelSerializer):
    """Serializer para auditoría de usuarios"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = AuditUser
        fields = [
            'id', 'usuario', 'usuario_nombre', 'usuario_username',
            'tabla', 'registroid', 'accion', 'accion_display',
            'fecha', 'hora', 'estacion'
        ]
        read_only_fields = ['id', 'fecha', 'hora']
