import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './AccessDeniedPage.module.css';

function AccessDeniedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case 'guest':
        navigate('/guest/dashboard');
        break;
      case 'receptionist':
        navigate('/receptionist/dashboard');
        break;
      case 'hotel_manager':
        navigate('/admin/dashboard');
        break;
      case 'super_admin':
        navigate('/super-admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Access restricted</h1>
      <p className={styles.message}>You don't have permission to access this page.</p>
      <button onClick={handleReturn} className={styles.button}>
        Return to dashboard
      </button>
    </div>
  );
}

export default AccessDeniedPage;
