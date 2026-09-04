import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ShieldCheck, CreditCard, Clock, Search } from 'lucide-react';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import styles from './HomePage.module.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.city) params.append('city', searchParams.city);
    if (searchParams.checkIn) params.append('check_in', searchParams.checkIn);
    if (searchParams.checkOut) params.append('check_out', searchParams.checkOut);
    if (searchParams.guests) params.append('guests', searchParams.guests);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Find your next stay</h1>
          <p className={styles.heroSubtitle}>Exceptional hotels and seamless reservations across Ethiopia.</p>
          
          <div className={styles.searchCard}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.formCol}>
                <Input
                  label="Destination"
                  icon={<MapPin size={16} />}
                  placeholder="Where are you going?"
                  value={searchParams.city}
                  onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formCol}>
                <Input
                  label="Check-in"
                  type="date"
                  icon={<Calendar size={16} />}
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formCol}>
                <Input
                  label="Check-out"
                  type="date"
                  icon={<Calendar size={16} />}
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formColSmall}>
                <Input
                  label="Guests"
                  type="number"
                  min="1"
                  icon={<Users size={16} />}
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({ ...searchParams, guests: e.target.value })}
                  required
                />
              </div>
              <div className={styles.searchButtonWrapper}>
                <Button type="submit" variant="primary" fullWidth size="md">
                  <Search size={16} />
                  <span>Search</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className={styles.destinations}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Popular destinations</h2>
          <p className={styles.sectionSubtitle}>Discover great hotels in top cities</p>
        </div>
        <div className={styles.destinationGrid}>
          {['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Gondar'].map((city) => (
            <div 
              key={city} 
              className={styles.destinationCard}
              onClick={() => navigate(`/hotels?city=${city}`)}
            >
              <div className={styles.destinationImagePlaceholder}>
                <MapPin size={28} className={styles.destinationIcon} />
              </div>
              <div className={styles.destinationInfo}>
                <h3 className={styles.destinationName}>{city}</h3>
                <span className={styles.destinationMeta}>Explore properties &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why book with us</h2>
          <p className={styles.sectionSubtitle}>Reliable, clear, and convenient service</p>
        </div>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Clock size={24} className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Instant Booking</h3>
            <p className={styles.featureDesc}>Book rooms directly with real-time confirmation and straightforward booking management.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <ShieldCheck size={24} className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Transparent Rates</h3>
            <p className={styles.featureDesc}>No hidden fees. Upfront pricing and honest policies for all hotel room types.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <CreditCard size={24} className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Flexible Payments</h3>
            <p className={styles.featureDesc}>Pay securely via cards, mobile money (Telebirr), bank transfer, or at check-in.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
