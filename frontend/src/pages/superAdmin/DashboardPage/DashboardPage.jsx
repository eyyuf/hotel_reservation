import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { superAdminApi } from '../../../services/superAdmin/superAdminApi';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Badge from '../../../components/ui/Badge/Badge';
import { Building, Users, Calendar, CreditCard } from 'lucide-react';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    Promise.all([
      superAdminApi.getReports().catch(() => ({ data: { data: {} } })),
      superAdminApi.getHotels().catch(() => ({ data: { data: [] } })),
    ])
      .then(([rep, hot]) => {
        setReports(rep.data?.data || {});
        const hotelList = hot.data?.data;
        setHotels(Array.isArray(hotelList) ? hotelList.slice(0, 5) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className={styles.loading}><Skeleton count={5} /></div>;

  const totalUsers = (reports?.total_managers || 0) + (reports?.total_receptionists || 0) + (reports?.total_guests || 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>{getGreeting()}, {user?.first_name || 'Admin'}</h1>
        <p className={styles.date}>{formatDate(new Date().toISOString())}</p>
      </header>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <Building className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Total Hotels</p>
            <p className={styles.kpiValue}>{reports?.total_hotels || 0}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Users className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Total Users</p>
            <p className={styles.kpiValue}>{totalUsers}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Calendar className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Total Reservations</p>
            <p className={styles.kpiValue}>{reports?.total_reservations || 0}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <CreditCard className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Platform Revenue</p>
            <p className={styles.kpiValue}>{formatCurrency(reports?.total_revenue || 0)}</p>
          </div>
        </div>
      </div>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent Hotels</h2>
        {hotels.length === 0 ? (
          <p className={styles.emptyText}>No hotels yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map(h => (
                  <tr key={h.hotel_id}>
                    <td>{h.name}</td>
                    <td>{h.city}</td>
                    <td>{h.country}</td>
                    <td><Badge variant={h.status === 'active' ? 'success' : 'error'}>{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
