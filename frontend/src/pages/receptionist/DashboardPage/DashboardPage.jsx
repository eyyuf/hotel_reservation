import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { useToast } from '../../../context/ToastContext';
import { getLocalDateString, isSameDay } from '../../../utils/formatDate';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await receptionistApi.getReservations({ limit: 1000 });
      const raw = res.data?.data;
      setReservations(Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []));
    } catch (err) {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await receptionistApi.checkIn(id);
      addToast('Guest checked in successfully', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to check in guest', 'error');
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await receptionistApi.checkOut(id);
      addToast('Guest checked out successfully', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to check out guest', 'error');
    }
  };

  const today = getLocalDateString();
  const formattedToday = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const arrivals = reservations.filter(r => isSameDay(r.check_in_date || r.check_in, today) && r.status === 'confirmed');
  const departures = reservations.filter(r => isSameDay(r.check_out_date || r.check_out, today) && r.status === 'checked_in');
  const checkedInCount = reservations.filter(r => r.status === 'checked_in').length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  const arrivalColumns = [
    { key: 'guest', label: 'Guest', render: (r) => r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'check_in_date', label: 'Check-in Date' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
    { key: 'actions', label: 'Action', render: (r) => <Button size="sm" onClick={() => handleCheckIn(r.id)}>Check in</Button> },
  ];

  const departureColumns = [
    { key: 'guest', label: 'Guest', render: (r) => r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant="info">{r.status}</Badge> },
    { key: 'actions', label: 'Action', render: (r) => <Button size="sm" onClick={() => handleCheckOut(r.id)}>Check out</Button> },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Good morning" description={formattedToday} />
        <div className={styles.kpiGrid}>
           <Skeleton height={100} />
           <Skeleton height={100} />
           <Skeleton height={100} />
           <Skeleton height={100} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Good morning" description={formattedToday} />
      
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{arrivals.length}</span>
          <span className={styles.kpiLabel}>Today's arrivals</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{departures.length}</span>
          <span className={styles.kpiLabel}>Today's departures</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{checkedInCount}</span>
          <span className={styles.kpiLabel}>Checked in</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{pendingCount}</span>
          <span className={styles.kpiLabel}>Pending</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's arrivals</h2>
        {arrivals.length === 0 ? (
          <EmptyState title="No arrivals today" description="There are no guests scheduled to arrive today." />
        ) : (
          <Table columns={arrivalColumns} data={arrivals} />
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's departures</h2>
        {departures.length === 0 ? (
          <EmptyState title="No departures today" description="There are no guests scheduled to depart today." />
        ) : (
          <Table columns={departureColumns} data={departures} />
        )}
      </div>
    </div>
  );
}