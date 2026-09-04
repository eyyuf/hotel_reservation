import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const user = await login(email, password);
      const requestedPath = location.state?.from;
      if (requestedPath && user.role === 'guest') {
        navigate(requestedPath, { replace: true, state: location.state?.state });
        return;
      }
      // Redirect based on role
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
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Welcome back</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button 
          type="submit" 
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>
      
      <div className={styles.footer}>
        <p className={styles.linkText}>
          Don't have an account? <Link to="/register" className={styles.link}>Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

