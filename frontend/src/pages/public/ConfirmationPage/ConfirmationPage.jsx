import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';
import Button from '../../../components/ui/Button/Button';
import styles from './ConfirmationPage.module.css';

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state || !location.state.reservation) {
    return <Navigate to="/" />;
  }

  const { reservation, hotel, roomType } = location.state;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progress}>
          <div className={styles.step}>1. Select Stay</div>
          <div className={styles.step}>2. Guest Details</div>
          <div className={styles.step}>3. Payment</div>
          <div className={`${styles.step} ${styles.active}`}>4. Confirmation</div>
        </div>

        <div className={styles.card}>
          <div className={styles.successHeader}>
            <CheckCircle size={64} className={styles.successIcon} />
            <h1 className={styles.title}>Reservation Confirmed</h1>
            <p className={styles.subtitle}>Thank you for your booking! Your reservation details are below.</p>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Booking Reference</span>
              <strong className={styles.value}>#{reservation.booking_reference}</strong>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Hotel</span>
              <span className={styles.value}>{hotel?.name || 'Hotel Name'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Room Type</span>
              <span className={styles.value}>{roomType?.name || 'Standard Room'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Check-in</span>
              <span className={styles.value}>{formatDate(reservation.check_in)}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Check-out</span>
              <span className={styles.value}>{formatDate(reservation.check_out)}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Guests</span>
              <span className={styles.value}>{reservation.adults} Adults, {reservation.children} Children</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Total Amount</span>
              <strong className={styles.value}>ETB {reservation.total_amount}</strong>
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => navigate(`/guest/reservations/${reservation.reservation_id}`)}>
              View reservation
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
