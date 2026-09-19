import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { batchEnrichReservations } from '../../../utils/enrichReservation';
import { formatDate } from '../../../utils/formatDate';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Pagination from '../../../components/ui/Pagination/Pagination';
import styles from './ReservationsPage.module.css';

const ReservationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ lastPage: 1 });

  useEffect(() => {
    let isMounted = true;

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await reservationApi.getReservations({ page, per_page: 10 });
        if (!isMounted) return;
        let filtered = response.data.data || [];
        
        if (activeTab === 'upcoming') {
          filtered = filtered.filter(r => ['pending', 'confirmed'].includes(r.status));
        } else if (activeTab === 'past') {
          filtered = filtered.filter(r => ['checked_in', 'checked_out'].includes(r.status));
        } else if (activeTab === 'cancelled') {
          filtered = filtered.filter(r => r.status === 'cancelled');
        }
        
        const enriched = await batchEnrichReservations(filtered);
        if (!isMounted) return;
        setReservations(enriched);
        if (response.data.meta) setPagination({ lastPage: response.data.meta.last_page });
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching reservations', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReservations();

    return () => {
      isMounted = false;
    };
  }, [activeTab, page]);

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

  const handlePayNow = useCallback((reservation) => {
    navigate('/payment', {
      state: {
        reservation: {
          ...reservation,
          reservation_id: reservation.reservation_id || reservation.id,
        },
        hotel: reservation.hotel,
        roomType: reservation.room_type,
      },
    });
  }, [navigate]);

  const columns = useMemo(() => [
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
        <div className={styles.actionCell}>
          {row.status === 'pending' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handlePayNow(row)}
            >
              Pay Now
            </Button>
          )}
          <Link 
            to={`/guest/reservations/${row.reservation_id || row.id}`} 
            state={{ reservation: row }}
            className={styles.actionLink}
          >
            View
          </Link>
        </div>
      )
    }
  ], [handlePayNow]);

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
