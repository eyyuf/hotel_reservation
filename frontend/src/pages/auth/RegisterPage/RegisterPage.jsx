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
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    if (!formData.first_name.trim()) next.first_name = 'First name is required.';
    if (!formData.last_name.trim()) next.last_name = 'Last name is required.';
    if (!formData.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      next.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      next.password = 'Password must be at least 8 characters long.';
    }
    if (!formData.password_confirmation) {
      next.password_confirmation = 'Please confirm your password.';
    } else if (formData.password !== formData.password_confirmation) {
      next.password_confirmation = 'Passwords do not match.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-flight client validation
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      // Prioritize primary error message if password rules failed
      if (validationErrors.password) {
        setError(validationErrors.password);
      } else if (validationErrors.password_confirmation) {
        setError(validationErrors.password_confirmation);
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register(formData);
      navigate('/guest/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left panel — hospitality imagery & testimonial */}
      <div className={styles.visualPanel}>
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=1600&fit=crop&auto=format"
          alt="Luxury hotel resort and evening ambience"
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

      {/* Right panel — registration form */}
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
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>
              Join us to manage your reservations and make every stay easier.
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
            {/* First and Last Name row */}
            <div className={styles.nameRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="first_name" className={styles.label}>
                  First Name
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={formData.first_name}
                    disabled={isSubmitting}
                    onChange={handleChange}
                    placeholder="Jane"
                    className={`${styles.input} ${fieldErrors.first_name ? styles.hasError : ''}`}
                    aria-invalid={!!fieldErrors.first_name}
                    aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.first_name && (
                  <span id="first_name-error" role="alert" className={styles.fieldError}>
                    {fieldErrors.first_name}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="last_name" className={styles.label}>
                  Last Name
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    disabled={isSubmitting}
                    onChange={handleChange}
                    placeholder="Doe"
                    className={`${styles.input} ${fieldErrors.last_name ? styles.hasError : ''}`}
                    aria-invalid={!!fieldErrors.last_name}
                    aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.last_name && (
                  <span id="last_name-error" role="alert" className={styles.fieldError}>
                    {fieldErrors.last_name}
                  </span>
                )}
              </div>
            </div>

            {/* Email field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  disabled={isSubmitting}
                  onChange={handleChange}
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

            {/* Phone field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="phone" className={styles.label}>
                <span>Phone number</span>
                <span className={styles.optionalBadge}>Optional</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  disabled={isSubmitting}
                  onChange={handleChange}
                  placeholder="+251 91 123 4567"
                  className={`${styles.input} ${fieldErrors.phone ? styles.hasError : ''}`}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
              </div>
              {fieldErrors.phone && (
                <span id="phone-error" role="alert" className={styles.fieldError}>
                  {fieldErrors.phone}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  disabled={isSubmitting}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`${styles.input} ${styles.passwordInput} ${fieldErrors.password ? styles.hasError : ''}`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-help password-error"
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
              <span id="password-help" className={styles.helperText}>
                Minimum 8 characters
              </span>
              {fieldErrors.password && (
                <span id="password-error" role="alert" className={styles.fieldError}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="password_confirmation" className={styles.label}>
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password_confirmation}
                  disabled={isSubmitting}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`${styles.input} ${styles.passwordInput} ${fieldErrors.password_confirmation ? styles.hasError : ''}`}
                  aria-invalid={!!fieldErrors.password_confirmation}
                  aria-describedby={fieldErrors.password_confirmation ? 'password_confirmation-error' : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={styles.eyeButton}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                >
                  {showConfirmPassword ? (
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
              {fieldErrors.password_confirmation && (
                <span id="password_confirmation-error" role="alert" className={styles.fieldError}>
                  {fieldErrors.password_confirmation}
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
                  <span>Creating account…</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer switch to login */}
          <div className={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

