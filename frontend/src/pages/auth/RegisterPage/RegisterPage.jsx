import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
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
          <Input
            id="first_name"
            name="first_name"
            label="First Name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          
          <Input
            id="last_name"
            name="last_name"
            label="Last Name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        
        <Input
          id="phone"
          name="phone"
          label="Phone (Optional)"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
        />

        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          helperText="Minimum 8 characters"
          required
          autoComplete="new-password"
        />
        
        <Input
          id="password_confirmation"
          name="password_confirmation"
          label="Confirm Password"
          type="password"
          value={formData.password_confirmation}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <Button 
          type="submit" 
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
        >
          Create account
        </Button>
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
