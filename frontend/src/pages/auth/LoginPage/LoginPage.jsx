import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) {
      next.password = 'Password is required.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
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
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left panel — hospitality imagery & testimonial */}
      <div className={styles.visualPanel}>
        <img
          src="https://images.unsplash.com/photo-1782113268782-202ccef98e50?w=1200&h=1600&fit=crop&auto=format"
          alt="Grand hotel lobby with elegant chandeliers"
          className={styles.visualImage}
        />
        <div className={styles.visualOverlay} />

        {/* Brand mark */}
        <div className={styles.visualBrand}>
          <Link to="/" className={styles.brandLink} aria-label="ADAR - book form anywhere">
            <img
              src="/ADAR_Logo_Assets/out/light/adar_logo_light_horizontal.svg"
              alt="ADAR - book form anywhere"
              className={styles.brandLogoImgWhite}
            />
          </Link>
        </div>

        {/* Hospitality quote & trust score */}
        <div className={styles.visualContent}>
          <blockquote className={styles.quote}>
            &ldquo;Every stay is a story worth telling.&rdquo;
          </blockquote>
          <p className={styles.trustText}>Trusted by thousands of guests worldwide · book form anywhere</p>
          <div className={styles.stars} aria-label="5 star rating">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — authentication form */}
      <div className={styles.formPanel}>
        {/* Mobile brand header */}
        <Link to="/" className={styles.mobileBrand} aria-label="ADAR - book form anywhere">
          <img
            src="/ADAR_Logo_Assets/out/dark/adar_logo_dark_horizontal.svg"
            alt="ADAR - book form anywhere"
            className={styles.mobileBrandLogoImg}
          />
        </Link>

        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>
              Sign in to manage your reservations and continue your journey.
            </p>
          </div>

          {error && (
            <div role="alert" className={styles.alert}>
              <svg className={styles.alertIcon} width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            {/* Email field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="name@example.com"
                  className={`${styles.input} ${fieldErrors.email ? styles.hasError : ''}`}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  required
                />
              </div>
              {fieldErrors.email && (
                <span id="email-error" role="alert" className={styles.fieldError}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  className={`${styles.input} ${styles.passwordInput} ${fieldErrors.password ? styles.hasError : ''}`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.eyeButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1 4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span id="password-error" role="alert" className={styles.fieldError}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer switch to register */}
          <div className={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchLink}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;


