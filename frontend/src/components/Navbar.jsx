import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link className="brand" to="/" aria-label="HAPPENING home">
        <span className="brand-mark" aria-hidden="true">H</span>
        HAPPENING
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>
        {user ? (
          <>
            <Link to="/assistant">AI assistant</Link>
            {user.role === "USER" && <Link to="/dashboard">Dashboard</Link>}
            {["ORGANIZER", "ADMIN"].includes(user.role) && <Link to="/organizer">Organizer</Link>}
            {user.role === "ADMIN" && <Link to="/admin">Admin</Link>}
            <Link to="/account" className="nav-account">{user.name}</Link>
            <button className="nav-logout" type="button" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link className="nav-register" to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;