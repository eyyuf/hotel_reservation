import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ExternalLink } from 'lucide-react';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { paymentApi } from '../../../services/payments/paymentApi';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button/Button';
import styles from './PaymentPage.module.css';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [loading, setLoading] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const activeTxRefRef = useRef(null);

  if (!location.state || !location.state.reservation) {
    return <Navigate to="/" />;
  }

  const { reservation, hotel, roomType } = location.state;

  const methodMap = { chapa: 'chapa', card: 'card', mobile: 'mobile_money', bank: 'bank_transfer' };

  const handleVerifyStatus = async () => {
    const txRef = activeTxRefRef.current;
    if (!txRef || isCheckingStatus) return;

    setIsCheckingStatus(true);

    try {
      const response = await paymentApi.verifyPayment(txRef);
      const data = response.data?.data;

      if (data?.status === 'successful') {
        showToast('Payment confirmed successfully!', 'success');
        navigate('/confirmation', {
          state: {
            reservation: data.reservation || reservation,
            hotel: data.hotel || hotel,
            roomType: data.room_type || roomType,
            paymentSuccess: true,
          },
          replace: true,
        });
        return;
      }

      showToast('Payment is still pending. Complete your payment in the Chapa tab, then verify again.', 'info');
    } catch (error) {
      console.error('Payment verification check error:', error.response?.data || error.message);
      const status = error.response?.data?.data?.status;
      if (status === 'failed') {
        const msg = error.response?.data?.message || 'Payment verification failed.';
        showToast(msg, 'error');
        setIsWaitingForPayment(false);
      } else {
        const msg = error.response?.data?.message || 'Payment is still being processed. Complete your payment in the Chapa tab, then verify again.';
        showToast(msg, 'info');
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePayment = async () => {
    if (loading || isWaitingForPayment) return;

    // Open placeholder tab synchronously on click to prevent browser popup blockers
    let paymentTab = null;
    try {
      paymentTab = window.open('about:blank', '_blank');
    } catch (e) {
      console.warn('Unable to pre-open window:', e);
    }

    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(reservation.total_amount),
        payment_method: methodMap[paymentMethod] || paymentMethod
      };
      
      const response = await reservationApi.createPayment(reservation.reservation_id, paymentData);
      const paymentId = response.data?.data?.payment_id;
      
      if (!paymentId) {
        throw new Error('Payment initiation failed.');
      }

      // Initialize Chapa checkout
      const initResponse = await paymentApi.initializePayment(paymentId);
      const nextCheckoutUrl = initResponse.data?.data?.checkout_url;
      const txRef = initResponse.data?.data?.transaction_reference;

      if (nextCheckoutUrl) {
        if (paymentTab && !paymentTab.closed) {
          try {
            paymentTab.opener = null;
          } catch (e) {}
          paymentTab.location.href = nextCheckoutUrl;
        } else {
          window.open(nextCheckoutUrl, '_blank', 'noopener,noreferrer');
        }

        activeTxRefRef.current = txRef;
        setCheckoutUrl(nextCheckoutUrl);
        setIsWaitingForPayment(true);
        setLoading(false);

        showToast("Complete your payment in the Chapa tab. When you're finished, return here and verify your payment.", 'info');
        return;
      }

      throw new Error('Did not receive a valid checkout URL from Chapa.');
    } catch (error) {
      if (paymentTab && !paymentTab.closed) {
        try {
          paymentTab.close();
        } catch (e) {}
      }
      console.error('Payment error:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || error.message || '';
      
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
                <label className={`${styles.methodOption} ${paymentMethod === 'chapa' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="chapa" 
                    checked={paymentMethod === 'chapa'} 
                    onChange={(e) => !isWaitingForPayment && setPaymentMethod(e.target.value)} 
                    disabled={isWaitingForPayment}
                    className={styles.radio}
                  />
                  <CreditCard size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>Chapa (Cards, Telebirr, CBEBirr)</span>
                </label>

                <label className={`${styles.methodOption} ${paymentMethod === 'card' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={(e) => !isWaitingForPayment && setPaymentMethod(e.target.value)} 
                    disabled={isWaitingForPayment}
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
                    onChange={(e) => !isWaitingForPayment && setPaymentMethod(e.target.value)} 
                    disabled={isWaitingForPayment}
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
                    onChange={(e) => !isWaitingForPayment && setPaymentMethod(e.target.value)} 
                    disabled={isWaitingForPayment}
                    className={styles.radio}
                  />
                  <Building2 size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>Bank Transfer</span>
                </label>
              </div>

              {isWaitingForPayment && (
                <div className={styles.infoNotice}>
                  <ExternalLink size={20} className={styles.noticeIcon} />
                  <div>
                    <strong>Payment opened in a new tab.</strong>
                    <div>Complete your payment in the Chapa tab. When you're finished, return here and verify your payment.</div>
                  </div>
                </div>
              )}

              <div className={styles.action}>
                {isWaitingForPayment ? (
                  <div className={styles.buttonStack}>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      size="large"
                      onClick={handleVerifyStatus} 
                      isLoading={isCheckingStatus}
                    >
                      {isCheckingStatus ? 'Checking Payment Status...' : "I've Completed Payment"}
                    </Button>
                    {checkoutUrl && (
                      <Button
                        variant="secondary"
                        fullWidth
                        size="medium"
                        onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
                      >
                        Reopen Payment Tab
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    fullWidth 
                    size="large"
                    onClick={handlePayment} 
                    isLoading={loading}
                  >
                    Pay ETB {reservation.total_amount}
                  </Button>
                )}
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
