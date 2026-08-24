import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { managerApi } from '../../../services/manager/managerApi';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './ReportsPage.module.css';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.getReports()
      .then(res => setReports(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.container}><Skeleton count={5} /></div>;

  return (
    <div className={styles.container}>
      <PageHeader title="Reports" description="Hotel performance overview." />
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Revenue</h3>
          <p className={styles.bigNumber}>{formatCurrency(reports?.total_revenue || 0)}</p>
        </div>
        <div className={styles.card}>
          <h3>Inventory</h3>
          <p className={styles.number}>{reports?.total_room_inventory || 0} Rooms</p>
          <p className={styles.sub}>{reports?.total_room_types || 0} Room Types</p>
        </div>
        <div className={styles.card}>
          <h3>Reservations Overview</h3>
          <ul className={styles.list}>
            <li>Total: {reports?.total_reservations || 0}</li>
            <li>Pending: {reports?.pending_reservations || 0}</li>
            <li>Confirmed: {reports?.confirmed_reservations || 0}</li>
            <li>Checked In: {reports?.checked_in_reservations || 0}</li>
            <li>Checked Out: {reports?.checked_out_reservations || 0}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
