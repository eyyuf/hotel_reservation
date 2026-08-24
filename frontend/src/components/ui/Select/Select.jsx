import React from 'react';
import styles from './Select.module.css';

const Select = ({
  label,
  options = [],
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  id,
  name,
  ...props
}) => {
  const selectId = id || name || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`${styles.select} ${error ? styles.hasError : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Select;
