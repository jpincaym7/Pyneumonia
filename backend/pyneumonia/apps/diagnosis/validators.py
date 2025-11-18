"""
Validadores personalizados para seguridad y validación de datos
"""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _
import re
import mimetypes
from decimal import Decimal


class SecureFileValidator(FileExtensionValidator):
    """Validador seguro para archivos con validación de MIME types"""
    
    ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/dicom']
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    
    def __call__(self, value):
        # Validar extensión
        super().__call__(value)
        
        # Validar tamaño
        if value.size > self.MAX_FILE_SIZE:
            raise ValidationError(
                _('El archivo es demasiado grande. El máximo permitido es %(max_size)dMB.'),
                code='file_too_large',
                params={'max_size': self.MAX_FILE_SIZE // (1024 * 1024)},
            )
        
        # Validar MIME type
        mime_type, _ = mimetypes.guess_type(value.name)
        if mime_type and mime_type not in self.ALLOWED_MIME_TYPES:
            raise ValidationError(
                _('Tipo de archivo no permitido. Se aceptan: JPEG, PNG, DICOM'),
                code='invalid_mime_type',
            )


def validate_confidence_score(value):
    """Valida que el score de confianza esté entre 0 y 1"""
    if not isinstance(value, (int, float, Decimal)):
        raise ValidationError(_('La confianza debe ser un número.'))
    
    if value < Decimal('0') or value > Decimal('1'):
        raise ValidationError(_('La confianza debe estar entre 0 y 1.'))


def validate_severity_level(value):
    """Valida que la severidad sea un valor permitido"""
    allowed_values = ['mild', 'moderate', 'severe']
    if value and value not in allowed_values:
        raise ValidationError(
            _('Severidad inválida. Se aceptan: %(allowed_values)s'),
            code='invalid_severity',
            params={'allowed_values': ', '.join(allowed_values)},
        )


def validate_diagnosis_class(value):
    """Valida que la clase de diagnóstico sea un valor permitido"""
    allowed_classes = ['NORMAL', 'PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    if value not in allowed_classes:
        raise ValidationError(
            _('Clase de diagnóstico inválida. Se aceptan: %(allowed_classes)s'),
            code='invalid_diagnosis_class',
            params={'allowed_classes': ', '.join(allowed_classes)},
        )


def validate_medical_notes(value):
    """Valida las notas médicas para prevenir inyecciones"""
    if not isinstance(value, str):
        raise ValidationError(_('Las notas médicas deben ser texto.'))
    
    # Limitar longitud
    MAX_LENGTH = 5000
    if len(value) > MAX_LENGTH:
        raise ValidationError(
            _('Las notas médicas no deben exceder %(max_length)d caracteres.'),
            code='notes_too_long',
            params={'max_length': MAX_LENGTH},
        )
    
    # Verificar caracteres sospechosos
    suspicious_patterns = [
        r'<script',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe',
        r'<embed',
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(
                _('Las notas contienen caracteres o patrones no permitidos.'),
                code='suspicious_content',
            )


def validate_patient_age(birth_date):
    """Valida que la edad del paciente sea lógica (entre 0 y 150 años)"""
    from datetime import date
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    
    if age < 0:
        raise ValidationError(_('La fecha de nacimiento no puede ser en el futuro.'))
    
    if age > 150:
        raise ValidationError(_('La edad del paciente parece ser inválida (> 150 años).'))


def validate_email_format(email):
    """Validación adicional para formato de email"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if email and not re.match(email_pattern, email):
        raise ValidationError(_('El formato del email no es válido.'))


def validate_no_sql_injection(value):
    """Previene inyecciones SQL en campos de texto"""
    if not isinstance(value, str):
        return
    
    dangerous_keywords = [
        'drop', 'delete', 'insert', 'update', 'union', 'select',
        'exec', 'execute', 'create', 'alter', 'truncate'
    ]
    
    lower_value = value.lower()
    for keyword in dangerous_keywords:
        if keyword in lower_value and re.search(rf'\b{keyword}\b', lower_value):
            raise ValidationError(
                _('El contenido contiene patrones sospechosos.'),
                code='sql_injection_attempt',
            )
