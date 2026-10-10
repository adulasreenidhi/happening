import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function NavigationLink({ to, end = false, children, className = "", onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `nav-link${isActive ? " is-active" : ""}${className ? ` ${className}` : ""}`
      }
    >
      {children}
    </NavLink>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
  }

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* Brand */}
        <Link className="brand" to="/" aria-label="HAPPENING Home">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span className="brand-text">HAPPENING</span>
        </Link>

        {/* Desktop Discovery Links */}
        <nav className="desktop-nav nav-discovery" aria-label="Primary Discovery Navigation">
          <NavigationLink to="/events">Explore</NavigationLink>
          <NavigationLink to="/categories">Categories</NavigationLink>
          <NavigationLink to="/cities">Cities</NavigationLink>
          <NavigationLink to="/about">About</NavigationLink>
        </nav>

        {/* Desktop Account / Action Links */}
        <div className="desktop-nav nav-actions" aria-label={user ? "Account actions" : "Authentication"}>
          {user ? (
            <>
              <NavigationLink to="/assistant" className="nav-assistant-link">
                <span className="nav-spark-icon" aria-hidden="true">✦</span>
                Assistant
              </NavigationLink>

              {user.role === "USER" && (
                <NavigationLink to="/dashboard">Dashboard</NavigationLink>
              )}
              {["ORGANIZER", "ADMIN"].includes(user.role) && (
                <NavigationLink to="/organizer">Organizer</NavigationLink>
              )}
              {user.role === "ADMIN" && (
                <NavigationLink to="/admin">Admin</NavigationLink>
              )}

              <NavigationLink to="/account" className="nav-profile-link" title={user.name}>
                <span className="nav-avatar" aria-hidden="true">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
                <span className="nav-username">{user.name}</span>
              </NavigationLink>

              <button
                className="nav-logout-btn"
                type="button"
                onClick={handleLogout}
                aria-label="Log out of account"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavigationLink to="/login" className="nav-login-link">
                Sign in
              </NavigationLink>
              <NavigationLink to="/register" className="nav-cta-btn">
                Create account
              </NavigationLink>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className={`hamburger-bar ${mobileMenuOpen ? "is-open" : ""}`} />
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <Link className="brand" to="/" onClick={() => setMobileMenuOpen(false)}>
                <span className="brand-mark" aria-hidden="true">H</span>
                <span className="brand-text">HAPPENING</span>
              </Link>
              <button
                type="button"
                className="mobile-drawer-close"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="mobile-drawer-section" aria-label="Discovery links">
              <span className="mobile-section-label">Discover</span>
              <NavigationLink to="/events">Explore Events</NavigationLink>
              <NavigationLink to="/categories">Categories</NavigationLink>
              <NavigationLink to="/cities">Cities</NavigationLink>
              <NavigationLink to="/about">About HAPPENING</NavigationLink>
            </nav>

            <div className="mobile-drawer-section" aria-label="Account">
              <span className="mobile-section-label">
                {user ? "Your Account" : "Get Started"}
              </span>

              {user ? (
                <>
                  <div className="mobile-user-badge">
                    <span className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.role}</small>
                    </div>
                  </div>

                  <NavigationLink to="/assistant">✦ AI Event Assistant</NavigationLink>
                  {user.role === "USER" && (
                    <NavigationLink to="/dashboard">Personal Dashboard</NavigationLink>
                  )}
                  {["ORGANIZER", "ADMIN"].includes(user.role) && (
                    <NavigationLink to="/organizer">Organizer Studio</NavigationLink>
                  )}
                  {user.role === "ADMIN" && (
                    <NavigationLink to="/admin">Platform Administration</NavigationLink>
                  )}
                  <NavigationLink to="/account">Profile & Settings</NavigationLink>

                  <button
                    className="mobile-logout-btn"
                    type="button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="mobile-auth-actions">
                  <Link
                    to="/login"
                    className="button button-light btn-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="button button-dark btn-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;