import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { useToast } from '../../../context/ToastContext';
import { getLocalDateString, isSameDay } from '../../../utils/formatDate';
import styles from './CheckInPage.module.css';

export default function CheckInPage() {
  const { addToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, guestName: '' });

  useEffect(() => {
    fetchArrivals();
  }, []);

  const fetchArrivals = async () => {
    try {
      setLoading(true);
      const res = await receptionistApi.getReservations({ limit: 1000 });
      const raw = res.data?.data;
      const all = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
      const today = getLocalDateString();
      const arrivals = all.filter(r => isSameDay(r.check_in_date || r.check_in, today) && r.status === 'confirmed');
      setReservations(arrivals);
    } catch (err) {
      addToast('Failed to load arrivals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await receptionistApi.checkIn(confirmDialog.id);
      addToast('Guest checked in successfully', 'success');
      setConfirmDialog({ isOpen: false, id: null, guestName: '' });
      fetchArrivals();
    } catch (err) {
      addToast('Failed to check in guest', 'error');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'booking_reference', label: 'Booking Ref' },
    { key: 'actions', label: 'Action', render: (r) => (
      <Button 
        size="sm" 
        onClick={() => setConfirmDialog({ isOpen: true, id: r.id, guestName: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' })}
      >
        Check in
      </Button>
    )},
  ];

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Check-in" 
        description="Process guest arrivals for today"
      />

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '20px' }}><Skeleton height={200} /></div>
        ) : reservations.length === 0 ? (
          <EmptyState title="No arrivals for today" description="All expected guests have been checked in." />
        ) : (
          <Table columns={columns} data={reservations} />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Check-in"
        message={`Check in guest ${confirmDialog.guestName}?`}
        confirmText="Confirm check-in"
        cancelText="Cancel"
        onConfirm={handleCheckIn}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, guestName: '' })}
      />
    </div>
  );
}