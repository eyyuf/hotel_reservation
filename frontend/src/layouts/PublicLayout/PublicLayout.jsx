import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './PublicLayout.module.css';

function PublicLayout() {
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>HotelHub</Link>
          
          <button className={styles.mobileMenuBtn} onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            <Link to="/hotels" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Hotels</Link>
            
            {isAuthenticated && user?.role === 'guest' ? (
              <>
                <Link to="/guest/reservations" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>My Reservations</Link>
                <Link to="/guest/profile" className={styles.profileBtn} onClick={() => setIsMenuOpen(false)}>
                  <User size={20} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className={styles.registerBtn} onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>© 2026 HotelHub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default PublicLayout;
