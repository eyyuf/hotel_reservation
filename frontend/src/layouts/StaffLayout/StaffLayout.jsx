import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  BedDouble,
  Users,
  FileText,
  Settings,
  Building2,
  LogOut,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './StaffLayout.module.css';

const getNavItems = (role) => {
  switch (role) {
    case 'receptionist':
      return [
        { label: 'Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
        { label: 'Reservations', path: '/receptionist/reservations', icon: CalendarDays },
        { label: 'Check-in', path: '/receptionist/check-in', icon: DoorOpen },
        { label: 'Check-out', path: '/receptionist/check-out', icon: DoorOpen },
        { label: 'Rooms', path: '/receptionist/rooms', icon: BedDouble },
      ];
    case 'hotel_manager':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Reservations', path: '/admin/reservations', icon: CalendarDays },
        { label: 'Room Types', path: '/admin/room-types', icon: BedDouble },
        { label: 'Receptionists', path: '/admin/receptionists', icon: Users },
        { label: 'Reports', path: '/admin/reports', icon: FileText },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      ];
    case 'super_admin':
      return [
        { label: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
        { label: 'Hotels', path: '/super-admin/hotels', icon: Building2 },
        { label: 'Administrators', path: '/super-admin/administrators', icon: Users },
        { label: 'Reservations', path: '/super-admin/reservations', icon: CalendarDays },
        { label: 'Reports', path: '/super-admin/reports', icon: FileText },
        { label: 'Settings', path: '/super-admin/settings', icon: Settings },
      ];
    default:
      return [];
  }
};

const getMobileNavItems = (role) => {
  const items = getNavItems(role);
  // Just return the first 3 + a "More" placeholder for mobile bottom nav
  return [
    ...items.slice(0, 3),
    { label: 'More', path: '#', icon: MoreHorizontal, isMore: true }
  ];
};

const formatRole = (role) => {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

function StaffLayout() {
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.role);
  const mobileItems = getMobileNavItems(user?.role);

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>HotelHub</div>
          <div className={styles.roleLabel}>{formatRole(user?.role)}</div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.first_name} {user?.last_name}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {mobileItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.isMore) {
            return (
              <div key="more" className={styles.bottomNavItem}>
                <Icon size={24} />
                <span>{item.label}</span>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                isActive ? `${styles.bottomNavItem} ${styles.bottomNavItemActive}` : styles.bottomNavItem
              }
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default StaffLayout;
