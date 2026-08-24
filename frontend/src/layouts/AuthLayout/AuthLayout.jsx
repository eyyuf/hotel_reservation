import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

function AuthLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>HotelHub</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
