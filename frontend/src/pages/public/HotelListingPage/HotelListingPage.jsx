import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, Calendar, Users, Star } from 'lucide-react';
import { hotelApi } from '../../../services/hotels/hotelApi';
import { formatCurrency } from '../../../utils/formatCurrency';
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

  useEffect(() => {
    fetchHotels();
  }, [city, page]);

  const fetchHotels = async () => {
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
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSearchParams({
      city: formData.get('city'),
      check_in: formData.get('check_in'),
      check_out: formData.get('check_out'),
      guests: formData.get('guests'),
      page: '1'
    });
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const sortedHotels = [...hotels].sort((a, b) => {
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    // Add other sorts if API includes prices in listing
    return 0;
  });

  return (
    <div className={styles.listingPage}>
      <div className={styles.searchSection}>
        <div className={styles.container}>
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <Input
              name="city"
              icon={<MapPin size={18} />}
              defaultValue={city}
              placeholder="Destination"
            />
            <Input
              name="check_in"
              type="date"
              icon={<Calendar size={18} />}
              defaultValue={checkIn}
            />
            <Input
              name="check_out"
              type="date"
              icon={<Calendar size={18} />}
              defaultValue={checkOut}
            />
            <Input
              name="guests"
              type="number"
              min="1"
              icon={<Users size={18} />}
              defaultValue={guests}
            />
            <Button type="submit" variant="primary">Search</Button>
          </form>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {loading ? 'Searching hotels...' : `${hotels.length} hotels found`}
          </h1>
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
                <Skeleton height="200px" />
                <div className={styles.skeletonBody}>
                  <Skeleton width="70%" />
                  <Skeleton width="40%" />
                  <Skeleton width="100%" height="40px" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedHotels.length > 0 ? (
          <>
            <div className={styles.grid}>
              {sortedHotels.map(hotel => (
                <div key={hotel.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    <Building size={40} className={styles.placeholderIcon} />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{hotel.name}</h3>
                    <div className={styles.cardLocation}>
                      <MapPin size={14} />
                      <span>{hotel.city}</span>
                    </div>
                    <div className={styles.cardRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={14} className={styles.star} fill="currentColor" />
                      ))}
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.price}>
                        <span>Price varies</span>
                      </div>
                      <Button 
                        variant="secondary"
                        onClick={() => navigate(`/hotels/${hotel.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`)}
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
            message="Try adjusting your search criteria."
          />
        )}
      </div>
    </div>
  );
};

export default HotelListingPage;
