import { useState, useCallback, useRef } from 'react';

/**
 * Accessibility utilities for forms and interactions
 */

export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (error.validationErrors) {
          setErrors(error.validationErrors);
          const firstErrorField = formRef.current?.querySelector(`[name="${Object.keys(error.validationErrors)[0]}"]`);
          if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.setAttribute('aria-invalid', 'true');
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, values]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    formRef,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
    resetForm
  };
}

export function FormField({ label, name, type = 'text', value, error, touched, onChange, onBlur, required = false, placeholder, autoComplete, ...props }) {
  const id = `field-${name}`;
  const errorId = `error-${name}`;
  const showError = touched && error;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-600" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-required={required}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? errorId : undefined}
        className={`medisync-input transition ${
          showError
            ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-200'
        }`}
        {...props}
      />
      {showError && (
        <p id={errorId} className="text-sm text-rose-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute -top-full left-0 z-50 bg-slate-900 text-white px-4 py-2 text-sm font-semibold focus:top-0 transition"
    >
      Skip to main content
    </a>
  );
}

export function useKeyboardNavigation(items, onSelect) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!containerRef.current) return;

      const itemsLength = items.length;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemsLength);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemsLength) % itemsLength);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < itemsLength) {
            onSelect(items[selectedIndex], selectedIndex);
          }
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(itemsLength - 1);
          break;
        default:
          break;
      }
    },
    [items, selectedIndex, onSelect]
  );

  return {
    selectedIndex,
    containerRef,
    handleKeyDown,
    setSelectedIndex
  };
}

export function AriaLive({ message, assertiveness = 'polite', className = '' }) {
  return (
    <div
      role="status"
      aria-live={assertiveness}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}