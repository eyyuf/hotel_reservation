import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = ({ variant = 'text', width, height, count = 1 }) => {
  const elements = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {elements.map((idx) => (
        <div
          key={idx}
          className={`${styles.skeleton} ${styles[variant]}`}
          style={{ width, height, marginBottom: count > 1 ? '8px' : '0' }}
        />
      ))}
    </>
  );
};

export default Skeleton;
