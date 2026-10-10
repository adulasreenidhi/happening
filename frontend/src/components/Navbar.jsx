import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function NavigationLink({ to, end = false, children, className = "" }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `navigation-link${isActive ? " is-active" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </NavLink>
  );
}

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" to="/" aria-label="HAPPENING home">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span>HAPPENING</span>
        </Link>
        <div className="nav-links nav-discovery" aria-label="Discover">
          <NavigationLink to="/" end>Home</NavigationLink>
          <NavigationLink to="/events">Events</NavigationLink>
          <NavigationLink to="/categories">Categories</NavigationLink>
          <NavigationLink to="/cities">Cities</NavigationLink>
          <NavigationLink to="/about">About</NavigationLink>
        </div>
        <div className="nav-links nav-account-links" aria-label={user ? "Your account" : "Sign in"}>
          {user ? (
            <>
              <NavigationLink to="/assistant">AI assistant</NavigationLink>
              {user.role === "USER" && <NavigationLink to="/dashboard">Dashboard</NavigationLink>}
              {["ORGANIZER", "ADMIN"].includes(user.role) && <NavigationLink to="/organizer">Organizer</NavigationLink>}
              {user.role === "ADMIN" && <NavigationLink to="/admin">Admin</NavigationLink>}
              <NavigationLink to="/account" className="nav-account">{user.name}</NavigationLink>
              <button className="nav-logout" type="button" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavigationLink to="/login">Log in</NavigationLink>
              <NavigationLink to="/register" className="nav-register">Sign up <span aria-hidden="true">↗</span></NavigationLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;