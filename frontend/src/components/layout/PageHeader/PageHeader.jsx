import React from 'react';
import Button from '../../ui/Button/Button';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, description, action, className = '' }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {React.isValidElement(action) ? (
        <div className={styles.action}>{action}</div>
      ) : action && (
        <div className={styles.action}>
          <Button variant="primary" onClick={action.onClick}>
            {action.icon && <span className={styles.icon}>{action.icon}</span>}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
