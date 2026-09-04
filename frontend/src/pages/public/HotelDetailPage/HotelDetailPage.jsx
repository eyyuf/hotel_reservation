import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Building, MapPin, Users, Bed, Check, ArrowLeft, Camera } from 'lucide-react';
import { hotelApi } from '../../../services/hotels/hotelApi';
import Button from '../../../components/ui/Button/Button';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import Modal from '../../../components/ui/Modal/Modal';
import ImageGalleryViewer from '../../../components/common/ImageGalleryViewer/ImageGalleryViewer';
import ImageWithFallback from '../../../components/common/ImageWithFallback/ImageWithFallback';
import { getPrimaryImage } from '../../../utils/imageUtils';
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
  const [activeRoomGallery, setActiveRoomGallery] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const hotelRes = await hotelApi.getHotel(hotelId);
        if (!isMounted) return;
        setHotel(hotelRes.data.data);

        // Fetch room types to obtain full definitions with images
        const roomsRes = await hotelApi.getRoomTypes(hotelId);
        if (!isMounted) return;
        const fullRooms = roomsRes.data?.data?.data || roomsRes.data?.data || [];
        const roomMap = new Map(
          fullRooms.map((r) => [String(r.id || r.room_type_id), r])
        );

        if (checkIn && checkOut) {
          const availabilityRes = await hotelApi.getAvailability(hotelId, {
            check_in: checkIn,
            check_out: checkOut,
          });
          if (!isMounted) return;
          const availList = availabilityRes.data?.data || [];

          // Merge room definition (images, description) into availability records
          const merged = availList.map((avail) => {
            const key = String(avail.room_type_id || avail.id);
            const detailed = roomMap.get(key) || {};
            return {
              ...detailed,
              ...avail,
              images: detailed.images || avail.images || [],
              description: detailed.description || avail.description || '',
            };
          });
          setRoomTypes(merged);
        } else {
          setRoomTypes(fullRooms);
        }
      } catch (error) {
        console.error('Failed to fetch hotel details', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [hotelId, checkIn, checkOut]);

  const handleSelectRoom = (roomType) => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates to continue.');
      return;
    }
    navigate('/reservation', {
      state: { hotel, roomType, checkIn, checkOut, guests },
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="40px" width="40%" />
        <Skeleton height="380px" className={styles.skeletonHero} />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Hotel not found"
          message="The hotel you are looking for does not exist."
        />
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

        {/* Hero Gallery from Cloudflare R2 */}
        <ImageGalleryViewer
          images={hotel.images || []}
          hotelName={hotel.name}
          fallbackIcon={Building}
          className={styles.heroGallery}
        />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About this hotel</h2>
          <p className={styles.description}>
            {hotel.description ||
              'Welcome to our beautiful property. We offer excellent service and comfortable rooms for a perfect stay.'}
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
              roomTypes.map((room) => {
                const primaryRoomImg = getPrimaryImage(room.images);
                const hasMultiplePhotos = room.images && room.images.length > 1;

                return (
                  <div key={room.room_type_id || room.id} className={styles.roomCard}>
                    {/* Room image with fallback and click-to-preview */}
                    <div
                      className={styles.roomImage}
                      onClick={() => {
                        if (room.images && room.images.length > 0) {
                          setActiveRoomGallery(room);
                        }
                      }}
                      title={hasMultiplePhotos ? 'Click to view room photos' : room.name}
                    >
                      <ImageWithFallback
                        src={primaryRoomImg?.image_url}
                        alt={primaryRoomImg?.alt_text || room.name}
                        fallbackIcon={Bed}
                        iconSize={32}
                      />
                      {hasMultiplePhotos && (
                        <div className={styles.roomPhotoBadge}>
                          <Camera size={12} />
                          <span>{room.images.length} photos</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.roomInfo}>
                      <h3 className={styles.roomTitle}>{room.name}</h3>
                      <div className={styles.roomMeta}>
                        <span className={styles.metaItem}>
                          <Users size={16} /> {room.capacity} guests
                        </span>
                      </div>
                      <p className={styles.roomDesc}>{room.description}</p>

                      {room.is_available !== undefined && (
                        <div className={styles.availability}>
                          {room.is_available ? (
                            <span className={styles.available}>
                              <Check size={16} /> {room.available_rooms} rooms available
                            </span>
                          ) : (
                            <span className={styles.unavailable}>
                              No rooms available for these dates
                            </span>
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
                );
              })
            ) : (
              <EmptyState title="No rooms available" message="Try changing your dates." />
            )}
          </div>
        </div>
      </div>

      {/* Room Photo Gallery Modal for guests */}
      <Modal
        isOpen={!!activeRoomGallery}
        onClose={() => setActiveRoomGallery(null)}
        title={`${activeRoomGallery?.name || 'Room'} Photos`}
      >
        {activeRoomGallery && (
          <ImageGalleryViewer
            images={activeRoomGallery.images || []}
            hotelName={activeRoomGallery.name}
            fallbackIcon={Bed}
          />
        )}
      </Modal>
    </div>
  );
};

export default HotelDetailPage;
