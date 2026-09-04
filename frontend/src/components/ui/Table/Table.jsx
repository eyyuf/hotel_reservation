import React from 'react';
import styles from './Table.module.css';

const Table = ({
  columns = [],
  data = [],
  emptyMessage = 'No data available',
  isLoading = false,
  children,
  className = '',
  ...props
}) => {
  if (children) {
    return (
      <div className={`${styles.tableContainer} ${className}`} {...props}>
        <table className={styles.table}>
          {children}
        </table>
      </div>
    );
  }

  if (!isLoading && (!data || data.length === 0)) {
    return <div className={`${styles.emptyState} ${className}`}>{emptyMessage}</div>;
  }

  return (
    <div className={`${styles.tableContainer} ${className}`} {...props}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={styles.tr}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={styles.td} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
