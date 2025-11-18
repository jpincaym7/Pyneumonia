from django.shortcuts import redirect
from django.urls import reverse

class LoginRequiredMiddleware:
    """
    Middleware para redirigir al login si el usuario no está autenticado.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Si no está autenticado y no está accediendo al login, redirigir.
        if not request.user.is_authenticated and request.path not in [
            reverse('security:auth-api')
        ] and not request.path.startswith('/admin/'):
            return redirect('security:auth-api')  # Cambia 'login' por el nombre de tu ruta de login
        return self.get_response(request)