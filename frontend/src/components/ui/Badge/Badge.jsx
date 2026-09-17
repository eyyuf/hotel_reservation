import React from 'react';
import styles from './Badge.module.css';

const statusVariantMap = {
  confirmed: 'success',
  active: 'success',
  success: 'success',
  paid: 'success',
  pending: 'warning',
  warning: 'warning',
  unpaid: 'warning',
  cancelled: 'error',
  suspended: 'error',
  inactive: 'error',
  error: 'error',
  failed: 'error',
  checked_in: 'info',
  info: 'info',
  checked_out: 'neutral',
  neutral: 'neutral',
  default: 'neutral'
};

const formatBadgeText = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/_/g, ' ');
};

const Badge = ({ variant, children, className = '' }) => {
  const resolvedVariant = statusVariantMap[variant] 
    || (typeof children === 'string' && statusVariantMap[children.toLowerCase()]) 
    || 'neutral';

  return (
    <span className={`${styles.badge} ${styles[resolvedVariant]} ${className}`}>
      {formatBadgeText(children)}
    </span>
  );
};

export default Badge;
