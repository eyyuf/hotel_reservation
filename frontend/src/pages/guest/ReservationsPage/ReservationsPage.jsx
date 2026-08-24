import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { enrichReservation } from '../../../utils/enrichReservation';
import { formatDate } from '../../../utils/formatDate';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import Pagination from '../../../components/ui/Pagination/Pagination';
import styles from './ReservationsPage.module.css';

const ReservationsPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ lastPage: 1 });

  useEffect(() => {
    fetchReservations();
  }, [activeTab, page]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await reservationApi.getReservations({ page, per_page: 10 });
      let filtered = response.data.data || [];
      
      if (activeTab === 'upcoming') {
        filtered = filtered.filter(r => ['pending', 'confirmed'].includes(r.status));
      } else if (activeTab === 'past') {
        filtered = filtered.filter(r => ['checked_in', 'checked_out'].includes(r.status));
      } else if (activeTab === 'cancelled') {
        filtered = filtered.filter(r => r.status === 'cancelled');
      }
      
      setReservations(await Promise.all(filtered.map(enrichReservation)));
      if (response.data.meta) setPagination({ lastPage: response.data.meta.last_page });
    } catch (error) {
      console.error('Error fetching reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      checked_in: 'info',
      checked_out: 'default',
      cancelled: 'error'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'booking_reference', label: 'Booking Ref' },
    { 
      key: 'hotel', label: 'Hotel', 
      render: (row) => row.hotel?.name || 'N/A'
    },
    { 
      key: 'dates', label: 'Dates', 
      render: (row) => `${formatDate(row.check_in)} – ${formatDate(row.check_out)}`
    },
    { 
      key: 'status', label: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'action', label: 'Action',
      render: (row) => (
        <Link to={`/guest/reservations/${row.reservation_id}`} className={styles.actionLink}>View</Link>
      )
    }
  ];

  return (
    <div className={styles.page}>
      <PageHeader 
        title="Reservations" 
        description="Manage your upcoming and previous reservations."
      />

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('upcoming'); setPage(1); }}
        >
          Upcoming
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'past' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('past'); setPage(1); }}
        >
          Past
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('cancelled'); setPage(1); }}
        >
          Cancelled
        </button>
      </div>

      <div className={styles.content}>
        <Table 
          columns={columns} 
          data={reservations} 
          isLoading={loading}
          emptyMessage={`No ${activeTab} reservations found.`}
        />
        
        {pagination.lastPage > 1 && (
          <div className={styles.pagination}>
            <Pagination 
              currentPage={page} 
              totalPages={pagination.lastPage} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;
