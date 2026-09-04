import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
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
  Menu,
  X,
  Globe
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
        { label: 'Reports', path: '/super-admin/reports', icon: FileText },
        { label: 'Settings', path: '/super-admin/settings', icon: Settings },
      ];
    default:
      return [];
  }
};

const formatRole = (role) => {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

function StaffLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = getNavItems(user?.role);

  return (
    <div className={styles.layout}>
      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderContent}>
          <div className={styles.mobileLogo}>HotelHub</div>
          <button 
            className={styles.mobileMenuButton} 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandRow}>
            <span className={styles.logo}>HotelHub</span>
          </div>
          <div className={styles.roleBadge}>{formatRole(user?.role)}</div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                }
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className={styles.navDivider} />

          <Link to="/hotels" className={styles.navItemSecondary} onClick={() => setMobileMenuOpen(false)}>
            <Globe size={18} className={styles.navIcon} />
            <span>View Public Site</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.first_name} {user?.last_name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.contentInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default StaffLayout;
