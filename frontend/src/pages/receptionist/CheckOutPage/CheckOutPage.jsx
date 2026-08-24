import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { useToast } from '../../../context/ToastContext';
import styles from './CheckOutPage.module.css';

export default function CheckOutPage() {
  const { addToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, guestName: '' });

  useEffect(() => {
    fetchDepartures();
  }, []);

  const fetchDepartures = async () => {
    try {
      setLoading(true);
      const res = await receptionistApi.getReservations({ limit: 1000 });
      const raw = res.data?.data;
      const all = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
      const departures = all.filter(r => r.status === 'checked_in');
      setReservations(departures);
    } catch (err) {
      addToast('Failed to load departures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      await receptionistApi.checkOut(confirmDialog.id);
      addToast('Guest checked out successfully', 'success');
      setConfirmDialog({ isOpen: false, id: null, guestName: '' });
      fetchDepartures();
    } catch (err) {
      addToast('Failed to check out guest', 'error');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'booking_reference', label: 'Booking Ref' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'actions', label: 'Action', render: (r) => (
      <Button 
        size="sm" 
        onClick={() => setConfirmDialog({ isOpen: true, id: r.id, guestName: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' })}
      >
        Check out
      </Button>
    )},
  ];

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Check-out" 
        description="Process guest departures"
      />

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '20px' }}><Skeleton height={200} /></div>
        ) : reservations.length === 0 ? (
          <EmptyState title="No departures pending" description="There are no guests currently checked in." />
        ) : (
          <Table columns={columns} data={reservations} />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Check-out"
        message={`Check out guest ${confirmDialog.guestName}?`}
        confirmText="Confirm check-out"
        cancelText="Cancel"
        onConfirm={handleCheckOut}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, guestName: '' })}
      />
    </div>
  );
}