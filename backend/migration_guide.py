"""
Script helper para migrar vistas Django a ViewSets de DRF
Guía paso a paso para convertir vistas tradicionales a APIs REST
"""

# ==============================================================================
# GUÍA DE MIGRACIÓN: Vistas Django → ViewSets DRF
# ==============================================================================

"""
PASO 1: Identificar qué vistas tienes
--------------------------------------

ANTES (Django Templates):
    - ListView, DetailView, CreateView, UpdateView, DeleteView
    - Usan mixins de apps.security.mixins.mixins
    - Renderizan templates HTML
    - Retornan HttpResponse

DESPUÉS (API REST):
    - viewsets.ModelViewSet
    - Usan mixins de apps.security.mixins.api_mixins
    - Retornan JSON
    - Trabajan con serializers
"""

# ==============================================================================
# EJEMPLO 1: ListView → ViewSet.list()
# ==============================================================================

# ❌ ANTES (views.py)
"""
from django.views.generic import ListView
from apps.security.mixins.mixins import PermissionMixin, ListViewMixin

class UserListView(PermissionMixin, ListViewMixin, ListView):
    model = User
    permission_required = 'view_user'
    template_name = 'users/list.html'
    context_object_name = 'users'
    paginate_by = 10
"""

# ✅ DESPUÉS (views.py)
"""
from rest_framework import viewsets
from apps.security.mixins.api_mixins import PermissionMixin
from .models import User
from .serializers import UserSerializer

class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = 'view_user'
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # Paginación se configura en settings.py:
    # REST_FRAMEWORK = {
    #     'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    #     'PAGE_SIZE': 10
    # }
"""

# Crear serializer (serializers.py):
"""
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']
"""

# ==============================================================================
# EJEMPLO 2: CreateView → ViewSet.create()
# ==============================================================================

# ❌ ANTES
"""
from django.views.generic import CreateView
from apps.security.mixins.mixins import PermissionMixin, CreateViewMixin

class UserCreateView(PermissionMixin, CreateViewMixin, CreateView):
    model = User
    permission_required = 'add_user'
    fields = ['username', 'email', 'first_name', 'last_name']
    template_name = 'users/form.html'
    success_url = '/users/'
"""

# ✅ DESPUÉS - Ya incluido en ModelViewSet
"""
class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = 'add_user'  # Verificado automáticamente en create()
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # Si necesitas lógica personalizada:
    def perform_create(self, serializer):
        # Lógica adicional antes de guardar
        serializer.save(created_by=self.request.user)
"""

# ==============================================================================
# EJEMPLO 3: UpdateView → ViewSet.update()
# ==============================================================================

# ❌ ANTES
"""
class UserUpdateView(PermissionMixin, UpdateViewMixin, UpdateView):
    model = User
    permission_required = 'change_user'
    fields = ['email', 'first_name', 'last_name']
    template_name = 'users/form.html'
    success_url = '/users/'
"""

# ✅ DESPUÉS - Ya incluido en ModelViewSet
"""
class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = 'change_user'
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # Si necesitas lógica personalizada:
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
"""

# ==============================================================================
# EJEMPLO 4: DeleteView → ViewSet.destroy()
# ==============================================================================

# ❌ ANTES
"""
class UserDeleteView(PermissionMixin, DeleteViewMixin, DeleteView):
    model = User
    permission_required = 'delete_user'
    template_name = 'users/confirm_delete.html'
    success_url = '/users/'
"""

# ✅ DESPUÉS - Ya incluido en ModelViewSet
"""
class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = 'delete_user'
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # Si necesitas lógica personalizada:
    def perform_destroy(self, instance):
        # Soft delete en lugar de eliminar
        instance.is_active = False
        instance.save()
"""

# ==============================================================================
# EJEMPLO 5: Múltiples Vistas → Un Solo ViewSet
# ==============================================================================

# ❌ ANTES (4 vistas separadas)
"""
# urls.py
urlpatterns = [
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/create/', UserCreateView.as_view(), name='user_create'),
    path('users/<int:pk>/edit/', UserUpdateView.as_view(), name='user_update'),
    path('users/<int:pk>/delete/', UserDeleteView.as_view(), name='user_delete'),
]
"""

# ✅ DESPUÉS (1 ViewSet)
"""
# views.py
class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = ['view_user', 'add_user', 'change_user', 'delete_user']
    queryset = User.objects.all()
    serializer_class = UserSerializer

# urls.py
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = router.urls

# Genera automáticamente:
# GET    /users/       → list
# POST   /users/       → create
# GET    /users/{id}/  → retrieve
# PUT    /users/{id}/  → update
# PATCH  /users/{id}/  → partial_update
# DELETE /users/{id}/  → destroy
"""

# ==============================================================================
# EJEMPLO 6: Permisos Diferentes por Acción
# ==============================================================================

# ✅ Mejor práctica para CRUD completo
"""
from apps.security.mixins.api_mixins import ActionPermissionMixin

class UserViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    permission_map = {
        'list': 'view_user',
        'retrieve': 'view_user',
        'create': 'add_user',
        'update': 'change_user',
        'partial_update': 'change_user',
        'destroy': 'delete_user',
    }
"""

# ==============================================================================
# EJEMPLO 7: Acciones Personalizadas
# ==============================================================================

"""
from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    permission_map = {
        'list': 'view_user',
        'activate': 'change_user',
        'deactivate': 'change_user',
        'reset_password': 'change_user',
    }
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'Usuario activado'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'Usuario desactivado'})
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        # Lógica de reset
        return Response({'status': 'Contraseña reseteada'})

# URLs generadas:
# POST /users/{id}/activate/
# POST /users/{id}/deactivate/
# POST /users/{id}/reset_password/
"""

# ==============================================================================
# EJEMPLO 8: Filtrado y Búsqueda
# ==============================================================================

"""
from rest_framework import filters

class UserViewSet(PermissionMixin, viewsets.ModelViewSet):
    permission_required = 'view_user'
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por usuario si no es superusuario
        if not self.request.user.is_superuser:
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtros adicionales desde query params
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        
        return queryset

# Uso desde frontend:
# GET /users/?search=john
# GET /users/?ordering=-date_joined
# GET /users/?is_active=true
"""

# ==============================================================================
# CHECKLIST DE MIGRACIÓN
# ==============================================================================

MIGRATION_CHECKLIST = """
□ 1. Crear Serializer para el modelo
□ 2. Convertir ListView/CreateView/etc a ViewSet
□ 3. Cambiar mixins: mixins.py → api_mixins.py
□ 4. Actualizar URLs: usar DefaultRouter
□ 5. Configurar paginación en settings.py
□ 6. Añadir CORS si es necesario
□ 7. Probar endpoints con curl/Postman
□ 8. Actualizar frontend para consumir API
□ 9. Probar permisos (superusuario y usuario normal)
□ 10. Documentar endpoints
"""

# ==============================================================================
# CONFIGURACIÓN REQUERIDA EN SETTINGS.PY
# ==============================================================================

REQUIRED_SETTINGS = """
# settings.py

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'apps.security',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}
"""

# ==============================================================================
# TESTING
# ==============================================================================

TESTING_EXAMPLES = """
# tests.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User, Group

class UserViewSetTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.group = Group.objects.create(name='Test Group')
        self.user.groups.add(self.group)
        
    def test_list_requires_authentication(self):
        response = self.client.get('/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_with_permission(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get('/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_requires_permission(self):
        self.client.login(username='testuser', password='testpass123')
        data = {'username': 'newuser', 'email': 'new@example.com'}
        response = self.client.post('/users/', data)
        # Si no tiene permiso 'add_user', debe retornar 403
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_201_CREATED])
"""

print("✅ Guía de migración cargada. Consulta los ejemplos arriba.")
