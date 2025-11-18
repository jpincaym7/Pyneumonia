"""
URLs del módulo de seguridad
Endpoints para autenticación y permisos - Compatible con Next.js
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views, auth_views
from .viewsets import (
    MenuViewSet, ModuleViewSet, GroupViewSet, 
    GroupModulePermissionViewSet, UserViewSet, PermissionViewSet,
    AuditUserViewSet
)

app_name = 'security'

# Router para ViewSets
router = DefaultRouter()
router.register(r'menus', MenuViewSet, basename='menu')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'group-module-permissions', GroupModulePermissionViewSet, basename='groupmodulepermission')
router.register(r'users', UserViewSet, basename='user')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'audit', AuditUserViewSet, basename='audituser')

urlpatterns = [
    # Endpoint CSRF
    path('csrf/', auth_views.csrf_token_view, name='csrf'),
    
    # Endpoints de autenticación
    path('auth/login/', auth_views.login_view, name='login'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/register/', auth_views.register_view, name='register'),
    path('auth/me/', auth_views.me_view, name='me'),
    path('auth/change_group/', auth_views.change_group_view, name='change_group'),
    path('auth/change_password/', auth_views.change_password_view, name='change_password'),
    path('auth/profile/', auth_views.profile_view, name='profile'),
    
    # Endpoints de verificación de permisos
    path('check-module-permission/', api_views.check_module_permission, name='check_module_permission'),
    path('auth/check_permission/', api_views.check_permission, name='check_permission'),
    # Endpoint para obtener el grupo activo del usuario
    path('user-group/', api_views.user_group_view, name='user_group'),
    path('auth/user_permissions/', api_views.user_permissions, name='user_permissions'),
    
    # Endpoints de menús y módulos
    path('menus/user_menus/', api_views.user_menus, name='user_menus'),
    path('modules/user_modules/', api_views.user_modules, name='user_modules'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
]
