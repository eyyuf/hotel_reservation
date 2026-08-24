import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Building, MapPin, Users, Bed, Check, ArrowLeft } from 'lucide-react';
import { hotelApi } from '../../../services/hotels/hotelApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import styles from './HotelDetailPage.module.css';

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guests = searchParams.get('guests') || 1;

  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const hotelRes = await hotelApi.getHotel(hotelId);
        setHotel(hotelRes.data.data);

        if (checkIn && checkOut) {
          const availabilityRes = await hotelApi.getAvailability(hotelId, { check_in: checkIn, check_out: checkOut });
          setRoomTypes(availabilityRes.data.data);
        } else {
          const roomsRes = await hotelApi.getRoomTypes(hotelId);
          setRoomTypes(roomsRes.data?.data?.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch hotel details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hotelId, checkIn, checkOut]);

  const handleSelectRoom = (roomType) => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates to continue.');
      return;
    }
    navigate('/reservation', {
      state: { hotel, roomType, checkIn, checkOut, guests }
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="40px" width="40%" />
        <Skeleton height="300px" className={styles.skeletonHero} />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className={styles.container}>
        <EmptyState title="Hotel not found" message="The hotel you are looking for does not exist." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={`/hotels?${searchParams.toString()}`} className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to search
        </Link>
        
        <div className={styles.header}>
          <h1 className={styles.title}>{hotel.name}</h1>
          <div className={styles.location}>
            <MapPin size={18} />
            {hotel.address}, {hotel.city}, {hotel.country}
          </div>
        </div>

        <div className={styles.hero}>
          <Building size={64} className={styles.placeholderIcon} />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About this hotel</h2>
          <p className={styles.description}>
            {hotel.description || 'Welcome to our beautiful property. We offer excellent service and comfortable rooms for a perfect stay.'}
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Available rooms</h2>
          {!checkIn || !checkOut ? (
            <div className={styles.dateWarning}>
              Please select check-in and check-out dates to see availability and book.
            </div>
          ) : null}

          <div className={styles.roomList}>
            {roomTypes.length > 0 ? (
              roomTypes.map((room) => (
                <div key={room.room_type_id || room.id} className={styles.roomCard}>
                  <div className={styles.roomImage}>
                    <Bed size={32} className={styles.placeholderIcon} />
                  </div>
                  <div className={styles.roomInfo}>
                    <h3 className={styles.roomTitle}>{room.name}</h3>
                    <div className={styles.roomMeta}>
                      <span className={styles.metaItem}><Users size={16} /> {room.capacity} guests</span>
                    </div>
                    <p className={styles.roomDesc}>{room.description}</p>
                    
                    {room.is_available !== undefined && (
                      <div className={styles.availability}>
                        {room.is_available ? (
                          <span className={styles.available}><Check size={16} /> {room.available_rooms} rooms available</span>
                        ) : (
                          <span className={styles.unavailable}>No rooms available for these dates</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.roomAction}>
                    <div className={styles.price}>
                      <span className={styles.currency}>ETB</span>
                      <span className={styles.amount}>{room.base_price}</span>
                      <span className={styles.period}>/ night</span>
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={() => handleSelectRoom(room)}
                      disabled={room.is_available === false}
                    >
                      Select room
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No rooms available" message="Try changing your dates." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
