/**
 * Modal (Mejorado) para crear/editar órdenes médicas
 * Con validaciones completas del lado del cliente
 */
'use client';

import React, { useState, useEffect } from 'react';
import { MedicalOrderFormData, PRIORITY_CHOICES } from '@/types/medical-order';
import { Patient } from '@/types/patient';
import { X, Save, User, ClipboardList, AlertTriangle, MessageSquare, AlertCircle } from 'lucide-react';

interface MedicalOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalOrderFormData) => Promise<void>;
  initialData?: MedicalOrderFormData & { id?: string };
  patients: Patient[];
  isLoading?: boolean;
  errors?: Record<string, string[]>;
}

// Tipos para validaciones
interface ValidationRule {
  validate: (value: any, formData?: MedicalOrderFormData) => boolean;
  message: string;
}

interface FormValidation {
  [key: string]: ValidationRule[];
}

// Configuración de validaciones
const validationRules: FormValidation = {
  patient: [
    {
      validate: (value) => !!value && value.trim() !== '',
      message: 'Debe seleccionar un paciente'
    },
    {
      validate: (value) => {
        // Validar formato UUID si es necesario
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return !value || value === '' || uuidRegex.test(value) || value.length > 0;
      },
      message: 'ID de paciente inválido'
    }
  ],
  reason: [
    {
      validate: (value) => !!value && value.trim() !== '',
      message: 'La razón de la radiografía es obligatoria'
    },
    {
      validate: (value) => !value || value.trim().length >= 10,
      message: 'La razón debe tener al menos 10 caracteres'
    },
    {
      validate: (value) => !value || value.trim().length <= 500,
      message: 'La razón no puede exceder 500 caracteres'
    },
    {
      validate: (value) => {
        // Validar que no sea solo espacios o caracteres especiales
        const trimmed = value?.trim() || '';
        return !trimmed || /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(trimmed);
      },
      message: 'La razón debe contener texto válido'
    }
  ],
  priority: [
    {
      validate: (value) => !!value && value.trim() !== '',
      message: 'Debe seleccionar una prioridad'
    },
    {
      validate: (value) => ['low', 'normal', 'urgent'].includes(value),
      message: 'Prioridad inválida'
    }
  ],
  notes: [
    {
      validate: (value) => !value || value.length <= 1000,
      message: 'Las notas no pueden exceder 1000 caracteres'
    },
    {
      validate: (value) => {
        // Si hay notas, validar que no sean solo espacios
        if (value && value.trim() === '' && value.length > 0) {
          return false;
        }
        return true;
      },
      message: 'Las notas no pueden ser solo espacios en blanco'
    }
  ]
};

// Función para validar un campo específico
const validateField = (fieldName: string, value: any, formData?: MedicalOrderFormData): string[] => {
  const rules = validationRules[fieldName];
  if (!rules) return [];

  const errors: string[] = [];
  for (const rule of rules) {
    if (!rule.validate(value, formData)) {
      errors.push(rule.message);
    }
  }
  return errors;
};

// Función para validar todo el formulario
const validateForm = (formData: MedicalOrderFormData): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  Object.keys(validationRules).forEach((fieldName) => {
    const fieldErrors = validateField(fieldName, formData[fieldName as keyof MedicalOrderFormData], formData);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  });

  return errors;
};

// Componente de Campo de Formulario Genérico
const FormField: React.FC<{ 
  label: string; 
  id: string; 
  error?: string; 
  required?: boolean; 
  children: React.ReactNode, 
  icon?: React.ReactNode;
  touched?: boolean;
}> = ({
  label,
  id,
  error,
  required,
  children,
  icon,
  touched
}) => (
  <div>
    <label htmlFor={id} className="flex items-center text-sm font-semibold text-slate-600 mb-1.5">
      {icon && React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 mr-2 opacity-50' })}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && touched && (
      <div className="flex items-start gap-1.5 mt-1.5">
        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )}
  </div>
);

export const MedicalOrderFormModal: React.FC<MedicalOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  patients,
  isLoading = false,
  errors = {},
}) => {
  const [formData, setFormData] = useState<MedicalOrderFormData>({
    patient: '',
    reason: '',
    priority: '',
    notes: '',
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        patient: initialData.patient,
        reason: initialData.reason,
        priority: initialData.priority,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({ patient: '', reason: '', priority: '', notes: '' });
    }
    setLocalErrors({});
    setTouchedFields(new Set());
    setShowAllErrors(false);
  }, [initialData, isOpen]);

  useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Sanitizar entrada según el campo
    let sanitizedValue = value;
    
    if (name === 'reason' || name === 'notes') {
      // Prevenir caracteres potencialmente peligrosos
      sanitizedValue = value.replace(/[<>]/g, '');
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Validar el campo en tiempo real si ya fue tocado
    if (touchedFields.has(name) || showAllErrors) {
      const fieldErrors = validateField(name, sanitizedValue, { ...formData, [name]: sanitizedValue });
      setLocalErrors((prev) => {
        const updated = { ...prev };
        if (fieldErrors.length > 0) {
          updated[name] = fieldErrors;
        } else {
          delete updated[name];
        }
        return updated;
      });
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    
    // Validar el campo al perder el foco
    const fieldErrors = validateField(fieldName, formData[fieldName as keyof MedicalOrderFormData], formData);
    setLocalErrors((prev) => {
      const updated = { ...prev };
      if (fieldErrors.length > 0) {
        updated[fieldName] = fieldErrors;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAllErrors(true);
    
    // Validar todo el formulario
    const validationErrors = validateForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      // Marcar todos los campos como tocados
      setTouchedFields(new Set(Object.keys(validationRules)));
      
      // Scroll al primer error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Limpiar y preparar datos antes de enviar
      const cleanedData: MedicalOrderFormData = {
        patient: formData.patient.trim(),
        reason: formData.reason.trim(),
        priority: formData.priority as 'low' | 'normal' | 'urgent',
        notes: formData.notes?.trim() || undefined,
      };
      
      await onSubmit(cleanedData);
      
      // Limpiar formulario al éxito
      setFormData({ patient: '', reason: '', priority: '', notes: '' });
      setTouchedFields(new Set());
      setShowAllErrors(false);
      setLocalErrors({});
      onClose();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isLoading) return;
    
    // Confirmar si hay cambios sin guardar
    const hasChanges = formData.patient || formData.reason || formData.priority || formData.notes;
    
    if (hasChanges && !initialData) {
      if (!confirm('¿Estás seguro de que deseas cerrar? Los cambios no guardados se perderán.')) {
        return;
      }
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const baseInputClasses = `w-full px-4 py-2.5 border rounded-lg bg-slate-50 border-slate-200
    placeholder:text-slate-400 text-slate-800
    focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
    focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;

  const errorInputClasses = 'border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500';

  const isFormValid = Object.keys(validateForm(formData)).length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out bg-gray-900/30 backdrop-blur-sm"
      data-state={isOpen ? 'open' : 'closed'}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden
          transition-all duration-300 ease-out"
        data-state={isOpen ? 'open' : 'closed'}
        style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fijo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData?.id ? 'Editar Orden Médica' : 'Nueva Orden Médica'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario con Scroll Interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Paciente */}
            <FormField
              label="Paciente"
              id="patient"
              error={localErrors.patient?.[0]}
              required
              icon={<User />}
              touched={touchedFields.has('patient') || showAllErrors}
            >
              <select
                id="patient"
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                onBlur={() => handleBlur('patient')}
                disabled={isSubmitting || isLoading || !!initialData?.id}
                className={`${baseInputClasses} ${localErrors.patient && (touchedFields.has('patient') || showAllErrors) ? errorInputClasses : ''}`}
                aria-invalid={!!localErrors.patient}
                aria-describedby={localErrors.patient ? 'patient-error' : undefined}
              >
                <option value="">Selecciona un paciente...</option>
                {patients.filter(p => p.is_active).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name} - {patient.dni}
                  </option>
                ))}
              </select>
              {initialData?.id && (
                <p className="mt-1.5 text-xs text-slate-500 italic">
                  No se puede cambiar el paciente al editar una orden
                </p>
              )}
            </FormField>

            {/* Prioridad */}
            <FormField
              label="Prioridad"
              id="priority"
              error={localErrors.priority?.[0]}
              required
              icon={<AlertTriangle />}
              touched={touchedFields.has('priority') || showAllErrors}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRIORITY_CHOICES.map((priority) => (
                  <div key={priority.value}>
                    <input
                      type="radio"
                      id={`priority-${priority.value}`}
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={handleChange}
                      onBlur={() => handleBlur('priority')}
                      disabled={isSubmitting || isLoading}
                      className="hidden peer"
                      aria-invalid={!!localErrors.priority}
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className="flex items-center justify-center w-full p-4 border rounded-lg cursor-pointer
                        transition-all duration-200
                        peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                        peer-checked:border-2 peer-checked:font-semibold hover:shadow-md"
                      style={{
                        color: formData.priority === priority.value ? priority.color : priority.color,
                        borderColor: formData.priority === priority.value ? priority.color : '#E2E8F0',
                        backgroundColor: formData.priority === priority.value ? priority.bgColor : '#F8FAFC',
                      }}
                    >
                      {priority.label}
                    </label>
                  </div>
                ))}
              </div>
            </FormField>

            {/* Razón */}
            <FormField
              label="Razón de la Radiografía"
              id="reason"
              error={localErrors.reason?.[0]}
              required
              icon={<ClipboardList />}
              touched={touchedFields.has('reason') || showAllErrors}
            >
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                onBlur={() => handleBlur('reason')}
                disabled={isSubmitting || isLoading}
                placeholder="Describe la razón o síntomas que requieren la radiografía... (mínimo 10 caracteres)"
                rows={3}
                className={`${baseInputClasses} ${localErrors.reason && (touchedFields.has('reason') || showAllErrors) ? errorInputClasses : ''} resize-y min-h-[80px]`}
                maxLength={500}
                aria-invalid={!!localErrors.reason}
                aria-describedby={localErrors.reason ? 'reason-error' : undefined}
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className={`text-xs ${formData.reason.length < 10 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {formData.reason.length < 10 && formData.reason.length > 0 
                    ? `Faltan ${10 - formData.reason.length} caracteres` 
                    : ''}
                </p>
                <p className={`text-xs text-right ${formData.reason.length > 450 ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                  {formData.reason.length}/500
                </p>
              </div>
            </FormField>

            {/* Notas */}
            <FormField
              label="Notas Adicionales"
              id="notes"
              error={localErrors.notes?.[0]}
              icon={<MessageSquare />}
              touched={touchedFields.has('notes') || showAllErrors}
            >
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('notes')}
                disabled={isSubmitting || isLoading}
                placeholder="Información adicional o instrucciones especiales (opcional)..."
                rows={3}
                className={`${baseInputClasses} ${localErrors.notes && (touchedFields.has('notes') || showAllErrors) ? errorInputClasses : ''} resize-y min-h-[80px]`}
                maxLength={1000}
                aria-invalid={!!localErrors.notes}
                aria-describedby={localErrors.notes ? 'notes-error' : undefined}
              />
              <p className={`mt-1.5 text-xs text-right ${(formData.notes || '').length > 900 ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                {(formData.notes || '').length}/1000
              </p>
            </FormField>

          </div>
        
          {/* Footer Fijo */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur-sm z-10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg 
                hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || (!isFormValid && showAllErrors)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg 
                hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                flex items-center gap-2"
              title={!isFormValid && showAllErrors ? 'Completa todos los campos requeridos correctamente' : ''}
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};