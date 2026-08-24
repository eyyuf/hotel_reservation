import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { managerApi } from '../../../services/manager/managerApi';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import Pagination from '../../../components/ui/Pagination/Pagination';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './ReservationsPage.module.css';

export default function ReservationsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    setLoading(true);
    managerApi.getReservations({ search, status })
      .then(res => {
        const raw = res.data?.data;
        setData(Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status]);

  const filtered = data.filter(r => {
    if (status !== 'all' && r.reservation_status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      return (r.booking_reference?.toLowerCase() || '').includes(s) ||
             (`${r.guest?.first_name} ${r.guest?.last_name}`.toLowerCase()).includes(s);
    }
    return true;
  });

  const columns = [
    { key: 'booking_reference', label: 'Booking Ref' },
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.first_name || ''} ${r.guest?.last_name || ''}`.trim() || '-' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'check_in_date', label: 'Check-in', render: (r) => formatDate(r.check_in_date) },
    { key: 'check_out_date', label: 'Check-out', render: (r) => formatDate(r.check_out_date) },
    { key: 'reservation_status', label: 'Status', render: (r) => <Badge variant={r.reservation_status === 'confirmed' ? 'success' : r.reservation_status === 'cancelled' ? 'error' : 'info'}>{r.reservation_status}</Badge> },
    { key: 'total_amount', label: 'Total', render: (r) => formatCurrency(r.total_amount) },
  ];

  return (
    <div className={styles.container}>
      <PageHeader title="Reservations" description="View all hotel reservations." />
      <div className={styles.filters}>
        <Input 
          placeholder="Search reservations" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <Select value={status} onChange={e => setStatus(e.target.value)} options={[
          { value: 'all', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]} />
      </div>
      {loading ? <Skeleton count={5} /> : (
        <Table columns={columns} data={filtered} emptyMessage="No reservations found." />
      )}
    </div>
  );
}
