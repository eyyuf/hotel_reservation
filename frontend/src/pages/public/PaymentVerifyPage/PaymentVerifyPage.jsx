import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { paymentApi } from '../../../services/payments/paymentApi';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button/Button';
import styles from './PaymentVerifyPage.module.css';

const PaymentVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const txRef = searchParams.get('tx_ref');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!txRef) {
      setLoading(false);
      setPaymentStatus('failed');
      setErrorMessage('Missing transaction reference in return URL.');
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      try {
        const response = await paymentApi.verifyPayment(txRef);
        const data = response.data?.data;

        if (data?.status === 'successful') {
          showToast('Payment confirmed successfully!', 'success');
          navigate('/confirmation', {
            state: {
              reservation: data.reservation,
              hotel: data.hotel,
              roomType: data.room_type,
              paymentSuccess: true,
            },
            replace: true,
          });
          return;
        }

        setPaymentStatus(data?.status || 'failed');
        setErrorMessage(response.data?.message || 'Payment was not marked successful.');
        setLoading(false);
      } catch (err) {
        console.error('Payment verification failed:', err);
        const responseData = err.response?.data;
        const status = responseData?.data?.status;

        setPaymentStatus(status || 'failed');
        const msg = responseData?.message || 'Payment verification failed.';
        setErrorMessage(msg);
        showToast(msg, 'error');
        setLoading(false);
      }
    };

    verify();
  }, [txRef, navigate, showToast]);

  const isPending = paymentStatus === 'pending';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <h1 className={styles.title}>Verifying Payment</h1>
              <p className={styles.subtitle}>
                Please wait while we confirm your payment with Chapa...
              </p>
            </div>
          ) : (
            <div>
              <AlertCircle size={56} className={styles.errorIcon} />
              <h1 className={styles.title}>
                {isPending ? 'Payment Pending Verification' : 'Payment Verification Issue'}
              </h1>
              <p className={styles.subtitle}>{errorMessage}</p>
              <div className={styles.actions}>
                {isPending && (
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    Check Status Again
                  </Button>
                )}
                <Button variant={isPending ? 'secondary' : 'primary'} onClick={() => navigate('/guest/reservations')}>
                  My Reservations
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentVerifyPage;
