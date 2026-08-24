import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { superAdminApi } from '../../../services/superAdmin/superAdminApi';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import Input from '../../../components/ui/Input/Input';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { Users } from 'lucide-react';
import styles from './HotelDetailPage.module.css';

export default function HotelDetailPage() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '',
  });

  const loadData = async () => {
    try {
      const [hotelRes, managersRes] = await Promise.all([
        superAdminApi.getHotel(hotelId),
        superAdminApi.getManagers(hotelId),
      ]);
      setHotel(hotelRes.data?.data || hotelRes.data);
      const mgrs = managersRes.data?.data;
      setManagers(Array.isArray(mgrs) ? mgrs : []);
    } catch (err) {
      console.error('Failed to load hotel', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [hotelId]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateManager = async () => {
    setSubmitting(true);
    try {
      await superAdminApi.createManager(hotelId, form);
      showToast('Manager created successfully', 'success');
      setModalOpen(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '' });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create manager';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleManagerStatus = async (manager) => {
    const newStatus = manager.account_status === 'active' ? 'suspended' : 'active';
    try {
      await superAdminApi.updateManagerStatus(manager.user_id, { account_status: newStatus });
      showToast('Manager status updated', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton width="100%" height="200px" />
      </div>
    );
  }

  if (!hotel) return <div className={styles.container}>Hotel not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link to="/super-admin/hotels">Hotels</Link> &gt; {hotel.name}
      </div>

      <div className={styles.infoCard}>
        <div className={styles.header}>
          <h2>{hotel.name}</h2>
          <Badge variant={hotel.status === 'active' ? 'success' : 'error'}>{hotel.status}</Badge>
        </div>
        <p>{hotel.address}, {hotel.city}, {hotel.country}</p>
        <p>{hotel.email} | {hotel.phone}</p>
      </div>

      <div className={styles.managersSection}>
        <div className={styles.sectionHeader}>
          <h3>Managers</h3>
          <Button onClick={() => setModalOpen(true)}>Add manager</Button>
        </div>

        {managers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No managers"
            description="No managers assigned to this hotel yet."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {managers.map(m => (
                  <tr key={m.user_id}>
                    <td>{m.first_name} {m.last_name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || '—'}</td>
                    <td><Badge variant={m.account_status === 'active' ? 'success' : 'error'}>{m.account_status}</Badge></td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleManagerStatus(m)}
                      >
                        {m.account_status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Manager">
        <div className={styles.form}>
          <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
          <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Button onClick={handleCreateManager} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create manager'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
