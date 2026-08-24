import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { calculateNights, formatDate } from '../../../utils/formatDate';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
import Select from '../../../components/ui/Select/Select';
import styles from './ReservationPage.module.css';

const ReservationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    rooms: 1,
    adults: 1,
    children: 0,
    specialRequests: '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user && location.state?.hotel) {
      navigate('/login', { state: { from: location.pathname, state: location.state } });
    }
  }, [user, navigate, location]);

  if (!location.state || !location.state.hotel) {
    return <Navigate to="/" />;
  }

  const { hotel, roomType, checkIn, checkOut } = location.state;
  const nights = calculateNights(checkIn, checkOut);
  const totalAmount = nights * roomType.base_price * formData.rooms;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const reservationData = {
        hotel_id: hotel.id || hotel.hotel_id,
        room_type_id: roomType.room_type_id || roomType.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_rooms: parseInt(formData.rooms),
        adults: parseInt(formData.adults),
        children: parseInt(formData.children) || 0,
        special_requests: formData.specialRequests || null
      };

      const response = await reservationApi.createReservation(reservationData);
      navigate('/payment', { state: { reservation: response.data.data, hotel, roomType } });
    } catch (error) {
      console.error('Reservation error:', error.response?.data);
      const errData = error.response?.data;
      if (errData?.errors) {
        const firstError = Object.values(errData.errors).flat()[0];
        showToast(firstError || errData.message, 'error');
      } else {
        showToast(errData?.message || 'Failed to create reservation.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progress}>
          <div className={styles.step}>1. Select Stay</div>
          <div className={`${styles.step} ${styles.active}`}>2. Guest Details</div>
          <div className={styles.step}>3. Payment</div>
          <div className={styles.step}>4. Confirmation</div>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            <form onSubmit={handleSubmit} className={styles.formCard}>
              <h2 className={styles.cardTitle}>Guest Information</h2>
              
              <div className={styles.formGrid}>
                <Input label="First name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Last name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Input label="Email address" type="email" name="email" value={formData.email} onChange={handleChange} required />
                <Input label="Phone number" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>

              <h2 className={styles.cardTitle}>Stay Details</h2>
              <div className={styles.formGrid}>
                <Select 
                  label="Number of rooms" 
                  name="rooms" 
                  value={formData.rooms} 
                  onChange={handleChange}
                  options={[1,2,3,4,5].map(n => ({label: `${n} Room${n>1?'s':''}`, value: n}))}
                />
                <Select 
                  label="Adults" 
                  name="adults" 
                  value={formData.adults} 
                  onChange={handleChange}
                  options={[1,2,3,4,5].map(n => ({label: `${n}`, value: n}))}
                />
                <Select 
                  label="Children" 
                  name="children" 
                  value={formData.children} 
                  onChange={handleChange}
                  options={[0,1,2,3,4].map(n => ({label: `${n}`, value: n}))}
                />
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.label}>Special requests</label>
                <textarea 
                  name="specialRequests"
                  className={styles.textarea}
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="Any special requests? (Optional)"
                  rows="4"
                />
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                Continue to payment
              </Button>
            </form>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h2 className={styles.cardTitle}>Reservation Summary</h2>
              
              <div className={styles.summarySection}>
                <h3 className={styles.hotelName}>{hotel.name}</h3>
                <p className={styles.roomName}>{roomType.name}</p>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.dateRow}>
                  <span>Check-in</span>
                  <strong>{formatDate(checkIn)}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>Check-out</span>
                  <strong>{formatDate(checkOut)}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>Duration</span>
                  <span>{nights} Night{nights !== 1 && 's'}</span>
                </div>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.priceRow}>
                  <span>Room rate (x {formData.rooms})</span>
                  <span>ETB {roomType.base_price} / night</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span className={styles.totalAmount}>ETB {totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
