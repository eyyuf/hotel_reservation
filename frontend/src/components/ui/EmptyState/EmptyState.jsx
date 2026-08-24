import React from 'react';
import Button from '../Button/Button';
import styles from './EmptyState.module.css';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className={styles.container}>
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon size={48} className={styles.icon} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <div className={styles.action}>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
