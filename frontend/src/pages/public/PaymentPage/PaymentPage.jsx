import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { paymentApi } from '../../../services/payments/paymentApi';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button/Button';
import styles from './PaymentPage.module.css';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  if (!location.state || !location.state.reservation) {
    return <Navigate to="/" />;
  }

  const { reservation, hotel, roomType } = location.state;

  const methodMap = { card: 'card', mobile: 'mobile_money', bank: 'bank_transfer' };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(reservation.total_amount),
        payment_method: methodMap[paymentMethod] || paymentMethod
      };
      
      const response = await reservationApi.createPayment(reservation.reservation_id, paymentData);
      
      // Simulate successful payment completion
      const paymentId = response.data?.data?.payment_id;
      if (paymentId) {
        try {
          await paymentApi.simulatePayment(paymentId);
        } catch (simErr) {
          console.warn('Payment simulation skipped:', simErr.response?.data?.message);
        }
      }
      
      navigate('/confirmation', { state: { reservation, hotel, roomType, paymentSuccess: true } });
    } catch (error) {
      console.error('Payment error:', error.response?.data);
      const errMsg = error.response?.data?.message || '';
      
      // If invoice not found, it means payment will be handled at check-in
      if (errMsg.includes('Invoice not found')) {
        showToast('Reservation confirmed! Payment will be collected at the hotel.', 'info');
        navigate('/confirmation', { state: { reservation, hotel, roomType, paymentSuccess: false } });
      } else {
        const errData = error.response?.data;
        const msg = errData?.errors ? Object.values(errData.errors).flat()[0] : (errMsg || 'Payment failed.');
        showToast(msg, 'error');
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progress}>
          <div className={styles.step}>1. Select Stay</div>
          <div className={styles.step}>2. Guest Details</div>
          <div className={`${styles.step} ${styles.active}`}>3. Payment</div>
          <div className={styles.step}>4. Confirmation</div>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Payment Method</h2>
              
              <div className={styles.methodList}>
                <label className={`${styles.methodOption} ${paymentMethod === 'card' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className={styles.radio}
                  />
                  <CreditCard size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>Credit / Debit Card</span>
                </label>
                
                <label className={`${styles.methodOption} ${paymentMethod === 'mobile' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="mobile" 
                    checked={paymentMethod === 'mobile'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className={styles.radio}
                  />
                  <Smartphone size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>Mobile Money (Telebirr)</span>
                </label>
                
                <label className={`${styles.methodOption} ${paymentMethod === 'bank' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="bank" 
                    checked={paymentMethod === 'bank'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className={styles.radio}
                  />
                  <Building2 size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>Bank Transfer</span>
                </label>
              </div>

              <div className={styles.action}>
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="large"
                  onClick={handlePayment} 
                  isLoading={loading}
                >
                  Pay ETB {reservation.total_amount}
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order Summary</h2>
              
              <div className={styles.summaryItem}>
                <span>Booking Reference</span>
                <strong>#{reservation.booking_reference}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Hotel</span>
                <strong>{hotel?.name}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Total Amount</span>
                <strong className={styles.totalAmount}>ETB {reservation.total_amount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
