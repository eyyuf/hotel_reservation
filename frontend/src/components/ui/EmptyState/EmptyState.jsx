import React from 'react';
import Button from '../Button/Button';
import styles from './EmptyState.module.css';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  message,
  actionLabel,
  onAction,
  className = ''
}) => {
  const text = description || message;

  return (
    <div className={`${styles.container} ${className}`}>
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon size={32} className={styles.icon} />
        </div>
      )}
      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.description}>{text}</p>}
      {actionLabel && onAction && (
        <div className={styles.action}>
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
