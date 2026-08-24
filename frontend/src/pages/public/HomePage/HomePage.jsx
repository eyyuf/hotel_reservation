import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ShieldCheck, CreditCard, Clock } from 'lucide-react';
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
          <p className={styles.heroSubtitle}>Comfortable rooms. Simple reservations.</p>
          
          <div className={styles.searchCard}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <Input
                label="Destination"
                icon={<MapPin size={20} />}
                placeholder="Where are you going?"
                value={searchParams.city}
                onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                required
              />
              <div className={styles.dateInputs}>
                <Input
                  label="Check-in"
                  type="date"
                  icon={<Calendar size={20} />}
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  required
                />
                <Input
                  label="Check-out"
                  type="date"
                  icon={<Calendar size={20} />}
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Guests"
                type="number"
                min="1"
                icon={<Users size={20} />}
                value={searchParams.guests}
                onChange={(e) => setSearchParams({ ...searchParams, guests: e.target.value })}
                required
              />
              <div className={styles.searchButtonWrapper}>
                <Button type="submit" variant="primary" fullWidth className={styles.searchButton}>
                  Search hotels
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className={styles.destinations}>
        <h2 className={styles.sectionTitle}>Popular destinations</h2>
        <div className={styles.destinationGrid}>
          {['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Gondar'].map((city) => (
            <div 
              key={city} 
              className={styles.destinationCard}
              onClick={() => navigate(`/hotels?city=${city}`)}
            >
              <div className={styles.destinationImagePlaceholder}>
                <MapPin size={32} className={styles.destinationIcon} />
              </div>
              <h3 className={styles.destinationName}>{city}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why book with us</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <Clock size={32} className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Easy booking</h3>
            <p className={styles.featureDesc}>Find and book your perfect room in just a few simple steps.</p>
          </div>
          <div className={styles.featureCard}>
            <ShieldCheck size={32} className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Best prices</h3>
            <p className={styles.featureDesc}>We guarantee the best available rates for our properties.</p>
          </div>
          <div className={styles.featureCard}>
            <CreditCard size={32} className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Secure payments</h3>
            <p className={styles.featureDesc}>Your payment information is always protected and secure.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
