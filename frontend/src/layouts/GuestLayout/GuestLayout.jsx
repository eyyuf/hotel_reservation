import { useState } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { Menu, X, LogOut, Home, Search, Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './GuestLayout.module.css';

function GuestLayout() {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={styles.layout}>
      {/* Top Navbar */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <Link to="/guest/dashboard" className={styles.logo}>HotelHub</Link>
          
          <button className={styles.mobileMenuBtn} onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`${styles.topNavLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            <NavLink 
              to="/guest/dashboard" 
              className={({isActive}) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/hotels" 
              className={({isActive}) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Hotels
            </NavLink>
            <NavLink 
              to="/guest/reservations" 
              className={({isActive}) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Reservations
            </NavLink>
            <NavLink 
              to="/guest/profile" 
              className={({isActive}) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </NavLink>
            <button className={styles.logoutBtn} onClick={() => { logout(); setIsMenuOpen(false); }}>
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <NavLink to="/guest/dashboard" className={({isActive}) => isActive ? `${styles.bottomNavItem} ${styles.active}` : styles.bottomNavItem}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/hotels" className={({isActive}) => isActive ? `${styles.bottomNavItem} ${styles.active}` : styles.bottomNavItem}>
          <Search size={20} />
          <span>Search</span>
        </NavLink>
        <NavLink to="/guest/reservations" className={({isActive}) => isActive ? `${styles.bottomNavItem} ${styles.active}` : styles.bottomNavItem}>
          <Calendar size={20} />
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/guest/profile" className={({isActive}) => isActive ? `${styles.bottomNavItem} ${styles.active}` : styles.bottomNavItem}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default GuestLayout;
