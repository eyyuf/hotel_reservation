import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const DESTINATIONS = [
  {
    name: 'Addis Ababa',
    subtitle: 'Hotels in Addis Ababa',
    description: 'Vibrant capital of culture and commerce',
    img: 'https://images.unsplash.com/photo-1668003314070-9ef38c3cafb8?w=600&h=800&fit=crop&auto=format',
  },
  {
    name: 'Hawassa',
    subtitle: 'Hotels in Hawassa',
    description: 'Lakeside serenity in the heart of the Rift Valley',
    img: 'https://images.unsplash.com/photo-1594670607814-dc72deb6c69b?w=600&h=800&fit=crop&auto=format',
  },
  {
    name: 'Bahir Dar',
    subtitle: 'Hotels in Bahir Dar',
    description: 'Gateway to Lake Tana and the Blue Nile Falls',
    img: 'https://images.unsplash.com/photo-1624783136314-ff7dca58a015?w=600&h=800&fit=crop&auto=format',
  },
  {
    name: 'Gondar',
    subtitle: 'Hotels in Gondar',
    description: 'Historic castles and the Simien Mountains nearby',
    img: 'https://images.unsplash.com/photo-1608634193723-1865aa4416ce?w=600&h=800&fit=crop&auto=format',
  },
];

const WHY_ITEMS = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 12l2 2 4-4" />
        <rect x="3" y="4" width="18" height="16" rx="2" />
      </svg>
    ),
    title: 'Easy booking',
    body: 'Find and reserve your stay in just a few steps.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Trusted stays',
    body: 'Explore hotels with clear information before you book.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    title: 'Made for Ethiopia',
    body: 'Discover stays across Ethiopia, from Addis Ababa to destinations around the country.',
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    title: 'Simple reservations',
    body: 'Manage your bookings easily from one place.',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.append('city', destination.trim());
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    if (guests) params.append('guests', guests);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className={styles.homePage}>
      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        {/* Background Image with Fallback */}
        <img
          src="https://images.unsplash.com/photo-1668939581252-470c103ac7da?w=1600&h=1000&fit=crop&auto=format"
          alt="Blue Nile Falls, Ethiopia"
          className={styles.heroBgImage}
        />
        <div className={styles.heroOverlay} />

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <div className={styles.heroTextArea}>
            <h1 className={styles.heroTitle}>
              Find a place
              <br />
              you'll love to stay.
            </h1>
            <p className={styles.heroSubtitle}>
              Discover comfortable stays across Ethiopia and book your next trip with
              confidence.
            </p>
          </div>

          {/* Search Form Card */}
          <div className={styles.searchCard}>
            <form onSubmit={handleSearch} className={styles.searchGrid}>
              {/* Destination */}
              <div className={styles.searchCol}>
                <label className={styles.fieldLabel}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Check-in */}
              <div className={styles.searchCol}>
                <label className={styles.fieldLabel}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Check-in
                </label>
                <input
                  type="date"
                  placeholder="Add dates"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Check-out */}
              <div className={styles.searchCol}>
                <label className={styles.fieldLabel}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Check-out
                </label>
                <input
                  type="date"
                  placeholder="Add dates"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>

              {/* Guests + Search Button */}
              <div className={styles.searchColAction}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label className={styles.fieldLabel}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="7" r="4" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Popular Destinations ── */}
      <section id="destinations" className={styles.destinations}>
        <div className={styles.destinationHeader}>
          <p className={styles.sectionPretitle}>Explore Ethiopia</p>
          <h2 className={styles.sectionTitle}>Popular destinations</h2>
        </div>

        <div className={styles.destinationGrid}>
          {DESTINATIONS.map((d) => (
            <Link
              key={d.name}
              to={`/hotels?city=${encodeURIComponent(d.name)}`}
              className={styles.destinationCard}
            >
              <img src={d.img} alt={d.name} className={styles.destinationImage} />
              <div className={styles.destinationOverlay} />
              <div className={styles.destinationInfo}>
                <p className={styles.destinationName}>{d.name}</p>
                <p className={styles.destinationSubtitle}>{d.subtitle}</p>
                <span className={styles.destinationExplore}>
                  Explore
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why HotelHub ── */}
      <section id="why-us" className={styles.whySection}>
        <div className={styles.whyContainer}>
          <div className={styles.whyHeader}>
            <p className={styles.sectionPretitleAmber}>Why HotelHub</p>
            <h2 className={styles.sectionTitleWhite}>A better way to book your stay.</h2>
          </div>

          <div className={styles.whyGrid}>
            {WHY_ITEMS.map((item) => (
              <div key={item.title} className={styles.whyCard}>
                <div className={styles.whyIconWrapper}>{item.icon}</div>
                <div>
                  <h3 className={styles.whyCardTitle}>{item.title}</h3>
                  <p className={styles.whyCardBody}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Discovery / CTA Section ── */}
      <section id="about" className={styles.ctaSection}>
        <div className={styles.ctaGrid}>
          <div className={styles.ctaImageWrapper}>
            <img
              src="https://images.unsplash.com/photo-1742844552700-3926862c5311?w=900&h=700&fit=crop&auto=format"
              alt="Elegant hotel interior with a view"
              className={styles.ctaImage}
            />
          </div>

          <div className={styles.ctaContent}>
            <p className={styles.sectionPretitle}>Start your journey</p>
            <h2 className={styles.ctaHeading}>
              Your next trip
              <br />
              starts here.
            </h2>
            <p className={styles.ctaDesc}>
              Browse a growing selection of hotels across Ethiopia. Whether you're
              planning a business trip to Addis Ababa or a weekend escape to Bahir Dar,
              find your ideal stay and reserve in minutes.
            </p>
            <Link to="/hotels" className={styles.ctaBtn}>
              <span>Explore hotels</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
