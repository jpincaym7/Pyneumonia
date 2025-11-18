"""
Vistas API para verificación de permisos
Compatible con Next.js frontend
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from apps.security.models import GroupModulePermission, Module
from apps.security.instance.group_permission import GroupPermission
from apps.security.instance.menu_module import MenuModule
from django.contrib.auth.models import Group
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_group_view(request):
    """
    Devuelve el grupo activo del usuario autenticado
    Respuesta: { "group": "Medico" }
    """
    user = request.user
    # Asegura que el grupo esté en sesión
    if hasattr(user, "set_group_session"):
        user.set_group_session()
    group_name = None
    if "group_id" in request.session:
        try:
            group = Group.objects.get(pk=request.session["group_id"])
            group_name = group.name
        except Group.DoesNotExist:
            group_name = None
    return Response({"group": group_name})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_module_permission(request):
    """
    Endpoint para verificar si el usuario tiene acceso a un módulo
    
    Query params:
        - module_url: URL del módulo a verificar
    
    Retorna:
        {
            "has_permission": true/false,
            "message": "Mensaje descriptivo"
        }
    """
    module_url = request.query_params.get('module_url')
    
    if not module_url:
        return Response(
            {
                "has_permission": False,
                "message": "Debe proporcionar la URL del módulo"
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Superusuarios tienen acceso total
    if user.is_superuser:
        return Response({
            "has_permission": True,
            "message": "Acceso concedido (superusuario)"
        })
    
    # Verificar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    
    if 'group_id' not in request.session:
        return Response(
            {
                "has_permission": False,
                "message": "No tiene un grupo activo"
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Obtener grupo
    group = user.get_group_session()
    
    # Verificar acceso al módulo
    has_access = GroupModulePermission.objects.filter(
        group=group,
        module__url=module_url
    ).exists()
    
    if has_access:
        return Response({
            "has_permission": True,
            "message": "Acceso concedido"
        })
    else:
        return Response(
            {
                "has_permission": False,
                "message": "No tiene permisos para acceder a este módulo"
            },
            status=status.HTTP_403_FORBIDDEN
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_group(request):
    """
    Endpoint para obtener el grupo actual del usuario autenticado
    Retorna:
        {
            "group_id": <id>,
            "group_name": <nombre>,
            "is_radiologist": true/false
        }
    """
    user = request.user
    # Asegurar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    if 'group_id' not in request.session:
        return Response(
            {"error": "No tiene un grupo activo"},
            status=status.HTTP_400_BAD_REQUEST
        )
    group = user.get_group_session()
    # Determinar si el grupo es de radiología (ajusta el nombre según tu modelo)
    is_radiologist = getattr(group, 'name', '').lower() in ['radiología', 'radiologia', 'radiologos', 'radiologist']
    return Response({
        "group_id": group.id,
        "group_name": getattr(group, 'name', ''),
        "is_radiologist": is_radiologist
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permission(request):
    """
    Endpoint para verificar si el usuario tiene un permiso específico
    
    Query params:
        - codename: Código del permiso (ej: 'view_user', 'add_module')
    
    Retorna:
        {
            "has_permission": true/false,
            "codename": "view_user"
        }
    """
    codename = request.query_params.get('codename')
    
    if not codename:
        return Response(
            {
                "has_permission": False,
                "message": "Debe proporcionar el código del permiso"
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Superusuarios tienen todos los permisos
    if user.is_superuser:
        return Response({
            "has_permission": True,
            "codename": codename
        })
    
    # Obtener permisos del usuario
    permissions = GroupPermission.get_permission_dict_of_group(user)
    has_permission = codename in permissions
    
    return Response({
        "has_permission": has_permission,
        "codename": codename
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions(request):
    """
    Endpoint para obtener todos los permisos del usuario actual
    
    Retorna:
        {
            "permissions": {
                "view_user": "view_user",
                "add_user": "add_user",
                ...
            },
            "is_superuser": true/false
        }
    """
    user = request.user
    
    permissions = GroupPermission.get_permission_dict_of_group(user)
    
    return Response({
        "permissions": permissions,
        "is_superuser": user.is_superuser
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_menus(request):
    """
    Endpoint para obtener los menús y módulos del usuario
    
    Retorna:
        [
            {
                "menu": {
                    "id": 1,
                    "name": "Seguridad",
                    "icon": "security",
                    ...
                },
                "modules": [
                    {
                        "id": 1,
                        "name": "Usuarios",
                        "url": "/dashboard/users",
                        ...
                    },
                    ...
                ]
            },
            ...
        ]
    """
    user = request.user
    
    # Asegurar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    
    if 'group_id' not in request.session:
        return Response(
            {"error": "No tiene un grupo activo"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Obtener menús usando la clase MenuModule
    context = {}
    menu_module = MenuModule(request)
    menu_module.fill(context)
    
    menu_list = context.get('menu_list', [])
    
    # Formatear respuesta para Next.js
    formatted_menus = []
    for menu_data in menu_list:
        menu = menu_data.get('menu')
        group_module_permissions = menu_data.get('group_module_permission_list', [])
        
        # Usar un set para evitar módulos duplicados
        seen_modules = set()
        modules = []
        for gmp in group_module_permissions:
            module = gmp.module
            # Solo agregar si no hemos visto este módulo antes
            if module.id not in seen_modules:
                seen_modules.add(module.id)
                modules.append({
                    'id': module.id,
                    'name': module.name,
                    'url': module.url,
                    'icon': getattr(module, 'icon', 'MdViewModule'),
                    'description': getattr(module, 'description', ''),
                })
        
        formatted_menus.append({
            'menu': {
                'id': menu.id,
                'name': menu.name,
                'icon': getattr(menu, 'icon', 'MdFolder'),
                'order': getattr(menu, 'order', 0),
            },
            'modules': modules
        })
    
    return Response(formatted_menus)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_modules(request):
    """
    Endpoint para obtener solo los módulos del usuario (sin agrupar por menú)
    
    Retorna:
        [
            {
                "id": 1,
                "name": "Usuarios",
                "url": "/dashboard/users",
                "menu_name": "Seguridad",
                ...
            },
            ...
        ]
    """
    user = request.user
    
    # Asegurar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    
    if 'group_id' not in request.session:
        return Response(
            {"error": "No tiene un grupo activo"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    group = user.get_group_session()
    
    # Obtener módulos del grupo
    group_module_permissions = GroupModulePermission.get_group_module_permission_active_list(
        group.id
    ).select_related('module', 'module__menu')
    
    modules = []
    for gmp in group_module_permissions:
        module = gmp.module
        modules.append({
            'id': module.id,
            'name': module.name,
            'url': module.url,
            'icon': getattr(module, 'icon', None),
            'description': getattr(module, 'description', ''),
            'menu_id': module.menu.id if module.menu else None,
            'menu_name': module.menu.name if module.menu else None,
        })
    
    return Response(modules)
