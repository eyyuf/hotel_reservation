import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search, Filter, ChevronDown, Building } from 'lucide-react';
import { hotelApi } from '../../../services/hotels/hotelApi';
import Pagination from '../../../components/ui/Pagination/Pagination';
import ImageWithFallback from '../../../components/common/ImageWithFallback/ImageWithFallback';
import { getPrimaryImage } from '../../../utils/imageUtils';
import styles from './HotelListingPage.module.css';

const HotelListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Search form values from URL
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = searchParams.get('guests') || 1;
  const page = parseInt(searchParams.get('page'), 10) || 1;

  // Local filter states
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [sortBy, setSortBy] = useState('name');

  // Input states for controlled search form
  const [searchDestination, setSearchDestination] = useState(city);
  const [searchCheckIn, setSearchCheckIn] = useState(checkIn);
  const [searchCheckOut, setSearchCheckOut] = useState(checkOut);
  const [searchGuests, setSearchGuests] = useState(guests);

  // Sync inputs with URL changes
  useEffect(() => {
    setSearchDestination(city);
    setSearchCheckIn(checkIn);
    setSearchCheckOut(checkOut);
    setSearchGuests(guests);
  }, [city, checkIn, checkOut, guests]);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await hotelApi.getHotels({ city, page, per_page: 9 });
      const result = response.data?.data;
      const list = Array.isArray(result?.data) ? result.data : [];
      const normalizedCity = city.trim().toLowerCase();
      setHotels(normalizedCity ? list.filter((h) => h.city?.toLowerCase() === normalizedCity) : list);
      setPagination({
        page: result?.current_page || 1,
        lastPage: result?.last_page || 1,
      });
    } catch (err) {
      console.error('Failed to fetch hotels', err);
      setError(err.response?.data?.message || 'Unable to load hotels. Please try again later.');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [city, page]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchDestination.trim()) params.set('city', searchDestination.trim());
    if (searchCheckIn) params.set('check_in', searchCheckIn);
    if (searchCheckOut) params.set('check_out', searchCheckOut);
    if (searchGuests > 1) params.set('guests', searchGuests);
    params.set('page', '1');
    setSearchParams(params);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocationFilter('All locations');
    setSortBy('name');
    setSearchDestination('');
    setSearchCheckIn('');
    setSearchCheckOut('');
    setSearchGuests(1);
    setSearchParams(new URLSearchParams());
  };

  // Derive unique locations dynamically from real hotel data
  const availableLocations = useMemo(() => {
    const uniqueCities = new Set(hotels.map((h) => h.city?.trim()).filter(Boolean));
    return ['All locations', ...Array.from(uniqueCities)];
  }, [hotels]);

  // Filter & Sort
  const filteredAndSortedHotels = useMemo(() => {
    let result = [...hotels];

    if (locationFilter !== 'All locations') {
      result = result.filter(
        (h) => (h.city || '').toLowerCase() === locationFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'city') {
        return (a.city || '').localeCompare(b.city || '');
      }
      return 0;
    });

    return result;
  }, [hotels, locationFilter, sortBy]);

  const hasActiveFilters = city || locationFilter !== 'All locations';

  return (
    <div className={styles.listingPage}>
      {/* ── Page Header ── */}
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Find your perfect stay</h1>
          <p className={styles.pageSubtitle}>
            Discover comfortable hotels and book your stay with ease.
          </p>
        </div>
      </section>

      {/* ── Search Bar Section ── */}
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <div className={styles.searchCard}>
            <form onSubmit={handleSearch} className={styles.searchGrid}>
              {/* Destination */}
              <div className={styles.searchCol}>
                <label htmlFor="search-destination" className={styles.fieldLabel}>
                  <MapPin size={13} strokeWidth={2.2} />
                  <span>Destination</span>
                </label>
                <input
                  id="search-destination"
                  type="text"
                  placeholder="Where are you going?"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Check-in */}
              <div className={styles.searchCol}>
                <label htmlFor="search-check-in" className={styles.fieldLabel}>
                  <Calendar size={13} strokeWidth={2.2} />
                  <span>Check-in</span>
                </label>
                <input
                  id="search-check-in"
                  type="date"
                  placeholder="Add dates"
                  value={searchCheckIn}
                  onChange={(e) => setSearchCheckIn(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Check-out */}
              <div className={styles.searchCol}>
                <label htmlFor="search-check-out" className={styles.fieldLabel}>
                  <Calendar size={13} strokeWidth={2.2} />
                  <span>Check-out</span>
                </label>
                <input
                  id="search-check-out"
                  type="date"
                  placeholder="Add dates"
                  value={searchCheckOut}
                  onChange={(e) => setSearchCheckOut(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Guests + Search Button */}
              <div className={styles.searchColAction}>
                <div className={styles.guestsField}>
                  <label htmlFor="search-guests" className={styles.fieldLabel}>
                    <Users size={13} strokeWidth={2.2} />
                    <span>Guests</span>
                  </label>
                  <select
                    id="search-guests"
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    className={styles.fieldSelect}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'guest' : 'guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={styles.searchBtn}>
                  <Search size={15} strokeWidth={2.4} />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.contentLayout}>
            {/* ── Sidebar Filters ── */}
            <aside className={styles.sidebar}>
              {/* Mobile filter accordion toggle */}
              <button
                type="button"
                className={styles.mobileFilterToggle}
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={16} />
                  <span>Filters</span>
                  {hasActiveFilters && <span className={styles.filterBadge} />}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: filtersOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Filter panel */}
              <div
                className={styles.filterPanel}
                style={{ display: filtersOpen ? 'flex' : undefined }}
              >
                {/* Location Filter */}
                <div>
                  <h3 className={styles.filterSectionTitle}>Location</h3>
                  <div className={styles.radioList}>
                    {availableLocations.map((loc) => (
                      <label
                        key={loc}
                        className={`${styles.radioLabel} ${locationFilter === loc ? styles.radioLabelActive : ''}`}
                      >
                        <input
                          type="radio"
                          name="locationFilter"
                          value={loc}
                          checked={locationFilter === loc}
                          onChange={() => setLocationFilter(loc)}
                          className={styles.radioInput}
                        />
                        <span>{loc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <>
                    <hr className={styles.filterDivider} />
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={styles.clearFiltersBtn}
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </aside>

            {/* ── Results Area ── */}
            <div className={styles.resultsArea}>
              {/* Results Header */}
              {!loading && !error && (
                <div className={styles.resultsHeader}>
                  <p className={styles.resultsCount}>
                    <span className={styles.resultsCountBold}>
                      {filteredAndSortedHotels.length}
                    </span>{' '}
                    {filteredAndSortedHotels.length === 1 ? 'hotel' : 'hotels'} available
                  </p>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                    aria-label="Sort hotels"
                  >
                    <option value="name">Sort by Name (A-Z)</option>
                    <option value="name_desc">Sort by Name (Z-A)</option>
                    <option value="city">Sort by City</option>
                  </select>
                </div>
              )}

              {/* Error State */}
              {error ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconBadge}>
                    <Building size={28} />
                  </div>
                  <h3 className={styles.emptyTitle}>Failed to load hotels</h3>
                  <p className={styles.emptySubtitle}>{error}</p>
                  <button
                    type="button"
                    onClick={fetchHotels}
                    className={styles.emptyResetButton}
                  >
                    Try again
                  </button>
                </div>
              ) : loading ? (
                /* Loading State (Skeletons) */
                <div className={styles.grid}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={styles.skeletonCard}>
                      <div className={styles.skeletonImage} />
                      <div className={styles.skeletonBody}>
                        <div style={{ height: '20px', width: '75%', backgroundColor: '#ede9e2', borderRadius: '4px' }} />
                        <div style={{ height: '14px', width: '45%', backgroundColor: '#ede9e2', borderRadius: '4px' }} />
                        <div style={{ height: '14px', width: '100%', backgroundColor: '#ede9e2', borderRadius: '4px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <div style={{ height: '16px', width: '90px', backgroundColor: '#ede9e2', borderRadius: '4px' }} />
                          <div style={{ height: '34px', width: '95px', backgroundColor: '#ede9e2', borderRadius: '8px' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedHotels.length === 0 ? (
                /* Empty State */
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconBadge}>
                    <Search size={28} />
                  </div>
                  <h3 className={styles.emptyTitle}>No hotels found</h3>
                  <p className={styles.emptySubtitle}>
                    Try changing your search or removing some filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={styles.emptyResetButton}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                /* Hotels Grid */
                <>
                  <div className={styles.grid}>
                    {filteredAndSortedHotels.map((hotel) => {
                      const primaryImage = getPrimaryImage(hotel.images);
                      const destinationQuery = new URLSearchParams();
                      if (checkIn) destinationQuery.set('check_in', checkIn);
                      if (checkOut) destinationQuery.set('check_out', checkOut);
                      if (guests) destinationQuery.set('guests', guests);
                      const targetUrl = `/hotels/${hotel.id || hotel.hotel_id}${
                        destinationQuery.toString() ? `?${destinationQuery.toString()}` : ''
                      }`;

                      return (
                        <article key={hotel.id || hotel.hotel_id} className={styles.card}>
                          {/* Image with 16:10 aspect ratio */}
                          <div className={styles.cardImageWrapper}>
                            {primaryImage?.image_url ? (
                              <ImageWithFallback
                                src={primaryImage.image_url}
                                alt={primaryImage.alt_text || hotel.name}
                                fallbackIcon={Building}
                                iconSize={36}
                              />
                            ) : (
                              <div className={styles.noImagePlaceholder}>
                                <Building size={32} />
                                <span className={styles.noImageText}>No image</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className={styles.cardBody}>
                            <h2 className={styles.cardTitle}>{hotel.name}</h2>

                            <div className={styles.cardLocation}>
                              <MapPin size={14} className={styles.cardLocationIcon} />
                              <span>
                                {hotel.city}
                                {hotel.country ? `, ${hotel.country}` : ''}
                              </span>
                            </div>

                            {hotel.address && (
                              <p className={styles.cardAddress}>{hotel.address}</p>
                            )}

                            <div className={styles.cardFooter}>
                              <span className={styles.cardRates}>Standard rates apply</span>
                              <button
                                type="button"
                                className={styles.viewButton}
                                onClick={() => navigate(targetUrl)}
                              >
                                View Hotel
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination.lastPage > 1 && (
                    <div className={styles.paginationWrapper}>
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.lastPage}
                        onPageChange={(p) =>
                          setSearchParams((prev) => {
                            prev.set('page', p);
                            return prev;
                          })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HotelListingPage;

