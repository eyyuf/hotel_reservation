import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, Calendar, Users, Star, Search } from 'lucide-react';
import { hotelApi } from '../../../services/hotels/hotelApi';
import Input from '../../../components/ui/Input/Input';
import Button from '../../../components/ui/Button/Button';
import Select from '../../../components/ui/Select/Select';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Pagination from '../../../components/ui/Pagination/Pagination';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import styles from './HotelListingPage.module.css';

const HotelListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1 });
  const [sortOrder, setSortOrder] = useState('name');

  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = searchParams.get('guests') || 1;
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await hotelApi.getHotels({ city, page, per_page: 9 });
      const result = response.data.data;
      const list = Array.isArray(result.data) ? result.data : [];
      const normalizedCity = city.trim().toLowerCase();
      setHotels(normalizedCity ? list.filter((hotel) => hotel.city?.toLowerCase() === normalizedCity) : list);
      setPagination({
        page: result.current_page || 1,
        lastPage: result.last_page || 1,
      });
    } catch (error) {
      console.error('Failed to fetch hotels', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [city, page]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    const c = formData.get('city');
    const ci = formData.get('check_in');
    const co = formData.get('check_out');
    const g = formData.get('guests');

    if (c) params.set('city', c);
    if (ci) params.set('check_in', ci);
    if (co) params.set('check_out', co);
    if (g) params.set('guests', g);
    params.set('page', '1');

    setSearchParams(params);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const sortedHotels = [...hotels].sort((a, b) => {
    if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  return (
    <div className={styles.listingPage}>
      <div className={styles.searchSection}>
        <div className={styles.container}>
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <Input
              name="city"
              icon={<MapPin size={16} />}
              defaultValue={city}
              placeholder="Destination (e.g. Addis Ababa)"
            />
            <Input
              name="check_in"
              type="date"
              icon={<Calendar size={16} />}
              defaultValue={checkIn}
            />
            <Input
              name="check_out"
              type="date"
              icon={<Calendar size={16} />}
              defaultValue={checkOut}
            />
            <Input
              name="guests"
              type="number"
              min="1"
              icon={<Users size={16} />}
              defaultValue={guests}
            />
            <Button type="submit" variant="primary">
              <Search size={16} />
              <span>Search</span>
            </Button>
          </form>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              {loading ? 'Searching hotels...' : `${hotels.length} ${hotels.length === 1 ? 'hotel' : 'hotels'} available`}
            </h1>
            {city && <span className={styles.filterTag}>Destination: {city}</span>}
          </div>
          <div className={styles.sort}>
            <Select 
              options={[
                { value: 'name', label: 'Sort by Name' }
              ]}
              value={sortOrder}
              onChange={handleSortChange}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height="180px" />
                <div className={styles.skeletonBody}>
                  <Skeleton width="70%" height="20px" />
                  <Skeleton width="40%" height="16px" />
                  <Skeleton width="100%" height="36px" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedHotels.length > 0 ? (
          <>
            <div className={styles.grid}>
              {sortedHotels.map(hotel => (
                <div key={hotel.id || hotel.hotel_id} className={styles.card}>
                  <div className={styles.cardImage}>
                    <Building size={36} className={styles.placeholderIcon} />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{hotel.name}</h3>
                    <div className={styles.cardLocation}>
                      <MapPin size={14} />
                      <span>{hotel.city}{hotel.country ? `, ${hotel.country}` : ''}</span>
                    </div>
                    <div className={styles.cardRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={13} className={styles.star} fill="currentColor" />
                      ))}
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.price}>
                        <span>Standard rates apply</span>
                      </div>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/hotels/${hotel.id || hotel.hotel_id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`)}
                      >
                        View rooms
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pagination.lastPage > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination 
                  currentPage={pagination.page}
                  totalPages={pagination.lastPage}
                  onPageChange={(p) => setSearchParams(prev => { prev.set('page', p); return prev; })}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState 
            icon={Building}
            title="No hotels found"
            description="Try adjusting your destination city or search criteria."
          />
        )}
      </div>
    </div>
  );
};

export default HotelListingPage;
