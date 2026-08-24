import React from 'react';
import styles from './Button.module.css';

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    isLoading ? styles.loading : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className={styles.spinner}></span>
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};

export default Button;
