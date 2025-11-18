"""
Decoradores para verificación de permisos en vistas de API REST
Compatible con Next.js frontend
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from apps.security.instance.group_permission import GroupPermission


def require_permission(*permissions):
    """
    Decorador para verificar permisos en vistas de API
    
    Uso:
        @require_permission('view_user')
        @api_view(['GET'])
        def user_list(request):
            ...
        
        @require_permission('view_user', 'add_user')
        @api_view(['GET', 'POST'])
        def user_operations(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Verificar autenticación
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Debe iniciar sesión para acceder a este recurso"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user = request.user
            
            # Asegurar grupo en sesión
            if hasattr(user, 'set_group_session'):
                user.set_group_session()
            
            # Superusuarios tienen acceso total
            if user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Si no hay permisos requeridos, permitir
            if not permissions:
                return view_func(request, *args, **kwargs)
            
            # Verificar group_id en sesión
            if not hasattr(request, 'session') or 'group_id' not in request.session:
                return Response(
                    {"error": "No tiene un grupo activo"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener grupo
            group = user.get_group_session()
            
            # Verificar permisos
            has_permission = group.groupmodulepermission_set.filter(
                permissions__codename__in=permissions
            ).exists()
            
            if not has_permission:
                return Response(
                    {"error": "No tiene permiso para acceder a este recurso"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


def require_module_access(module_url):
    """
    Decorador para verificar acceso a un módulo específico
    
    Uso:
        @require_module_access('/dashboard/users')
        @api_view(['GET'])
        def users_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Verificar autenticación
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Debe iniciar sesión"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user = request.user
            
            # Superusuarios tienen acceso total
            if user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Verificar si el usuario tiene el módulo
            from apps.security.models import GroupModulePermission
            
            if hasattr(user, 'set_group_session'):
                user.set_group_session()
            
            if 'group_id' not in request.session:
                return Response(
                    {"error": "No tiene un grupo activo"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            group = user.get_group_session()
            
            # Verificar si el grupo tiene acceso al módulo
            has_access = GroupModulePermission.objects.filter(
                group=group,
                module__url=module_url
            ).exists()
            
            if not has_access:
                return Response(
                    {"error": f"No tiene acceso al módulo {module_url}"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


def add_permissions_to_response(view_func):
    """
    Decorador para añadir permisos del usuario a la respuesta
    
    Uso:
        @add_permissions_to_response
        @api_view(['GET'])
        def my_view(request):
            return Response({"data": "some data"})
        
        # La respuesta incluirá: {"data": "some data", "permissions": {...}}
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)
        
        # Solo añadir permisos si la respuesta es exitosa y tiene data
        if (isinstance(response, Response) and 
            status.is_success(response.status_code) and
            isinstance(response.data, dict)):
            
            if request.user.is_authenticated:
                permissions = GroupPermission.get_permission_dict_of_group(request.user)
                response.data['permissions'] = permissions
        
        return response
    
    return wrapped_view
