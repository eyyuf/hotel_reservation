import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Badge from '../../../components/ui/Badge/Badge';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import { hotelApi } from '../../../services/hotels/hotelApi';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './RoomsPage.module.css';

export default function RoomsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        if (user?.hotel_id) {
          const res = await hotelApi.getRoomTypes(user.hotel_id);
          setRoomTypes(res.data?.data?.data || []);
        }
      } catch (err) {
        addToast('Failed to load room types', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [user, addToast]);

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Rooms" 
        description="View room availability and details"
      />

      {loading ? (
        <div className={styles.grid}>
          <Skeleton height={200} />
          <Skeleton height={200} />
          <Skeleton height={200} />
        </div>
      ) : roomTypes.length === 0 ? (
        <EmptyState title="No room types found" description="There are no room types configured for this hotel." />
      ) : (
        <div className={styles.grid}>
          {roomTypes.map(rt => (
            <div key={rt.room_type_id || rt.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.roomName}>{rt.name}</h3>
                <Badge variant={rt.status === 'active' ? 'success' : 'error'}>
                  {rt.status}
                </Badge>
              </div>
              
              <div className={styles.roomDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Base Price</span>
                  <span className={styles.value}>{formatCurrency(rt.base_price)} / night</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Capacity</span>
                  <span className={styles.value}>{rt.capacity} persons</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Total Rooms</span>
                  <span className={styles.value}>{rt.total_rooms}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
