import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { superAdminApi } from '../../../services/superAdmin/superAdminApi';
import Badge from '../../../components/ui/Badge/Badge';
import Skeleton from '../../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import { Users } from 'lucide-react';
import styles from './AdministratorsPage.module.css';

export default function AdministratorsPage() {
  const [hotelManagers, setHotelManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const hotelsRes = await superAdminApi.getHotels({ per_page: 100 });
        const hotelsData = hotelsRes.data?.data;
        const hotels = Array.isArray(hotelsData) ? hotelsData : [];

        const results = [];
        for (const hotel of hotels) {
          try {
            const managersRes = await superAdminApi.getManagers(hotel.hotel_id);
            const managers = managersRes.data?.data;
            if (Array.isArray(managers)) {
              managers.forEach(m => {
                results.push({ ...m, hotelName: hotel.name });
              });
            }
          } catch (e) {
            // skip if managers endpoint fails for this hotel
          }
        }
        setHotelManagers(results);
      } catch (error) {
        console.error('Failed to fetch administrators', error);
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Administrators" description="Manage hotel administrators across the platform." />
        <Skeleton width="100%" height="200px" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Administrators" description="Manage hotel administrators across the platform." />
      {hotelManagers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No administrators"
          description="No hotel managers have been assigned yet."
        />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Hotel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {hotelManagers.map(m => (
                <tr key={m.user_id}>
                  <td>{m.first_name} {m.last_name}</td>
                  <td>{m.email}</td>
                  <td>{m.hotelName}</td>
                  <td><Badge variant={m.account_status === 'active' ? 'success' : 'error'}>{m.account_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
