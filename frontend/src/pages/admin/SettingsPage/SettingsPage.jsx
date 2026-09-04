import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { managerApi } from '../../../services/manager/managerApi';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import ImageGalleryManager from '../../../components/manager/ImageGalleryManager/ImageGalleryManager';
import { useToast } from '../../../context/ToastContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'gallery' ? 'gallery' : 'general';

  const [hotel, setHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    managerApi
      .getHotel()
      .then((res) => {
        const h = res.data?.data;
        setHotel(h);
        if (h) {
          setFormData({
            name: h.name || '',
            email: h.email || '',
            phone: h.phone || '',
            address: h.address || '',
            city: h.city || '',
            country: h.country || '',
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load hotel settings', err);
        showToast('Failed to load hotel settings', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = () => {
    setSaving(true);
    managerApi
      .updateHotel(formData)
      .then(() => showToast('Changes saved successfully', 'success'))
      .catch(() => showToast('Error saving changes', 'error'))
      .finally(() => setSaving(false));
  };

  const handleTabChange = (tab) => {
    setSearchParams(tab === 'gallery' ? { tab: 'gallery' } : {});
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Settings" description="Manage hotel information and photos." />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Settings"
        description={`Manage hotel profile and photo gallery for ${hotel?.name || 'your hotel'}.`}
      />

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('general')}
        >
          <Building2 size={18} />
          <span>General Information</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'gallery' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('gallery')}
        >
          <ImageIcon size={18} />
          <span>Photo Gallery</span>
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className={styles.formCard}>
          <div className={styles.grid}>
            <Input
              label="Hotel Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
          <div className={styles.actions}>
            <Button onClick={handleSave} isLoading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <ImageGalleryManager
          type="hotel"
          title="Hotel Photo Gallery"
          description="Upload exterior, lobby, and amenity photos to showcase your hotel on the public website."
        />
      )}
    </div>
  );
}
