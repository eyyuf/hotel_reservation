import { Link, Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

function AuthLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logoLink}>
            <span className={styles.logo}>HotelHub</span>
          </Link>
          <p className={styles.tagline}>Hotel Management & Reservations</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
