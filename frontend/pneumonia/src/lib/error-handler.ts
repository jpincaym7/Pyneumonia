/**
 * Utilidades para manejo y presentación de errores
 */

export interface ErrorDetails {
  field: string;
  messages: string[];
}

export interface FormattedError {
  title: string;
  message: string;
  details?: ErrorDetails[];
  type: 'validation' | 'permission' | 'server' | 'network' | 'unknown';
}

/**
 * Formatea un error de respuesta del servidor para presentación al usuario
 */
export function formatErrorResponse(error: unknown): FormattedError {
  const err = error as Record<string, unknown>;
  const response = err?.response as Record<string, unknown>;
  const status = response?.status as number || 500;
  const data = response?.data as Record<string, unknown>;

  // Error de validación (400)
  if (status === 400) {
    const details: ErrorDetails[] = [];
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          details.push({ field, messages });
        } else if (typeof messages === 'string') {
          details.push({ field, messages: [messages] });
        }
      });
    }

    return {
      title: 'Error de Validación',
      message: 'Por favor verifica los datos ingresados',
      details,
      type: 'validation',
    };
  }

  // Error de permisos (403)
  if (status === 403) {
    return {
      title: 'Acceso Denegado',
      message: 'No tienes permisos para realizar esta acción',
      type: 'permission',
    };
  }

  // Recurso no encontrado (404)
  if (status === 404) {
    return {
      title: 'No Encontrado',
      message: 'El recurso solicitado no existe',
      type: 'server',
    };
  }

  // Conflicto (409)
  if (status === 409) {
    return {
      title: 'Conflicto',
      message: 'El dato ya existe en el sistema',
      type: 'validation',
    };
  }

  // Error del servidor (5xx)
  if (status >= 500) {
    return {
      title: 'Error del Servidor',
      message: 'Ha ocurrido un error del servidor. Por favor, intenta más tarde',
      type: 'server',
    };
  }

  // Error de red
  if (status === 0 || !response) {
    return {
      title: 'Error de Conexión',
      message: 'No se pudo conectar al servidor. Verifica tu conexión a internet',
      type: 'network',
    };
  }

  // Error desconocido
  return {
    title: 'Error Desconocido',
    message: (data?.detail as string) || 'Ha ocurrido un error inesperado',
    type: 'unknown',
  };
}

/**
 * Convierte errores de formulario a un mapa para fácil acceso
 */
export function createFieldErrorMap(error: FormattedError): Record<string, string> {
  const map: Record<string, string> = {};

  if (error.details) {
    error.details.forEach(detail => {
      map[detail.field] = detail.messages[0];
    });
  }

  return map;
}

/**
 * Obtiene el mensaje de error para un campo específico
 */
export function getFieldError(fieldErrors: Record<string, string>, fieldName: string): string | undefined {
  return fieldErrors[fieldName];
}

/**
 * Mensajes de error amigables por tipo de error
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Campos obligatorios
  required: 'Este campo es obligatorio',
  'Este campo es obligatorio': 'Este campo es obligatorio',

  // DNI/Cédula
  invalid_dni: 'La cédula debe tener 10 dígitos',
  'La cédula debe tener exactamente 10 dígitos numéricos.': 'La cédula debe tener 10 dígitos',
  'La cédula ingresada no es válida. El dígito verificador no coincide.': 'La cédula no es válida',

  // Teléfono
  invalid_phone: 'El teléfono debe comenzar con 09 y tener 10 dígitos',
  'El número de celular debe comenzar con 09 y tener 10 dígitos (ejemplo: 0987654321).': 'Formato de teléfono inválido',

  // Email
  invalid_email: 'El formato del email no es válido',
  'Ingrese una dirección de correo electrónico válida.': 'Email no válido',

  // Fecha
  invalid_date: 'La fecha no es válida',
  'La fecha de nacimiento no puede ser en el futuro.': 'La fecha no puede ser en el futuro',

  // Archivo
  file_too_large: 'El archivo es demasiado grande (máximo 50MB)',
  invalid_file_type: 'Tipo de archivo no permitido',

  // Duplicados
  duplicate: 'Este valor ya existe en el sistema',
  'Ya existe un paciente con este DNI.': 'Este DNI ya está registrado',

  // Permisos
  permission_denied: 'No tienes permisos para realizar esta acción',

  // Server
  server_error: 'Error del servidor. Por favor, intenta más tarde',
  connection_error: 'Error de conexión. Verifica tu internet',
};

/**
 * Traduce un mensaje de error al formato amigable
 */
export function translateErrorMessage(message: string): string {
  return ERROR_MESSAGES[message] || message;
}
