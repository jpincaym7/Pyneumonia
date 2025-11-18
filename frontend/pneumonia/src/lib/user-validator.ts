/**
 * Validador de datos para usuarios (Ecuador)
 * Validación de cédula, emails, teléfonos, etc.
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validar cédula ecuatoriana con algoritmo de módulo 11
 */
export function validateEcuadorianCedula(cedula: string): { valid: boolean; error?: string } {
  const cleaned = cedula.replace(/[-\s]/g, '');

  // Validar que sea solo números
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'La cédula debe contener solo números' };
  }

  // Validar longitud
  if (cleaned.length !== 10) {
    return { valid: false, error: 'La cédula debe tener exactamente 10 dígitos' };
  }

  // Validar provincia (primeros 2 dígitos: 01-24)
  const province = parseInt(cleaned.substring(0, 2), 10);
  if (province < 1 || province > 24) {
    return { valid: false, error: 'Los primeros dos dígitos (provincia) deben estar entre 01 y 24' };
  }

  // Algoritmo de validación (módulo 11)
  const coefficients = [2, 3, 4, 5, 6, 7, 8, 9, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = parseInt(cleaned[i], 10) * coefficients[i];
    
    // Si es mayor a 9, restar 9
    if (value > 9) {
      value = value - 9;
    }
    
    sum += value;
  }

  // Calcular dígito verificador
  const checkDigit = (10 - (sum % 10)) % 10;

  // Validar dígito verificador
  if (parseInt(cleaned[9], 10) !== checkDigit) {
    return { valid: false, error: 'La cédula no es válida. Verifica el número ingresado' };
  }

  return { valid: true };
}

/**
 * Validar formato de email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'El email es requerido' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El formato del email no es válido' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'El email es demasiado largo' };
  }

  return { valid: true };
}

/**
 * Validar teléfono ecuatoriano (09xxxxxxxx)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: true }; // Teléfono es opcional
  }

  const cleaned = phone.replace(/[-\s]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'El teléfono debe contener solo números' };
  }

  if (cleaned.length !== 10) {
    return { valid: false, error: 'El teléfono debe tener 10 dígitos' };
  }

  if (!cleaned.startsWith('09')) {
    return { valid: false, error: 'El teléfono debe empezar con 09' };
  }

  return { valid: true };
}

/**
 * Validar nombre de usuario
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'El nombre de usuario es requerido' };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return { valid: false, error: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
  }

  if (username.length > 150) {
    return { valid: false, error: 'El nombre de usuario no debe exceder 150 caracteres' };
  }

  return { valid: true };
}

/**
 * Validar nombres y apellidos (solo letras, acentos y espacios)
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'El nombre no puede estar vacío' };
  }

  const trimmed = name.trim();

  // Solo letras, espacios y acentos
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmed)) {
    return { valid: false, error: 'El nombre contiene caracteres no permitidos' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (trimmed.length > 150) {
    return { valid: false, error: 'El nombre no debe exceder 150 caracteres' };
  }

  return { valid: true };
}

/**
 * Validar dirección
 */
export function validateDirection(direction: string): { valid: boolean; error?: string } {
  if (!direction) {
    return { valid: true }; // Dirección es opcional
  }

  if (direction.length > 200) {
    return { valid: false, error: 'La dirección no debe exceder 200 caracteres' };
  }

  // Detectar palabras clave SQL peligrosas
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'UNION', 'SELECT', 'EXEC'];
  const upperDirection = direction.toUpperCase();

  for (const keyword of sqlKeywords) {
    if (new RegExp(`\\b${keyword}\\b`).test(upperDirection)) {
      return { valid: false, error: 'La dirección contiene palabras no permitidas' };
    }
  }

  return { valid: true };
}

/**
 * Validar contraseña
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);

  if (!hasNumbers || !hasLetters) {
    return { valid: false, error: 'La contraseña debe contener números y letras' };
  }

  return { valid: true };
}

/**
 * Normalizar cédula (limpiar y validar)
 */
export function normalizeCedula(cedula: string): string {
  return cedula.replace(/[-\s]/g, '');
}

/**
 * Normalizar teléfono (limpiar y validar)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[-\s]/g, '');
}

/**
 * Validar datos completos del usuario
 */
export function validateUserData(data: {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  phone?: string;
  direction?: string;
  password?: string;
  password_confirm?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      errors.push({ field: 'username', message: usernameValidation.error || '' });
    }
  }

  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.push({ field: 'email', message: emailValidation.error || '' });
    }
  }

  if (data.first_name) {
    const nameValidation = validateName(data.first_name);
    if (!nameValidation.valid) {
      errors.push({ field: 'first_name', message: nameValidation.error || '' });
    }
  }

  if (data.last_name) {
    const nameValidation = validateName(data.last_name);
    if (!nameValidation.valid) {
      errors.push({ field: 'last_name', message: nameValidation.error || '' });
    }
  }

  if (data.dni) {
    const cedulaValidation = validateEcuadorianCedula(data.dni);
    if (!cedulaValidation.valid) {
      errors.push({ field: 'dni', message: cedulaValidation.error || '' });
    }
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) {
      errors.push({ field: 'phone', message: phoneValidation.error || '' });
    }
  }

  if (data.direction) {
    const directionValidation = validateDirection(data.direction);
    if (!directionValidation.valid) {
      errors.push({ field: 'direction', message: directionValidation.error || '' });
    }
  }

  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push({ field: 'password', message: passwordValidation.error || '' });
    }

    // Validar coincidencia de contraseñas
    if (data.password_confirm && data.password !== data.password_confirm) {
      errors.push({ field: 'password_confirm', message: 'Las contraseñas no coinciden' });
    }
  }

  return errors;
}
