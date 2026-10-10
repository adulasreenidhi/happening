import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-column">
          <Link className="brand" to="/" aria-label="HAPPENING Home">
            <span className="brand-mark" aria-hidden="true">H</span>
            <span className="brand-text">HAPPENING</span>
          </Link>
          <p className="footer-tagline">
            Unified city event discovery, registration & management platform.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/events">Explore Events</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cities">Cities</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="footer-bottom">
          <span className="footer-copyright">
            © {new Date().getFullYear()} HAPPENING. Built for real city moments.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;