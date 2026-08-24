import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './RegisterPage.module.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await register(formData);
      navigate('/guest/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create your account</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="first_name" className={styles.label}>First Name</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className={styles.input}
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="last_name" className={styles.label}>Last Name</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className={styles.input}
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className={styles.input}
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>Phone (Optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={styles.input}
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          <span className={styles.helpText}>Minimum 8 characters</span>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password_confirmation" className={styles.label}>Confirm Password</label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            className={styles.input}
            value={formData.password_confirmation}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <button 
          type="submit" 
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      
      <div className={styles.footer}>
        <p className={styles.linkText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
