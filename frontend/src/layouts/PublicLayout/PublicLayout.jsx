import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './PublicLayout.module.css';

function PublicLayout() {
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'guest':
        return '/guest/dashboard';
      case 'receptionist':
        return '/receptionist/dashboard';
      case 'hotel_manager':
        return '/admin/dashboard';
      case 'super_admin':
        return '/super-admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className={styles.layout}>
      {/* ── Fixed Navbar ── */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          {/* Brand */}
          <Link to="/" className={styles.brand} onClick={closeMenu}>
            <span className={styles.brandIcon}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.brandText}>HotelHub</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className={styles.desktopNav}>
            <Link to="/hotels" className={styles.navLink}>
              Hotels
            </Link>
            <a href="/#destinations" className={styles.navLink}>
              Destinations
            </a>
            <a href="/#why-us" className={styles.navLink}>
              Why Us
            </a>
            <a href="/#about" className={styles.navLink}>
              About
            </a>
          </nav>

          {/* Desktop Auth Actions */}
          <div className={styles.authGroup}>
            {isAuthenticated ? (
              user?.role === 'guest' ? (
                <>
                  <Link to="/guest/reservations" className={styles.navLink}>
                    My Reservations
                  </Link>
                  <Link to="/guest/dashboard" className={styles.navLink}>
                    Dashboard
                  </Link>
                  <Link
                    to="/guest/profile"
                    className={styles.profileBtn}
                    aria-label="Profile"
                  >
                    <User size={18} />
                  </Link>
                </>
              ) : (
                <Link to={getDashboardPath()} className={styles.registerBtn}>
                  Staff Dashboard
                </Link>
              )
            ) : (
              <>
                <Link to="/login" className={styles.signInLink}>
                  Sign In
                </Link>
                <Link to="/register" className={styles.registerBtn}>
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {isMenuOpen && (
          <div className={styles.mobileDrawer}>
            <Link to="/hotels" className={styles.navLink} onClick={closeMenu}>
              Hotels
            </Link>
            <a href="/#destinations" className={styles.navLink} onClick={closeMenu}>
              Destinations
            </a>
            <a href="/#why-us" className={styles.navLink} onClick={closeMenu}>
              Why Us
            </a>
            <a href="/#about" className={styles.navLink} onClick={closeMenu}>
              About
            </a>

            <hr className={styles.mobileDivider} />

            {isAuthenticated ? (
              user?.role === 'guest' ? (
                <>
                  <Link
                    to="/guest/reservations"
                    className={styles.navLink}
                    onClick={closeMenu}
                  >
                    My Reservations
                  </Link>
                  <Link
                    to="/guest/dashboard"
                    className={styles.navLink}
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/guest/profile"
                    className={styles.navLink}
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  to={getDashboardPath()}
                  className={styles.registerBtn}
                  onClick={closeMenu}
                >
                  Staff Dashboard
                </Link>
              )
            ) : (
              <>
                <Link to="/login" className={styles.signInLink} onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/register" className={styles.registerBtn} onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Figma Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            {/* Brand column */}
            <div>
              <Link to="/" className={styles.brand}>
                <span className={styles.brandIcon}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <span className={styles.brandText}>HotelHub</span>
              </Link>
              <p className={styles.footerBrandDesc}>
                Discover and book comfortable stays across Ethiopia. Simple, trustworthy,
                built for travelers.
              </p>
            </div>

            {/* Explore column */}
            <div>
              <h4 className={styles.footerHeading}>Explore</h4>
              <ul className={styles.footerList}>
                <li>
                  <Link to="/hotels" className={styles.footerLink}>
                    Hotels
                  </Link>
                </li>
                <li>
                  <a href="/#destinations" className={styles.footerLink}>
                    Destinations
                  </a>
                </li>
                <li>
                  <a href="/#why-us" className={styles.footerLink}>
                    How it works
                  </a>
                </li>
                <li>
                  <a href="/#about" className={styles.footerLink}>
                    About
                  </a>
                </li>
              </ul>
            </div>

            {/* Account column */}
            <div>
              <h4 className={styles.footerHeading}>Account</h4>
              <ul className={styles.footerList}>
                {isAuthenticated ? (
                  user?.role === 'guest' ? (
                    <>
                      <li>
                        <Link to="/guest/dashboard" className={styles.footerLink}>
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/guest/reservations" className={styles.footerLink}>
                          My Reservations
                        </Link>
                      </li>
                      <li>
                        <Link to="/guest/profile" className={styles.footerLink}>
                          Profile
                        </Link>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link to={getDashboardPath()} className={styles.footerLink}>
                        Staff Portal
                      </Link>
                    </li>
                  )
                ) : (
                  <>
                    <li>
                      <Link to="/login" className={styles.footerLink}>
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className={styles.footerLink}>
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerSubtext}>
              © 2026 HotelHub. All rights reserved.
            </p>
            <p className={styles.footerSubtext}>
              Made for travelers across Ethiopia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
