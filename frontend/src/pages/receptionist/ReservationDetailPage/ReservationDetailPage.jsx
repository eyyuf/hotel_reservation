import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Modal from '../../../components/ui/Modal/Modal';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { useToast } from '../../../context/ToastContext';
import { formatDate, calculateNights } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ArrowLeft } from 'lucide-react';
import styles from './ReservationDetailPage.module.css';

export default function ReservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'card',
    transaction_reference: ''
  });

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const res = await receptionistApi.getReservation(id);
      setReservation(res.data?.data);
    } catch (err) {
      addToast('Failed to load reservation details', 'error');
      navigate('/receptionist/reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, successMsg) => {
    try {
      setActionLoading(true);
      await action(id);
      addToast(successMsg, 'success');
      fetchReservation();
    } catch (err) {
      addToast(`Action failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setActionLoading(true);
      await receptionistApi.recordPayment(id, {
        amount: Number(paymentData.amount),
        payment_method: paymentData.payment_method,
        transaction_reference: paymentData.transaction_reference
      });
      addToast('Payment recorded successfully', 'success');
      setPaymentModalOpen(false);
      fetchReservation();
    } catch (err) {
      addToast('Failed to record payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    try {
      setActionLoading(true);
      await receptionistApi.cancelReservation(id, { cancellation_reason: 'Cancelled by receptionist' });
      addToast('Reservation cancelled successfully', 'success');
      setCancelDialogOpen(false);
      fetchReservation();
    } catch (err) {
      addToast('Failed to cancel reservation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><Skeleton height={400} /></div>;
  }

  if (!reservation) return null;

  const nights = calculateNights(reservation.check_in_date, reservation.check_out_date);

  return (
    <div className={styles.container}>
      <Link to="/receptionist/reservations" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to reservations
      </Link>

      <PageHeader 
        title={`Reservation #${reservation.booking_reference}`} 
        action={
          <Badge variant={
            reservation.status === 'confirmed' ? 'success' : 
            reservation.status === 'cancelled' ? 'error' : 
            reservation.status === 'pending' ? 'warning' : 'info'
          }>
            {reservation.status}
          </Badge>
        }
      />

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Stay Details</h3>
          
          <div className={styles.detailRow}>
            <span className={styles.label}>Guest</span>
            <span className={styles.value}>{reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}` : 'Walk-in'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Room Type</span>
            <span className={styles.value}>{reservation.room_type?.name || '-'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Check-in</span>
            <span className={styles.value}>{formatDate(reservation.check_in_date)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Check-out</span>
            <span className={styles.value}>{formatDate(reservation.check_out_date)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Nights</span>
            <span className={styles.value}>{nights}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Rooms</span>
            <span className={styles.value}>{reservation.number_of_rooms}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Guests</span>
            <span className={styles.value}>{reservation.adults} Adults, {reservation.children} Children</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Total Amount</span>
            <span className={styles.value}>{formatCurrency(reservation.total_amount)}</span>
          </div>
          {reservation.special_requests && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Special Requests</span>
              <span className={styles.value}>{reservation.special_requests}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Actions</h3>
            
            {reservation.status === 'confirmed' && (
              <Button 
                onClick={() => handleAction(receptionistApi.checkIn, 'Checked in successfully')}
                disabled={actionLoading}
              >
                Check in
              </Button>
            )}
            
            {reservation.status === 'checked_in' && (
              <Button 
                onClick={() => handleAction(receptionistApi.checkOut, 'Checked out successfully')}
                disabled={actionLoading}
              >
                Check out
              </Button>
            )}

            {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
              <Button 
                variant="danger" 
                onClick={() => setCancelDialogOpen(true)}
                disabled={actionLoading}
              >
                Cancel reservation
              </Button>
            )}

            <Button 
              variant="secondary" 
              onClick={() => {
                setPaymentData(prev => ({ ...prev, amount: reservation.total_amount }));
                setPaymentModalOpen(true);
              }}
              disabled={actionLoading}
            >
              Record payment
            </Button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
      >
        <div className={styles.modalContent}>
          <Input 
            type="number" 
            label="Amount" 
            value={paymentData.amount}
            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
          />
          <Select 
            label="Payment Method"
            value={paymentData.payment_method}
            onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'mobile_money', label: 'Mobile Money' }
            ]}
          />
          <Input 
            label="Transaction Reference (Optional)" 
            value={paymentData.transaction_reference}
            onChange={(e) => setPaymentData(prev => ({ ...prev, transaction_reference: e.target.value }))}
          />
          <Button onClick={handleRecordPayment} disabled={actionLoading}>Confirm payment</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel reservation ${reservation.booking_reference}? This action cannot be undone.`}
        confirmText="Yes, cancel"
        cancelText="No, keep it"
        onConfirm={handleCancelReservation}
        onClose={() => setCancelDialogOpen(false)}
      />
    </div>
  );
}