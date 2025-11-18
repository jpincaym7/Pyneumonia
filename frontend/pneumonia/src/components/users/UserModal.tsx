'use client';

/**
 * Modal para crear/editar usuario con validaciones de seguridad mejoradas
 * - Separación clara de lógica de creación vs edición
 * - Validaciones en tiempo real optimizadas
 * - Mejor manejo de estados y errores
 * - UX mejorada con feedback visual
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '@/services/user.service';
import { groupService } from '@/services/group.service';
import type { User } from '@/types/auth';
import type { Group } from '@/types/auth';
import {
  validateEcuadorianCedula,
  validateEmail,
  validatePhone,
  validateName,
  validateUsername,
  validatePassword,
} from '@/lib/user-validator';
import { formatErrorResponse, createFieldErrorMap } from '@/lib/error-handler';
import { 
  MdPerson,
  MdCheckCircle,
  MdCancel,
  MdSupervisorAccount,
  MdVerifiedUser,
  MdGroup,
  MdWarning,
  MdCheckBox,
  MdEdit,
  MdAdd
} from 'react-icons/md';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

type FormData = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  dni: string;
  direction: string;
  phone: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  group_ids: number[]; // Usado internamente en el formulario
  groups?: number[]; // Para enviar al backend
};

type ValidationField = 'email' | 'first_name' | 'last_name' | 'dni' | 'phone' | 'password' | 'password_confirm' | 'username';

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const isEditMode = Boolean(user);
  
  // Estados
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    password_confirm: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    dni: user?.dni || '',
    direction: user?.direction || '',
    phone: user?.phone || '',
    is_active: user?.is_active ?? true,
    is_staff: user?.is_staff ?? false,
    is_superuser: user?.is_superuser ?? false,
    group_ids: user?.groups || []
  });
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Cargar grupos disponibles
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await groupService.getGroups({ page_size: 100 });
        // La respuesta es paginada, extraemos el array de results
        setGroups(response.results || []);
      } catch (error) {
        console.error('Error al cargar grupos:', error);
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  // Validación en tiempo real optimizada
  const validateField = useCallback((field: ValidationField, value: string) => {
    let validation = { valid: false, error: '' };

    switch (field) {
      case 'username':
        validation = validateUsername(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'first_name':
      case 'last_name':
        validation = validateName(value);
        break;
      case 'dni':
        validation = value ? validateEcuadorianCedula(value) : { valid: true, error: '' };
        break;
      case 'phone':
        validation = value ? validatePhone(value) : { valid: true, error: '' };
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      case 'password_confirm':
        validation = {
          valid: value === formData.password,
          error: value === formData.password ? '' : 'Las contraseñas no coinciden'
        };
        break;
    }

    return validation;
  }, [formData.password]);

  // Handler genérico para cambios de input con validación
  const handleInputChange = useCallback((field: ValidationField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validar solo si el campo ha sido tocado
    if (touched[field] && value) {
      const validation = validateField(field, value);
      
      setValidationStatus(prev => ({
        ...prev,
        [field]: validation.valid
      }));

      setFieldErrors(prev => {
        const newErrors = { ...prev };
        if (validation.valid) {
          delete newErrors[field];
        } else if (validation.error) {
          newErrors[field] = validation.error;
        }
        return newErrors;
      });
    }
  }, [touched, validateField]);

  // Handler para marcar campo como tocado
  const handleBlur = useCallback((field: ValidationField) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const value = formData[field];
    if (value) {
      const validation = validateField(field, String(value));
      
      setValidationStatus(prev => ({
        ...prev,
        [field]: validation.valid
      }));

      if (!validation.valid && validation.error) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: validation.error
        }));
      }
    }
  }, [formData, validateField]);

  // Validación completa del formulario
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validar username solo en modo creación
    if (!isEditMode) {
      const usernameVal = validateUsername(formData.username);
      if (!usernameVal.valid && usernameVal.error) {
        errors.username = usernameVal.error;
        isValid = false;
      }
    }

    // Validar email
    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid && emailVal.error) {
      errors.email = emailVal.error;
      isValid = false;
    }

    // Validar nombres
    const firstNameVal = validateName(formData.first_name);
    if (!firstNameVal.valid && firstNameVal.error) {
      errors.first_name = firstNameVal.error;
      isValid = false;
    }

    const lastNameVal = validateName(formData.last_name);
    if (!lastNameVal.valid && lastNameVal.error) {
      errors.last_name = lastNameVal.error;
      isValid = false;
    }

    // Validar cédula si se proporciona
    if (formData.dni) {
      const cedulaVal = validateEcuadorianCedula(formData.dni);
      if (!cedulaVal.valid && cedulaVal.error) {
        errors.dni = cedulaVal.error;
        isValid = false;
      }
    }

    // Validar teléfono si se proporciona
    if (formData.phone) {
      const phoneVal = validatePhone(formData.phone);
      if (!phoneVal.valid && phoneVal.error) {
        errors.phone = phoneVal.error;
        isValid = false;
      }
    }

    // Validar contraseña solo en modo creación
    if (!isEditMode) {
      const passwordVal = validatePassword(formData.password);
      if (!passwordVal.valid && passwordVal.error) {
        errors.password = passwordVal.error;
        isValid = false;
      }

      if (formData.password !== formData.password_confirm) {
        errors.password_confirm = 'Las contraseñas no coinciden';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  }, [formData, isEditMode]);

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validar formulario completo
    if (!validateForm()) {
      setError('Por favor, corrige los errores indicados en el formulario');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && user) {
        // Modo edición: excluir campos de contraseña si están vacíos
        const { password, password_confirm, username, ...editData } = formData;
        
        // Preparar datos de actualización
        const updateData: any = {
          ...editData,
          groups: formData.group_ids // Django espera 'groups' no 'group_ids'
        };
        
        // Incluir password solo si se proporcionó
        if (password) {
          updateData.password = password;
          updateData.password_confirm = password_confirm;
        }
        
        // Eliminar group_ids del objeto (usamos groups)
        delete updateData.group_ids;
        
        await userService.updateUser(user.id, updateData);
      } else {
        // Modo creación: enviar todos los datos
        const createData = {
          ...formData,
          groups: formData.group_ids // Django espera 'groups' no 'group_ids'
        };
        delete createData.group_ids;
        
        await userService.createUser(createData);
      }

      onSave();
    } catch (err) {
      const formatted = formatErrorResponse(err);
      const errorMap = createFieldErrorMap(formatted);

      if (Object.keys(errorMap).length > 0) {
        setFieldErrors(errorMap);
      }
      
      setError(formatted.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  // Handler para checkboxes de grupos
  const handleGroupToggle = useCallback((groupId: number) => {
    setFormData(prev => ({
      ...prev,
      group_ids: prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId]
    }));
  }, []);

  // Handler para permisos especiales
  const handlePermissionToggle = useCallback((field: 'is_active' | 'is_staff' | 'is_superuser') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Computar estado de validación de campos requeridos
  const isFormValid = useMemo(() => {
    if (isEditMode) {
      return formData.email && formData.first_name && formData.last_name;
    }
    return (
      formData.username &&
      formData.email &&
      formData.password &&
      formData.password_confirm &&
      formData.first_name &&
      formData.last_name &&
      formData.password === formData.password_confirm
    );
  }, [formData, isEditMode]);

  // Componente de input con validación
  const ValidationInput = useCallback(({ 
    label, 
    field, 
    type = 'text', 
    required = false, 
    placeholder = '', 
    helpText = '',
    disabled = false
  }: {
    label: string;
    field: ValidationField;
    type?: string;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    disabled?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          required={required}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 rounded-lg focus:ring-2 focus:ring-offset-0 focus:bg-white transition-all placeholder:text-gray-400 ${
            disabled ? 'opacity-60 cursor-not-allowed' :
            fieldErrors[field]
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : validationStatus[field]
              ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
          placeholder={placeholder}
        />
        {validationStatus[field] && !fieldErrors[field] && (
          <MdCheckBox className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5" />
        )}
      </div>
      {fieldErrors[field] && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-shake">
          <MdWarning className="h-4 w-4 flex-shrink-0" />
          {fieldErrors[field]}
        </p>
      )}
      {helpText && !fieldErrors[field] && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  ), [formData, fieldErrors, validationStatus, handleInputChange, handleBlur]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-fadeInUp">
        {/* Header */}
        <div className={`bg-gradient-to-r ${isEditMode ? 'from-blue-600 to-indigo-600' : 'from-indigo-600 to-purple-600'} px-6 py-5 flex items-center justify-between rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {isEditMode ? (
                <MdEdit className="h-6 w-6 text-white" />
              ) : (
                <MdAdd className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-sm text-white/80">
                {isEditMode ? 'Actualiza la información del usuario' : 'Completa los datos del nuevo usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
          >
            <MdCancel className="h-6 w-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scroll">
          <div className="p-6 space-y-6">
            {/* Mensaje de error global */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm animate-shake flex items-start gap-3">
                <MdWarning className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error al guardar</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-indigo-100">
                <MdPerson className="text-indigo-600" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username - solo en creación */}
                {!isEditMode && (
                  <ValidationInput
                    label="Nombre de usuario"
                    field="username"
                    required
                    placeholder="usuario123"
                    helpText="Único e inmutable, usado para iniciar sesión"
                  />
                )}

                <ValidationInput
                  label="Email"
                  field="email"
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  helpText="Dirección de correo electrónico válida"
                />

                <ValidationInput
                  label="Nombres"
                  field="first_name"
                  required
                  placeholder="Juan Carlos"
                  helpText="Solo letras, espacios y acentos"
                />

                <ValidationInput
                  label="Apellidos"
                  field="last_name"
                  required
                  placeholder="Pérez García"
                  helpText="Solo letras, espacios y acentos"
                />

                <ValidationInput
                  label="Cédula o RUC"
                  field="dni"
                  placeholder="0123456789"
                  helpText="10 dígitos sin espacios ni guiones"
                />

                <ValidationInput
                  label="Teléfono"
                  field="phone"
                  type="tel"
                  placeholder="0987654321"
                  helpText="09 + 8 dígitos (formato ecuatoriano)"
                />
              </div>

              {/* Dirección - campo completo */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="Av. Principal 123, Ciudad"
                />
              </div>
            </div>

            {/* Seguridad - solo en creación */}
            {!isEditMode && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-purple-100">
                  <MdVerifiedUser className="text-purple-600" />
                  Seguridad
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidationInput
                    label="Contraseña"
                    field="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    helpText="Mínimo 6 caracteres (letras y números)"
                  />

                  <ValidationInput
                    label="Confirmar contraseña"
                    field="password_confirm"
                    type="password"
                    required
                    placeholder="••••••••"
                    helpText="Debe coincidir con la contraseña"
                  />
                </div>
              </div>
            )}

            {/* Permisos y Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b-2 border-emerald-100">
                <MdSupervisorAccount className="text-emerald-600" />
                Permisos y Configuración
              </h3>
              
              {/* Grupos (Roles) */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-100">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MdGroup className="text-indigo-600 h-5 w-5" />
                  Grupos (Roles)
                </label>
                
                {loadingGroups ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-gray-500 italic p-4 text-center">
                    No hay grupos disponibles
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-40 overflow-y-auto modal-scroll pr-2">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={formData.group_ids.includes(group.id)}
                            onChange={() => handleGroupToggle(group.id)}
                            className="w-4 h-4 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {group.name}
                            </span>
                          </div>
                          <MdCheckCircle
                            className={`h-5 w-5 transition-all ${
                              formData.group_ids.includes(group.id)
                                ? 'text-indigo-600 opacity-100'
                                : 'text-gray-300 opacity-0 group-hover:opacity-50'
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                    {formData.group_ids.length > 0 && (
                      <p className="text-xs text-indigo-600 mt-3 font-medium flex items-center gap-1">
                        <MdCheckCircle className="h-4 w-4" />
                        {formData.group_ids.length} grupo(s) seleccionado(s)
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Permisos especiales */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Permisos Especiales
                </p>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={() => handlePermissionToggle('is_active')}
                    className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      Usuario activo
                    </span>
                    <p className="text-xs text-gray-600">
                      El usuario podrá iniciar sesión en el sistema
                    </p>
                  </div>
                  <MdCheckCircle 
                    className={`h-5 w-5 ${formData.is_active ? 'text-emerald-600' : 'text-gray-300'} transition-colors`} 
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_staff}
                    onChange={() => handlePermissionToggle('is_staff')}
                    className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Es staff
                    </span>
                    <p className="text-xs text-gray-600">
                      Puede acceder al panel de administración
                    </p>
                  </div>
                  <MdSupervisorAccount 
                    className={`h-5 w-5 ${formData.is_staff ? 'text-purple-600' : 'text-gray-300'} transition-colors`} 
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_superuser}
                    onChange={() => handlePermissionToggle('is_superuser')}
                    className="w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                      Es superusuario
                    </span>
                    <p className="text-xs text-gray-600">
                      Tiene todos los permisos sin necesidad de asignarlos
                    </p>
                  </div>
                  <MdVerifiedUser 
                    className={`h-5 w-5 ${formData.is_superuser ? 'text-red-600' : 'text-gray-300'} transition-colors`} 
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`px-6 py-2.5 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </span>
                ) : (
                  <>
                    {isEditMode ? (
                      <span className="flex items-center gap-2">
                        <MdEdit className="h-5 w-5" />
                        Actualizar Usuario
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MdAdd className="h-5 w-5" />
                        Crear Usuario
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}