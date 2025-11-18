"""
Validadores personalizados para el módulo de seguridad
Validación de cédulas ecuatorianas y datos de usuario
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re


def validate_ecuadorian_cedula(value):
    """
    Valida una cédula ecuatoriana usando el algoritmo oficial
    
    Formato: 10 dígitos (XXXXXXXXXX)
    Validación: Algoritmo de módulo 11 de la cédula ecuatoriana
    
    Args:
        value (str): Número de cédula sin espacios ni guiones
        
    Raises:
        ValidationError: Si la cédula no es válida
    """
    if not value:
        raise ValidationError(_('La cédula no puede estar vacía.'))
    
    # Limpiar espacios y guiones
    cedula = str(value).strip().replace('-', '').replace(' ', '')
    
    # Validar que sea solo dígitos
    if not cedula.isdigit():
        raise ValidationError(_('La cédula debe contener solo dígitos.'))
    
    # Validar longitud
    if len(cedula) != 10:
        raise ValidationError(
            _('La cédula debe tener exactamente 10 dígitos. Ingresaste %(length)d.'),
            code='invalid_cedula_length',
            params={'length': len(cedula)},
        )
    
    # Validar provincia (primeros 2 dígitos: 01-24)
    provincia = int(cedula[:2])
    if provincia < 1 or provincia > 24:
        raise ValidationError(
            _('Los primeros dos dígitos (provincia) deben estar entre 01 y 24.'),
            code='invalid_cedula_province',
        )
    
    # Algoritmo de validación (módulo 11)
    coeficientes = [2, 3, 4, 5, 6, 7, 8, 9, 2]
    suma = 0
    
    for i, coef in enumerate(coeficientes):
        digito = int(cedula[i])
        valor = digito * coef
        
        # Si es mayor a 9, restar 9
        if valor > 9:
            valor = valor - 9
        
        suma += valor
    
    # Calcular dígito verificador
    digito_verificador = (10 - (suma % 10)) % 10
    
    # Validar dígito verificador
    if int(cedula[9]) != digito_verificador:
        raise ValidationError(
            _('La cédula no es válida. Verifica el número ingresado.'),
            code='invalid_cedula_checksum',
        )


def validate_cedula_format(value):
    """
    Valida el formato de la cédula (números solamente)
    
    Args:
        value (str): Número de cédula
        
    Raises:
        ValidationError: Si el formato no es válido
    """
    if not value:
        return
    
    cedula = str(value).strip().replace('-', '').replace(' ', '')
    
    if not cedula.isdigit():
        raise ValidationError(
            _('La cédula debe contener solo números.'),
            code='cedula_non_numeric',
        )
    
    if len(cedula) != 10:
        raise ValidationError(
            _('La cédula debe tener 10 dígitos.'),
            code='cedula_length',
        )


def validate_unique_cedula(value, exclude_id=None):
    """
    Valida que la cédula sea única en la base de datos
    
    Args:
        value (str): Número de cédula
        exclude_id (int): ID del usuario a excluir de la búsqueda (para ediciones)
        
    Raises:
        ValidationError: Si ya existe un usuario con esa cédula
    """
    from apps.security.models import User
    
    if not value:
        return
    
    cedula = str(value).strip().replace('-', '').replace(' ', '')
    
    query = User.objects.filter(dni=cedula)
    
    if exclude_id:
        query = query.exclude(id=exclude_id)
    
    if query.exists():
        raise ValidationError(
            _('Ya existe un usuario registrado con esta cédula.'),
            code='cedula_exists',
        )


def validate_user_email(value):
    """
    Validación de email con patrón más estricto
    
    Args:
        value (str): Email a validar
        
    Raises:
        ValidationError: Si el email no es válido
    """
    if not value:
        return
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, value):
        raise ValidationError(
            _('El formato del email no es válido.'),
            code='invalid_email_format',
        )
    
    # Validar longitud
    if len(value) > 254:
        raise ValidationError(
            _('El email es demasiado largo.'),
            code='email_too_long',
        )


def validate_username_format(value):
    """
    Validación de nombre de usuario
    Solo permite letras, números, puntos, guiones y guiones bajos
    
    Args:
        value (str): Nombre de usuario
        
    Raises:
        ValidationError: Si el formato no es válido
    """
    if not value:
        return
    
    # No permitir caracteres especiales peligrosos
    if not re.match(r'^[a-zA-Z0-9._-]+$', value):
        raise ValidationError(
            _('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.'),
            code='invalid_username_format',
        )
    
    # Validar longitud
    if len(value) < 3:
        raise ValidationError(
            _('El nombre de usuario debe tener al menos 3 caracteres.'),
            code='username_too_short',
        )
    
    if len(value) > 150:
        raise ValidationError(
            _('El nombre de usuario no debe exceder 150 caracteres.'),
            code='username_too_long',
        )


def validate_user_names(value):
    """
    Validación de nombres y apellidos del usuario
    
    Args:
        value (str): Nombre o apellido
        
    Raises:
        ValidationError: Si no es válido
    """
    if not value:
        return
    
    value = str(value).strip()
    
    # No permitir números solamente en el nombre
    if value.isdigit():
        raise ValidationError(
            _('El nombre no puede contener solo números.'),
            code='name_only_numbers',
        )
    
    # Permitir letras, espacios y acentos
    if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', value):
        raise ValidationError(
            _('El nombre contiene caracteres no permitidos.'),
            code='invalid_name_characters',
        )
    
    # Validar longitud
    if len(value) < 2:
        raise ValidationError(
            _('El nombre debe tener al menos 2 caracteres.'),
            code='name_too_short',
        )
    
    if len(value) > 150:
        raise ValidationError(
            _('El nombre no debe exceder 150 caracteres.'),
            code='name_too_long',
        )


def validate_phone_format(value):
    """
    Validación de teléfono ecuatoriano
    Formato: 09XX-XXX-XXXX o 0987654321 (10 dígitos)
    
    Args:
        value (str): Número de teléfono
        
    Raises:
        ValidationError: Si el formato no es válido
    """
    if not value:
        return
    
    # Limpiar espacios y guiones
    phone = str(value).strip().replace('-', '').replace(' ', '')
    
    # Debe ser solo dígitos
    if not phone.isdigit():
        raise ValidationError(
            _('El teléfono debe contener solo números.'),
            code='phone_non_numeric',
        )
    
    # Validar longitud (10 dígitos para Ecuador)
    if len(phone) != 10:
        raise ValidationError(
            _('El teléfono debe tener 10 dígitos.'),
            code='phone_length',
        )
    
    # Validar que empiece con 09 (móvil ecuatoriano)
    if not phone.startswith('09'):
        raise ValidationError(
            _('El teléfono debe empezar con 09.'),
            code='phone_invalid_prefix',
        )


def validate_no_sql_injection(value):
    """
    Previene inyecciones SQL en campos de texto
    
    Args:
        value (str): Texto a validar
        
    Raises:
        ValidationError: Si contiene patrones sospechosos
    """
    if not isinstance(value, str) or not value:
        return
    
    dangerous_keywords = [
        'drop', 'delete', 'insert', 'update', 'union', 'select',
        'exec', 'execute', 'create', 'alter', 'truncate'
    ]
    
    lower_value = value.lower()
    for keyword in dangerous_keywords:
        if re.search(rf'\b{keyword}\b', lower_value):
            raise ValidationError(
                _('El contenido contiene patrones no permitidos.'),
                code='sql_injection_attempt',
            )
