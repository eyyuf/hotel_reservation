import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      showToast('Profile updated successfully.', 'success');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader 
        title="Profile" 
        description="Manage your personal information."
      />

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <Input 
              label="First name" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
            />
            <Input 
              label="Last name" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
            />
            <Input 
              label="Email address" 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
            />
            <Input 
              label="Phone number" 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>
          <div className={styles.actions}>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save changes
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Security</h2>
        <div className={styles.securitySection}>
          <div className={styles.securityInfo}>
            <h3>Password</h3>
            <p>Update your password to keep your account secure.</p>
          </div>
          <Button variant="secondary" disabled>
            Change password
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
