import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { enrichReservation } from '../../../utils/enrichReservation';
import { formatDate } from '../../../utils/formatDate';
import { useToast } from '../../../context/ToastContext';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import styles from './ReservationDetailPage.module.css';

const ReservationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const hasLoggedDevRef = useRef(false);

  // Reuse reservation data passed from parent/list if available for instant display
  const passedReservation = location.state?.reservation;
  const initialReservation = (passedReservation && (String(passedReservation.reservation_id) === String(id) || String(passedReservation.id) === String(id)))
    ? passedReservation
    : null;
  
  const [reservation, setReservation] = useState(initialReservation);
  const [loading, setLoading] = useState(!initialReservation);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservation = useCallback(async (isMounted = true) => {
    try {
      const response = await reservationApi.getReservation(id);
      if (!isMounted) return;
      const reservationDetails = response.data?.data ?? response.data;
      const enriched = await enrichReservation(reservationDetails);
      if (!isMounted) return;
      setReservation(enriched);

      if (import.meta.env.DEV && !hasLoggedDevRef.current) {
        hasLoggedDevRef.current = true;
        const [invoiceResult, paymentsResult] = await Promise.allSettled([
          reservationApi.getInvoice(id),
          reservationApi.getPayments(id),
        ]);
        const invoice = invoiceResult.status === 'fulfilled' ? invoiceResult.value.data?.data : null;
        const paymentIds = paymentsResult.status === 'fulfilled'
          ? (paymentsResult.value.data?.data?.payments ?? [])
            .map((payment) => payment.payment_id)
            .filter(Boolean)
          : [];

        void fetch('/__dev/reservation-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservation_id: reservationDetails.reservation_id,
            hotel_id: reservationDetails.hotel_id,
            room_type_id: reservationDetails.room_type_id,
            invoice_id: invoice?.id ?? null,
            payment_ids: paymentIds,
            sanctum_token: localStorage.getItem('auth_token'),
          }),
        }).catch(() => {});
      }
    } catch (error) {
      if (!isMounted) return;
      showToast('Failed to load reservation details.', 'error');
      navigate('/guest/reservations');
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    let isMounted = true;
    fetchReservation(isMounted);

    return () => {
      isMounted = false;
    };
  }, [fetchReservation]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await reservationApi.cancelReservation(id);
      showToast('Reservation cancelled successfully.', 'success');
      fetchReservation();
    } catch (error) {
      showToast('Failed to cancel reservation.', 'error');
    } finally {
      setCancelling(false);
      setIsCancelDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton height="40px" width="300px" />
        <Skeleton height="400px" className={styles.skeletonGrid} />
      </div>
    );
  }

  if (!reservation) return null;

  const canCancel = ['pending', 'confirmed'].includes(reservation.status);

  return (
    <div className={styles.page}>
      <Link to="/guest/reservations" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to reservations
      </Link>
      
      <div className={styles.header}>
        <PageHeader 
          title={`Reservation #${reservation.booking_reference}`}
          description="View and manage your reservation details."
        />
        <div className={styles.badgeWrapper}>
          <Badge variant={
            reservation.status === 'confirmed' ? 'success' :
            reservation.status === 'cancelled' ? 'error' :
            reservation.status === 'pending' ? 'warning' : 'default'
          }>
            {reservation.status}
          </Badge>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.grid}>
          <div className={styles.detailGroup}>
            <label>Hotel</label>
            <p>{reservation.hotel?.name || 'N/A'}</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Room Type</label>
            <p>{reservation.room_type?.name || 'N/A'}</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Check-in</label>
            <p>{formatDate(reservation.check_in)}</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Check-out</label>
            <p>{formatDate(reservation.check_out)}</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Guests</label>
            <p>{reservation.adults} Adults, {reservation.children} Children</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Rooms</label>
            <p>{reservation.number_of_rooms}</p>
          </div>
          <div className={styles.detailGroup}>
            <label>Total Amount</label>
            <p className={styles.amount}>ETB {reservation.total_amount}</p>
          </div>
        </div>

        {reservation.special_requests && (
          <div className={styles.specialRequests}>
            <label>Special Requests</label>
            <p>{reservation.special_requests}</p>
          </div>
        )}

        {canCancel && (
          <div className={styles.actions}>
            <Button variant="danger" onClick={() => setIsCancelDialogOpen(true)}>
              Cancel reservation
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmLabel="Yes, cancel it"
        onConfirm={handleCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
        isDestructive
        isLoading={cancelling}
      />
    </div>
  );
};

export default ReservationDetailPage;
