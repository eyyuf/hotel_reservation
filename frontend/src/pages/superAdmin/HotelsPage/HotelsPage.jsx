import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { superAdminApi } from '../../../services/superAdmin/superAdminApi';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import Input from '../../../components/ui/Input/Input';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import { useToast } from '../../../context/ToastContext';
import { Building } from 'lucide-react';
import styles from './HotelsPage.module.css';

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', country: 'Ethiopia',
  });

  const loadHotels = async () => {
    try {
      const res = await superAdminApi.getHotels();
      const data = res.data?.data;
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load hotels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHotels(); }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await superAdminApi.createHotel(form);
      showToast('Hotel created successfully', 'success');
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '', address: '', city: '', country: 'Ethiopia' });
      loadHotels();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create hotel';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedHotel) return;
    const newStatus = selectedHotel.status === 'active' ? 'suspended' : 'active';
    try {
      await superAdminApi.updateHotelStatus(selectedHotel.hotel_id, { status: newStatus });
      showToast('Hotel status updated', 'success');
      loadHotels();
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setConfirmOpen(false);
      setSelectedHotel(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Hotels" description="Manage all platform hotels." />
        <Skeleton width="100%" height="300px" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Hotels"
        description="Manage all platform hotels."
        action={{ label: 'Add hotel', onClick: () => setModalOpen(true) }}
      />

      {hotels.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No hotels"
          description="No hotels have been added to the platform yet."
          actionLabel="Add hotel"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Country</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map(h => (
                <tr key={h.hotel_id}>
                  <td><Link to={`/super-admin/hotels/${h.hotel_id}`} className={styles.link}>{h.name}</Link></td>
                  <td>{h.city}</td>
                  <td>{h.country}</td>
                  <td>{h.email}</td>
                  <td><Badge variant={h.status === 'active' ? 'success' : 'error'}>{h.status}</Badge></td>
                  <td className={styles.actions}>
                    <Link to={`/super-admin/hotels/${h.hotel_id}`}><Button variant="secondary" size="sm">View</Button></Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setSelectedHotel(h); setConfirmOpen(true); }}
                    >
                      {h.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Hotel">
        <div className={styles.form}>
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} required />
          <Input label="City" name="city" value={form.city} onChange={handleChange} required />
          <Input label="Country" name="country" value={form.country} onChange={handleChange} required />
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create hotel'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title="Change Hotel Status"
        message={`Are you sure you want to ${selectedHotel?.status === 'active' ? 'suspend' : 'activate'} "${selectedHotel?.name}"?`}
        confirmText={selectedHotel?.status === 'active' ? 'Suspend' : 'Activate'}
        variant={selectedHotel?.status === 'active' ? 'danger' : 'default'}
      />
    </div>
  );
}
