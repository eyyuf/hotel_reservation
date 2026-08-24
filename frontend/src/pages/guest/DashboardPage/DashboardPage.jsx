import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { reservationApi } from '../../../services/reservations/reservationApi';
import { enrichReservation } from '../../../utils/enrichReservation';
import { formatDate } from '../../../utils/formatDate';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Badge from '../../../components/ui/Badge/Badge';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [upcomingReservation, setUpcomingReservation] = useState(null);
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const reservationData = [];
        let page = 1;
        let lastPage = 1;

        do {
          const response = await reservationApi.getReservations({ page });
          reservationData.push(...(response.data?.data || []));
          lastPage = response.data?.meta?.last_page || 1;
          page += 1;
        } while (page <= lastPage);

        const localToday = new Date();
        const today = [
          localToday.getFullYear(),
          String(localToday.getMonth() + 1).padStart(2, '0'),
          String(localToday.getDate()).padStart(2, '0'),
        ].join('-');

        const nextReservation = reservationData
          .filter((reservation) => (
            ['pending', 'confirmed'].includes(reservation.status)
            && reservation.check_in >= today
          ))
          .sort((a, b) => (
            a.check_in.localeCompare(b.check_in)
            || new Date(a.created_at) - new Date(b.created_at)
          ))[0] || null;

        const recent = reservationData
          .filter((reservation) => reservation.reservation_id !== nextReservation?.reservation_id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);

        const visibleReservations = nextReservation
          ? [nextReservation, ...recent]
          : recent;
        const enrichedReservations = await Promise.all(visibleReservations.map(enrichReservation));
        const byId = new Map(enrichedReservations.map((reservation) => [reservation.reservation_id, reservation]));

        setUpcomingReservation(nextReservation ? byId.get(nextReservation.reservation_id) : null);
        setRecentReservations(recent.map((reservation) => byId.get(reservation.reservation_id) || reservation));
      } catch (error) {
        console.error('Failed to fetch reservations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.dashboard}>
      <PageHeader 
        title={`${getGreeting()}, ${user?.first_name || 'Guest'}`} 
        description="Welcome to your guest dashboard."
      />

      <div className={styles.content}>
        {loading ? (
          <Skeleton height="200px" />
        ) : upcomingReservation ? (
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingHeader}>
              <h2 className={styles.cardTitle}>Upcoming Stay</h2>
              <Badge variant={upcomingReservation.status === 'confirmed' ? 'success' : 'warning'}>
                {upcomingReservation.status}
              </Badge>
            </div>
            <div className={styles.upcomingDetails}>
              <div className={styles.detailBlock}>
                <span className={styles.label}>Hotel</span>
                <span className={styles.value}>{upcomingReservation.hotel?.name || 'Loading...'}</span>
              </div>
              <div className={styles.detailBlock}>
                <span className={styles.label}>Check-in</span>
                <span className={styles.value}>{formatDate(upcomingReservation.check_in)}</span>
              </div>
              <div className={styles.detailBlock}>
                <span className={styles.label}>Check-out</span>
                <span className={styles.value}>{formatDate(upcomingReservation.check_out)}</span>
              </div>
            </div>
            <div className={styles.upcomingFooter}>
              <Link to={`/guest/reservations/${upcomingReservation.reservation_id}`} className={styles.viewLink}>
                View reservation details &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.emptyUpcoming}>
            <h3>No upcoming stays</h3>
            <p>Ready for your next trip?</p>
            <Link to="/" className={styles.browseLink}>Browse hotels</Link>
          </div>
        )}

        <div className={styles.recentSection}>
          <h2 className={styles.sectionTitle}>Recent Reservations</h2>
          {loading ? (
            <Skeleton height="150px" />
          ) : recentReservations.length > 0 ? (
            <div className={styles.recentGrid}>
              {recentReservations.map(res => (
                <div key={res.reservation_id} className={styles.recentCard}>
                  <div className={styles.recentInfo}>
                    <h4>{res.hotel?.name || `Booking #${res.booking_reference}`}</h4>
                    <span className={styles.dates}>
                      {formatDate(res.check_in)} - {formatDate(res.check_out)}
                    </span>
                  </div>
                  <div className={styles.recentAction}>
                    <Badge variant={res.status === 'cancelled' ? 'error' : 'default'}>{res.status}</Badge>
                    <Link to={`/guest/reservations/${res.reservation_id}`} className={styles.viewLinkSimple}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noRecent}>You have no other recent reservations.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
