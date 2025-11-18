"""
Mixins para APIs REST con Next.js
Proporciona funcionalidad de permisos para ViewSets de Django REST Framework
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.security.instance.group_permission import GroupPermission


class PermissionMixin:
    """
    Mixin para verificar permisos en ViewSets de DRF
    Uso: Añadir como primer mixin en la clase del ViewSet
    
    Ejemplo:
        class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
            permission_required = 'view_user'
            # o múltiples permisos
            permission_required = ['view_user', 'add_user']
    """
    permission_required = ''
    permission_classes = [IsAuthenticated]
    
    def get_permissions_to_validate(self):
        """Obtiene los permisos que necesitan validación"""
        if self.permission_required == '':
            return ()
        
        if isinstance(self.permission_required, str):
            return (self.permission_required,)
        
        return tuple(self.permission_required)
    
    def check_permissions(self, request):
        """Verifica permisos del usuario para acceder al endpoint"""
        # Llamar al método padre para verificar IsAuthenticated
        super().check_permissions(request)
        
        user = request.user
        
        # Asegurar que el usuario tenga grupo en sesión
        if hasattr(user, 'set_group_session'):
            user.set_group_session()
        
        # Superusuarios tienen acceso total
        if user.is_superuser:
            return
        
        # Obtener permisos a validar
        permissions = self.get_permissions_to_validate()
        
        # Si no hay permisos requeridos, permitir acceso
        if not len(permissions):
            return
        
        # Verificar si existe group_id en sesión
        if not hasattr(request, 'session') or 'group_id' not in request.session:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                detail="No tiene un grupo activo. Por favor, seleccione un grupo."
            )
        
        # Obtener grupo del usuario
        group = user.get_group_session()
        
        # Verificar si el grupo tiene los permisos requeridos
        has_permission = group.groupmodulepermission_set.filter(
            permissions__codename__in=permissions
        ).exists()
        
        if not has_permission:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                detail="No tiene permiso para acceder a este módulo"
            )


class ListPermissionMixin(PermissionMixin):
    """
    Mixin para operaciones LIST de DRF
    Añade información de permisos al contexto de la respuesta
    """
    
    def list(self, request, *args, **kwargs):
        """Override del método list para añadir permisos"""
        response = super().list(request, *args, **kwargs)
        
        # Añadir permisos al response
        if isinstance(response.data, dict):
            response.data['permissions'] = self._get_permission_dict_of_group(request.user)
        
        return response
    
    def _get_permission_dict_of_group(self, user):
        """Obtiene diccionario de permisos del grupo del usuario"""
        return GroupPermission.get_permission_dict_of_group(user)


class CreatePermissionMixin(PermissionMixin):
    """
    Mixin para operaciones CREATE de DRF
    Verifica permisos antes de crear
    """
    
    def create(self, request, *args, **kwargs):
        """Override del método create para verificar permisos"""
        # Los permisos ya se verificaron en check_permissions
        return super().create(request, *args, **kwargs)


class UpdatePermissionMixin(PermissionMixin):
    """
    Mixin para operaciones UPDATE/PATCH de DRF
    Verifica permisos antes de actualizar
    """
    
    def update(self, request, *args, **kwargs):
        """Override del método update para verificar permisos"""
        # Los permisos ya se verificaron en check_permissions
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Override del método partial_update para verificar permisos"""
        # Los permisos ya se verificaron en check_permissions
        return super().partial_update(request, *args, **kwargs)


class DeletePermissionMixin(PermissionMixin):
    """
    Mixin para operaciones DELETE de DRF
    Verifica permisos antes de eliminar
    """
    
    def destroy(self, request, *args, **kwargs):
        """Override del método destroy para verificar permisos"""
        # Los permisos ya se verificaron en check_permissions
        return super().destroy(request, *args, **kwargs)


class FullPermissionMixin(
    ListPermissionMixin,
    CreatePermissionMixin,
    UpdatePermissionMixin,
    DeletePermissionMixin
):
    """
    Mixin completo que incluye todas las operaciones CRUD con permisos
    
    Uso:
        class UserViewSet(FullPermissionMixin, viewsets.ModelViewSet):
            permission_required = ['view_user', 'add_user', 'change_user', 'delete_user']
            queryset = User.objects.all()
            serializer_class = UserSerializer
    """
    pass


class ActionPermissionMixin(PermissionMixin):
    """
    Mixin para definir permisos diferentes según la acción
    
    Uso:
        class UserViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
            permission_map = {
                'list': 'view_user',
                'retrieve': 'view_user',
                'create': 'add_user',
                'update': 'change_user',
                'partial_update': 'change_user',
                'destroy': 'delete_user',
                'custom_action': 'custom_permission',
            }
    """
    permission_map = {}
    
    def get_permissions_to_validate(self):
        """Obtiene permisos según la acción actual"""
        action = getattr(self, 'action', None)
        
        if action and action in self.permission_map:
            permission = self.permission_map[action]
            if isinstance(permission, str):
                return (permission,)
            return tuple(permission)
        
        # Fallback al comportamiento por defecto
        return super().get_permissions_to_validate()
