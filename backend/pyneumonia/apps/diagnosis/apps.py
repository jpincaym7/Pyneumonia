from django.apps import AppConfig


class DiagnosisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.diagnosis'
    
    def ready(self):
        """Import signals when app is ready"""
        import apps.diagnosis.signals
