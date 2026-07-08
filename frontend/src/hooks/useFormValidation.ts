import { useState, useCallback } from 'react';

/**
 * Form Validation Hook
 * Phase 17: Form validation and error handling
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValues {
  [key: string]: any;
}

export interface ValidationRules {
  [key: string]: ((value: any) => string | null)[];
}

export const useFormValidation = (
  initialValues: FormValues,
  onSubmit: (values: FormValues) => Promise<void> | void,
  validationRules?: ValidationRules
) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: string, value: any): string[] => {
      const fieldErrors: string[] = [];

      if (validationRules && validationRules[fieldName]) {
        for (const validator of validationRules[fieldName]) {
          const error = validator(value);
          if (error) {
            fieldErrors.push(error);
          }
        }
      }

      return fieldErrors;
    },
    [validationRules]
  );

  /**
   * Validate all fields
   */
  const validateForm = useCallback((): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    Object.keys(values).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      if (fieldErrors.length > 0) {
        newErrors.push(
          ...fieldErrors.map(message => ({
            field: fieldName,
            message,
          }))
        );
      }
    });

    setErrors(newErrors);
    return newErrors;
  }, [values, validateField]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues(prev => ({ ...prev, [name]: value }));

      // Validate on change if field was touched
      if (touched.includes(name)) {
        const fieldErrors = validateField(name, value);
        setErrors(prev =>
          prev.filter(err => err.field !== name).concat(
            fieldErrors.map(message => ({
              field: name,
              message,
            }))
          )
        );
      }
    },
    [touched, validateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;

      if (!touched.includes(name)) {
        setTouched(prev => [...prev, name]);
      }

      const fieldErrors = validateField(name, values[name]);
      setErrors(prev =>
        prev
          .filter(err => err.field !== name)
          .concat(
            fieldErrors.map(message => ({
              field: name,
              message,
            }))
          )
      );
    },
    [touched, validateField, values]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formErrors = validateForm();
      if (formErrors.length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, onSubmit, values]
  );

  /**
   * Get error message for field
   */
  const getFieldError = useCallback(
    (fieldName: string): string | null => {
      const fieldError = errors.find(err => err.field === fieldName);
      return fieldError ? fieldError.message : null;
    },
    [errors]
  );

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched([]);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
    resetForm,
    setValues,
    setErrors,
  };
};

export default useFormValidation;
