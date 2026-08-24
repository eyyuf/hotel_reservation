import React from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLabel,
  onCancel,
  isLoading = false,
  isDestructive = false,
  variant = 'default'
}) => {
  const resolvedConfirmText = confirmLabel || confirmText;
  const close = onCancel || onClose;
  const footer = (
    <>
      <Button variant="secondary" onClick={close} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button variant={isDestructive || variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
        {isLoading ? 'Working…' : resolvedConfirmText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} footer={footer}>
      <p className={styles.message}>{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
