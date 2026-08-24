import React from 'react';
import styles from './Badge.module.css';

const Badge = ({ variant = 'neutral', children }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
