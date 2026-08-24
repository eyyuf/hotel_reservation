import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import styles from './Toast.module.css';

const icons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  info: <Info size={20} />
};

const Toast = ({ message, variant = 'info', onClose }) => {
  return (
    <div className={`${styles.toast} ${styles[variant]}`}>
      <span className={styles.icon}>{icons[variant]}</span>
      <p className={styles.message}>{message}</p>
      <button onClick={onClose} className={styles.closeBtn} aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
