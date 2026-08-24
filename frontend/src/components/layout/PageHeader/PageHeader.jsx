import React from 'react';
import Button from '../../ui/Button/Button';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, description, action }) => {
  return (
    <div className={styles.header}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {React.isValidElement(action) ? action : action && (
        <div className={styles.action}>
          <Button onClick={action.onClick}>
            {action.icon && <span className={styles.icon}>{action.icon}</span>}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
