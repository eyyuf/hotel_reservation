import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { managerApi } from '../../../services/manager/managerApi';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import Badge from '../../../components/ui/Badge/Badge';
import Table from '../../../components/ui/Table/Table';
import { LayoutDashboard, Building, Calendar, CreditCard } from 'lucide-react';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    Promise.all([
      managerApi.getReports().catch(() => ({ data: { data: {} } })), 
      managerApi.getReservations({ limit: 10 }).catch(() => ({ data: { data: [] } }))
    ])
      .then(([rep, res]) => {
        setReports(rep.data.data);
        setReservations(res.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}><Skeleton count={5} /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>Good morning, {user?.first_name || 'Manager'}</h1>
        <p className={styles.date}>{formatDate(new Date())}</p>
      </header>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <Building className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Total Room Types</p>
            <p className={styles.kpiValue}>{reports?.total_room_types || 0}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <LayoutDashboard className={styles.icon} />
          <div>
            <p className={styles.kpiLabel}>Total Inventory</p>
            <p className={styles.kpiValue}>{reports?.total_room_inventory || 0}</p>
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
            <p className={styles.kpiLabel}>Revenue</p>
            <p className={styles.kpiValue}>{formatCurrency(reports?.total_revenue || 0)}</p>
          </div>
        </div>
      </div>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent Reservations</h2>
        <Table>
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Guest</th>
              <th>Room Type</th>
              <th>Dates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.slice(0, 10).map(res => (
              <tr key={res.reservation_id}>
                <td>{res.booking_reference}</td>
                <td>{res.guest?.first_name} {res.guest?.last_name}</td>
                <td>{res.room_type?.name}</td>
                <td>{formatDate(res.check_in_date)} - {formatDate(res.check_out_date)}</td>
                <td><Badge variant={res.reservation_status === 'confirmed' ? 'success' : 'info'}>{res.reservation_status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
