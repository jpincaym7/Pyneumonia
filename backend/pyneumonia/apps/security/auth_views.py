"""
Vistas de autenticación para Next.js
Endpoints: login, logout, register, me, change_group
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Group
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from apps.security.models import User
from apps.security.instance.group_permission import GroupPermission
from apps.security.instance.menu_module import MenuModule


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token_view(request):
    """
    Obtener token CSRF
    GET /security/csrf/
    
    Response:
        {
            "csrfToken": "token_value"
        }
    """
    return Response({
        'csrfToken': get_token(request)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login de usuario
    POST /security/auth/login/
    
    Body:
        {
            "email": "user@example.com",  // o "username": "usuario"
            "password": "contraseña"
        }
    
    Response:
        {
            "user": {
                "id": 1,
                "username": "usuario",
                "email": "user@example.com",
                "first_name": "Nombre",
                "last_name": "Apellido",
                "is_superuser": false
            },
            "permissions": {
                "view_user": "view_user",
                ...
            },
            "group": {
                "id": 1,
                "name": "Grupo"
            },
            "message": "Inicio de sesión exitoso"
        }
    """
    # Acepta tanto email como username
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Priorizar email (que es el USERNAME_FIELD del modelo)
    login_field = email if email else username
    
    if not login_field or not password:
        return Response(
            {"error": "Se requiere email (o username) y password"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Autenticar usuario por email (USERNAME_FIELD)
    user = authenticate(request, username=login_field, password=password)
    
    if user is None:
        return Response(
            {"error": "Credenciales inválidas"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {"error": "Usuario inactivo"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Iniciar sesión
    login(request, user)
    
    # Configurar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    
    # Obtener grupo activo
    group_data = None
    if 'group_id' in request.session:
        try:
            group = user.groups.get(id=request.session['group_id'])
            group_data = {
                'id': group.id,
                'name': group.name
            }
        except Group.DoesNotExist:
            pass
    
    # Obtener permisos
    permissions = GroupPermission.get_permission_dict_of_group(user)
    
    # Datos del usuario
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip(),
        'dni': user.dni,
        'phone': user.phone,
        'direction': user.direction,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'date_joined': user.date_joined,
    }
    
    return Response({
        'user': user_data,
        'permissions': permissions,
        'group': group_data,
        'message': 'Inicio de sesión exitoso'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout de usuario
    POST /security/auth/logout/
    
    Response:
        {
            "message": "Sesión cerrada exitosamente"
        }
    """
    logout(request)
    return Response({
        'message': 'Sesión cerrada exitosamente'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Obtener información del usuario autenticado
    GET /security/auth/me/
    
    Response:
        {
            "user": {
                "id": 1,
                "username": "usuario",
                ...
            },
            "permissions": {...},
            "group": {...},
            "groups": [...]
        }
    """
    user = request.user
    
    # Asegurar grupo en sesión
    if hasattr(user, 'set_group_session'):
        user.set_group_session()
    
    # Obtener grupo activo
    group_data = None
    if 'group_id' in request.session:
        try:
            group = user.groups.get(id=request.session['group_id'])
            group_data = {
                'id': group.id,
                'name': group.name
            }
        except Group.DoesNotExist:
            pass
    
    # Obtener todos los grupos del usuario
    groups_data = [
        {'id': g.id, 'name': g.name}
        for g in user.groups.all()
    ]
    
    # Obtener permisos
    permissions = GroupPermission.get_permission_dict_of_group(user)
    
    # Datos del usuario con todos los campos
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip(),
        'dni': user.dni,
        'phone': user.phone,
        'direction': user.direction,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'date_joined': user.date_joined,
    }
    
    return Response({
        'user': user_data,
        'permissions': permissions,
        'group': group_data,
        'groups': groups_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registrar nuevo usuario
    POST /security/auth/register/
    
    Body:
        {
            "username": "usuario",
            "email": "user@example.com",
            "password": "contraseña",
            "first_name": "Nombre",
            "last_name": "Apellido"
        }
    
    Response:
        {
            "user": {...},
            "message": "Usuario registrado exitosamente"
        }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response(
            {"error": "Se requieren username, email y password"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar si el usuario ya existe
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "El nombre de usuario ya existe"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "El email ya está registrado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear usuario
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }
    
    return Response({
        'user': user_data,
        'message': 'Usuario registrado exitosamente'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_group_view(request):
    """
    Cambiar grupo activo del usuario
    POST /security/auth/change_group/
    
    Body:
        {
            "group_id": 1
        }
    
    Response:
        {
            "group": {...},
            "permissions": {...},
            "message": "Grupo cambiado exitosamente"
        }
    """
    group_id = request.data.get('group_id')
    
    if not group_id:
        return Response(
            {"error": "Se requiere group_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Verificar que el usuario pertenece al grupo
    try:
        group = user.groups.get(id=group_id)
    except Group.DoesNotExist:
        return Response(
            {"error": "El usuario no pertenece a este grupo"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Actualizar sesión - Solo guardar el ID, no el objeto
    request.session['group_id'] = group.id
    request.session.modified = True
    
    # Obtener nuevos permisos
    permissions = GroupPermission.get_permission_dict_of_group(user)
    
    group_data = {
        'id': group.id,
        'name': group.name
    }
    
    return Response({
        'group': group_data,
        'permissions': permissions,
        'message': 'Grupo cambiado exitosamente'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Cambiar contraseña del usuario
    POST /security/auth/change_password/
    
    Body:
        {
            "old_password": "contraseña_actual",
            "new_password": "contraseña_nueva"
        }
    
    Response:
        {
            "message": "Contraseña actualizada exitosamente"
        }
    """
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {"error": "Se requieren old_password y new_password"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Verificar contraseña actual
    if not user.check_password(old_password):
        return Response(
            {"error": "Contraseña actual incorrecta"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cambiar contraseña
    user.set_password(new_password)
    user.save()
    
    # Actualizar sesión para que no se cierre
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, user)
    
    return Response({
        'message': 'Contraseña actualizada exitosamente'
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Obtener o actualizar perfil del usuario
    GET /security/auth/profile/
    PATCH /security/auth/profile/
    
    Body (PATCH):
        {
            "first_name": "Nombre",
            "last_name": "Apellido",
            "email": "nuevo@email.com",
            "dni": "0123456789",
            "phone": "0987654321",
            "direction": "Av. Principal 123"
        }
    
    Response:
        {
            "id": 1,
            "username": "usuario",
            "email": "user@example.com",
            "first_name": "Nombre",
            "last_name": "Apellido",
            "full_name": "Nombre Apellido",
            "dni": "0123456789",
            "phone": "0987654321",
            "direction": "Av. Principal 123",
            "is_superuser": false,
            "date_joined": "2025-01-01T00:00:00Z"
        }
    """
    user = request.user
    
    if request.method == 'GET':
        # Obtener perfil
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip(),
            'dni': user.dni,
            'phone': user.phone,
            'direction': user.direction,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
        }
        return Response(user_data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Actualizar perfil
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        dni = request.data.get('dni')
        phone = request.data.get('phone')
        direction = request.data.get('direction')
        
        # Validar email único
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response(
                    {"error": "El email ya está en uso por otro usuario"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar DNI único (si se proporciona)
        if dni and dni != user.dni:
            if User.objects.filter(dni=dni).exclude(id=user.id).exists():
                return Response(
                    {"error": "La cédula/RUC ya está en uso por otro usuario"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Actualizar campos
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email is not None:
            user.email = email
        if dni is not None:
            user.dni = dni
        if phone is not None:
            user.phone = phone
        if direction is not None:
            user.direction = direction
        
        user.save()
        
        # Retornar datos actualizados
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip(),
            'dni': user.dni,
            'phone': user.phone,
            'direction': user.direction,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
        }
        
        return Response(user_data, status=status.HTTP_200_OK)

