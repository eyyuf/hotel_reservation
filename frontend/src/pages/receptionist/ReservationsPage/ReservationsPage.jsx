import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import Pagination from '../../../components/ui/Pagination/Pagination';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { useToast } from '../../../context/ToastContext';
import styles from './ReservationsPage.module.css';
import { formatDate } from '../../../utils/formatDate';

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReservations();
  }, [page]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await receptionistApi.getReservations({ page, limit: 20 });
      const raw = res.data?.data;
      setReservations(Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []));
      setTotalPages(res.data?.meta?.total_pages || 1);
    } catch (err) {
      addToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = (r.booking_reference?.toLowerCase() || '').includes(searchLower) ||
                          (r.guest ? `${r.guest.first_name} ${r.guest.last_name}`.toLowerCase() : '').includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const columns = [
    { key: 'booking_reference', label: 'Booking Ref' },
    { key: 'guest', label: 'Guest', render: (r) => r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Walk-in' },
    { key: 'room_type', label: 'Room Type', render: (r) => r.room_type?.name || '-' },
    { key: 'check_in_date', label: 'Check-in', render: (r) => formatDate(r.check_in_date) },
    { key: 'check_out_date', label: 'Check-out', render: (r) => formatDate(r.check_out_date) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'confirmed' ? 'success' : r.status === 'cancelled' ? 'error' : r.status === 'pending' ? 'warning' : 'info'}>{r.status}</Badge> },
    { key: 'actions', label: 'Actions', render: (r) => <Button variant="secondary" size="sm" onClick={() => navigate(`/receptionist/reservations/${r.id}`)}>View</Button> },
  ];

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Reservations" 
        description="Manage all hotel reservations"
        action={{ label: 'New reservation', onClick: () => navigate('/receptionist/reservations/create') }}
      />

      <div className={styles.filters}>
        <div className={styles.searchInput}>
          <Input 
            placeholder="Search reservations..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'checked_in', label: 'Checked In' },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '20px' }}><Skeleton height={300} /></div>
        ) : (
          <Table columns={columns} data={filteredReservations} emptyMessage="No reservations found. Try adjusting your filters." />
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}
    </div>
  );
}