import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { superAdminApi } from '../../../services/superAdmin/superAdminApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import styles from './ReportsPage.module.css';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.getReports()
      .then(res => setReports(res.data?.data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Reports" description="Platform-wide analytics." />
        <Skeleton width="100%" height="200px" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Reports" description="Platform-wide analytics." />
      <div className={styles.grid}>
        <div className={styles.revenueCard}>
          <h3>Platform Revenue</h3>
          <p className={styles.bigNumber}>{formatCurrency(reports?.total_revenue || 0)}</p>
        </div>
        <div className={styles.card}>
          <h3>Total Hotels</h3>
          <p className={styles.number}>{reports?.total_hotels || 0}</p>
          <p className={styles.sub}>Active: {reports?.active_hotels || 0} · Suspended: {reports?.suspended_hotels || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Managers</h3>
          <p className={styles.number}>{reports?.total_managers || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Receptionists</h3>
          <p className={styles.number}>{reports?.total_receptionists || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Guests</h3>
          <p className={styles.number}>{reports?.total_guests || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Reservations</h3>
          <p className={styles.number}>{reports?.total_reservations || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Successful Payments</h3>
          <p className={styles.number}>{reports?.total_successful_payments || 0}</p>
        </div>
      </div>
    </div>
  );
}
