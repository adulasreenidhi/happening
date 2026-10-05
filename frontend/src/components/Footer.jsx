import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">H</span>
        HAPPENING
      </Link>
      <p>Find your people. Find your next thing.</p>
      <div className="footer-links">
        <Link to="/categories">Categories</Link>
        <Link to="/cities">Cities</Link>
        <Link to="/about">About</Link>
      </div>
      <span>© 2026 HAPPENING</span>
    </footer>
  );
}

export default Footer;