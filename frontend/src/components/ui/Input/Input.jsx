import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  id,
  name,
  as: Component = 'input',
  ...props
}, ref) => {
  const inputId = id || name || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <Component
        ref={ref}
        id={inputId}
        name={name}
        type={Component === 'input' ? type : undefined}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`${styles.input} ${error ? styles.hasError : ''} ${Component === 'textarea' ? styles.textarea : ''}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
