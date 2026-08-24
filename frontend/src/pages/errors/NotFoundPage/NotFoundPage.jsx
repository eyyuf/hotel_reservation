import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.message}>The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className={styles.button}>Go to home</Link>
    </div>
  );
}

export default NotFoundPage;
