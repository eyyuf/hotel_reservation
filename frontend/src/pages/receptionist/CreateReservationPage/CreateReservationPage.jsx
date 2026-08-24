import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import Button from '../../../components/ui/Button/Button';
import { receptionistApi } from '../../../services/receptionist/receptionistApi';
import { hotelApi } from '../../../services/hotels/hotelApi';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { calculateNights } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './CreateReservationPage.module.css';

export default function CreateReservationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    room_type_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_rooms: 1,
    adults: 1,
    children: 0,
    guest_user_id: '',
    special_requests: ''
  });

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        if (user?.hotel_id) {
          const res = await hotelApi.getRoomTypes(user.hotel_id);
          setRoomTypes(res.data?.data?.data || []);
        }
      } catch (err) {
        addToast('Failed to load room types', 'error');
      }
    };
    fetchRoomTypes();
  }, [user, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        number_of_rooms: Number(formData.number_of_rooms),
        adults: Number(formData.adults),
        children: Number(formData.children),
        guest_user_id: formData.guest_user_id ? Number(formData.guest_user_id) : null,
      };
      const res = await receptionistApi.createReservation(payload);
      addToast('Reservation created successfully', 'success');
      navigate(`/receptionist/reservations/${res.data?.data?.id}`);
    } catch (err) {
      addToast('Failed to create reservation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoomType = roomTypes.find(rt => (rt.room_type_id || rt.id) === Number(formData.room_type_id));
  const nights = formData.check_in_date && formData.check_out_date 
    ? calculateNights(formData.check_in_date, formData.check_out_date) 
    : 0;
  const totalPrice = selectedRoomType && nights > 0 
    ? selectedRoomType.base_price * nights * formData.number_of_rooms 
    : 0;

  return (
    <div className={styles.container}>
      <PageHeader 
        title="New reservation" 
        description="Create a walk-in or phone reservation"
      />

      <form onSubmit={handleSubmit} className={styles.container}>
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Room Selection</h3>
          <Select
            label="Room Type"
            name="room_type_id"
            value={formData.room_type_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select a room type...' },
              ...roomTypes.map(rt => ({ value: rt.room_type_id || rt.id, label: `${rt.name} (${formatCurrency(rt.base_price)}/night)` }))
            ]}
            required
          />
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Stay Details</h3>
          <div className={styles.grid2}>
            <Input
              type="date"
              label="Check-in Date"
              name="check_in_date"
              value={formData.check_in_date}
              onChange={handleChange}
              required
            />
            <Input
              type="date"
              label="Check-out Date"
              name="check_out_date"
              value={formData.check_out_date}
              onChange={handleChange}
              required
            />
            <Input
              type="number"
              label="Number of Rooms"
              name="number_of_rooms"
              min="1"
              value={formData.number_of_rooms}
              onChange={handleChange}
              required
            />
            <div className={styles.grid2}>
              <Input
                type="number"
                label="Adults"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleChange}
                required
              />
              <Input
                type="number"
                label="Children"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Guest Details</h3>
          <Input
            label="Guest User ID (Optional)"
            name="guest_user_id"
            placeholder="Leave blank for walk-in"
            value={formData.guest_user_id}
            onChange={handleChange}
          />
          <Input
            as="textarea"
            label="Special Requests"
            name="special_requests"
            value={formData.special_requests}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {totalPrice > 0 && (
          <div className={styles.summary}>
            <span>Total Price ({nights} nights × {formData.number_of_rooms} rooms):</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create reservation'}</Button>
        </div>
      </form>
    </div>
  );
}
