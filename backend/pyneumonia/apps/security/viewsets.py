from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import Group, Permission
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils.translation import gettext_lazy as _

from apps.security.models import User, Menu, Module, GroupModulePermission, AuditUser
from apps.security.serializers import (
    UserSerializer, UserCreateSerializer, MenuSerializer, ModuleSerializer,
    GroupSerializer, GroupModulePermissionSerializer, PermissionSerializer,
    AuditUserSerializer
)
from apps.security.mixins.api_mixins import ActionPermissionMixin
from apps.security.decorators import add_permissions_to_response
from apps.security.validators import validate_ecuadorian_cedula, validate_no_sql_injection


class MenuViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar menús
    """
    queryset = Menu.objects.all().order_by('name')
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name']
    
    permission_map = {
        'list': 'view_menu',
        'retrieve': 'view_menu',
        'create': 'add_menu',
        'update': 'change_menu',
        'partial_update': 'change_menu',
        'destroy': 'delete_menu',
    }


class ModuleViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar módulos
    """
    queryset = Module.objects.all().select_related('menu').prefetch_related('permissions')
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'menu']
    search_fields = ['name', 'url', 'description']
    ordering_fields = ['id', 'name', 'url']
    ordering = ['-id']
    
    permission_map = {
        'list': 'view_module',
        'retrieve': 'view_module',
        'create': 'add_module',
        'update': 'change_module',
        'partial_update': 'change_module',
        'destroy': 'delete_module',
        'toggle_active': 'change_module',
        'permissions': 'view_module',
    }
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Alternar estado activo/inactivo del módulo
        POST /modules/{id}/toggle_active/
        """
        module = self.get_object()
        module.is_active = not module.is_active
        module.save()
        
        return Response({
            'id': module.id,
            'is_active': module.is_active,
            'message': f'Módulo {"activado" if module.is_active else "desactivado"} exitosamente'
        })
    
    @action(detail=False, methods=['get'])
    def permissions(self, request):
        """
        Obtener todos los permisos disponibles
        GET /modules/permissions/
        """
        permissions = Permission.objects.all().order_by('content_type__app_label', 'codename')
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)


class GroupViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar grupos
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name']
    
    permission_map = {
        'list': 'view_group',
        'retrieve': 'view_group',
        'create': 'add_group',
        'update': 'change_group',
        'partial_update': 'change_group',
        'destroy': 'delete_group',
        'users': 'view_group',
        'modules': 'view_group',
    }
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """
        Obtener usuarios del grupo
        GET /groups/{id}/users/
        """
        group = self.get_object()
        users = group.user_set.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        """
        Obtener módulos del grupo
        GET /groups/{id}/modules/
        """
        group = self.get_object()
        group_permissions = GroupModulePermission.objects.filter(
            group=group
        ).select_related('module', 'group').prefetch_related('permissions')
        serializer = GroupModulePermissionSerializer(group_permissions, many=True)
        return Response(serializer.data)


class GroupModulePermissionViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar permisos de grupo-módulo
    """
    queryset = GroupModulePermission.objects.select_related(
        'group', 'module', 'module__menu'
    ).prefetch_related('permissions').all()
    serializer_class = GroupModulePermissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['group', 'module']

    permission_map = {
        'list': 'view_groupmodulepermission',
        'retrieve': 'view_groupmodulepermission',
        'create': 'add_groupmodulepermission',
        'update': 'change_groupmodulepermission',
        'partial_update': 'change_groupmodulepermission',
        'destroy': 'delete_groupmodulepermission',
        'by_group': 'view_groupmodulepermission',
        'bulk_create': 'add_groupmodulepermission',
    }

    def get_queryset(self):
        """Filtrar por query params"""
        queryset = super().get_queryset()
        group_id = self.request.query_params.get('group')
        module_id = self.request.query_params.get('module')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='by_group')
    def by_group(self, request):
        """Obtener permisos por grupo"""
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response(
                {'error': 'group_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(group_id=group_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        """Crear múltiples permisos de grupo-módulo"""
        from django.db import transaction
        group_id = request.data.get('group_id')
        modules = request.data.get('modules', [])
        if not group_id or not modules:
            return Response(
                {'error': 'group_id y modules son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        created_count = 0
        errors = []
        with transaction.atomic():
            for module_data in modules:
                try:
                    exists = GroupModulePermission.objects.filter(
                        group_id=group_id,
                        module_id=module_data['module_id']
                    ).exists()
                    if exists:
                        errors.append(
                            f"Módulo {module_data['module_id']} ya está asignado"
                        )
                        continue
                    serializer = self.get_serializer(data={
                        'group': group_id,
                        'module': module_data['module_id'],
                        'permissions': module_data.get('permissions', [])
                    })
                    if serializer.is_valid():
                        serializer.save()
                        created_count += 1
                    else:
                        errors.append(str(serializer.errors))
                except Exception as e:
                    errors.append(str(e))
        response_data = {
            'message': f'Se crearon {created_count} registros',
            'created': created_count
        }
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status.HTTP_201_CREATED)


class UserViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar usuarios con validaciones de seguridad
    Valida: cédula, email, username, teléfono, nombres
    """
    queryset = User.objects.all().prefetch_related('groups').order_by('-date_joined')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_superuser', 'groups']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'dni']
    ordering_fields = ['id', 'username', 'email', 'date_joined']
    ordering = ['-date_joined']
    
    permission_map = {
        'list': 'view_user',
        'retrieve': 'view_user',
        'create': 'add_user',
        'update': 'change_user',
        'partial_update': 'change_user',
        'destroy': 'delete_user',
        'change_password': 'change_user',
        'toggle_active': 'change_user',
        'validate_cedula': 'add_user',
    }
    
    def get_serializer_class(self):
        """Usar serializer diferente para creación"""
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear usuario con validaciones"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Actualizar usuario con validaciones"""
        try:
            # Prevenir cambios de contraseña por PUT (usar change_password en su lugar)
            if 'password' in request.data:
                return Response(
                    {'error': _('Use el endpoint change_password para cambiar la contraseña.')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def validate_cedula(self, request):
        """
        Validar cédula sin crear usuario
        POST /users/validate_cedula/
        Body: {"dni": "1234567890"}
        """
        dni = request.data.get('dni', '').strip()
        
        if not dni:
            return Response(
                {'valid': False, 'error': _('La cédula no puede estar vacía.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validar formato
            cedula_limpia = dni.replace('-', '').replace(' ', '')
            
            if not cedula_limpia.isdigit():
                return Response({
                    'valid': False,
                    'error': _('La cédula debe contener solo números.')
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(cedula_limpia) != 10:
                return Response({
                    'valid': False,
                    'error': _('La cédula debe tener exactamente 10 dígitos.')
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar checksum
            validate_ecuadorian_cedula(cedula_limpia)
            
            # Validar unicidad
            if User.objects.filter(dni=cedula_limpia).exists():
                return Response({
                    'valid': False,
                    'error': _('Ya existe un usuario registrado con esta cédula.')
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'valid': True,
                'message': _('Cédula válida.'),
                'dni': cedula_limpia
            })
        
        except Exception as e:
            return Response({
                'valid': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """
        Cambiar contraseña de un usuario
        POST /users/{id}/change_password/
        
        Body:
            {
                "new_password": "nueva_contraseña",
                "new_password_confirm": "nueva_contraseña"
            }
        """
        user = self.get_object()
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        if not new_password or not new_password_confirm:
            return Response(
                {'error': _('Se requieren new_password y new_password_confirm.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != new_password_confirm:
            return Response(
                {'error': _('Las contraseñas no coinciden.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': _('La contraseña debe tener al menos 6 caracteres.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que contenga números y letras
        has_numbers = any(c.isdigit() for c in new_password)
        has_letters = any(c.isalpha() for c in new_password)
        
        if not (has_numbers and has_letters):
            return Response(
                {'error': _('La contraseña debe contener números y letras.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': _('Contraseña actualizada exitosamente.')
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Alternar estado activo/inactivo del usuario
        POST /users/{id}/toggle_active/
        """
        user = self.get_object()
        
        # No permitir desactivar al propio usuario
        if user.id == request.user.id:
            return Response(
                {'error': _('No puedes desactivar tu propia cuenta.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'id': user.id,
            'is_active': user.is_active,
            'message': _('Usuario %(action)s exitosamente.') % {
                'action': _('activado') if user.is_active else _('desactivado')
            }
        })
    
    def destroy(self, request, *args, **kwargs):
        """No permitir eliminar al propio usuario"""
        user = self.get_object()
        
        if user.id == request.user.id:
            return Response(
                {'error': _('No puedes eliminar tu propia cuenta.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para permisos
    """
    queryset = Permission.objects.all().select_related('content_type').order_by(
        'content_type__app_label', 'codename'
    )
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'codename']


class AuditUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para auditoría de usuarios
    Permite consultar el registro de acciones de usuarios
    """
    queryset = AuditUser.objects.all().select_related('usuario').order_by('-fecha', '-hora')
    serializer_class = AuditUserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['usuario', 'tabla', 'accion', 'fecha']
    search_fields = ['usuario__username', 'usuario__first_name', 'usuario__last_name', 'tabla', 'estacion']
    ordering_fields = ['id', 'fecha', 'hora', 'tabla', 'accion']
    ordering = ['-fecha', '-hora']
