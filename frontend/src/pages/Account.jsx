import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Account() {
  const { user } = useAuth();

  return (
    <section className="section account-page">
      <span className="eyebrow">YOUR HAPPENING</span>
      <h1>Your <em>profile.</em></h1>
      <div className="profile-card">
        <p><span>Name</span><strong>{user.name}</strong></p>
        <p><span>Email</span><strong>{user.email}</strong></p>
        <p><span>Phone</span><strong>{user.phone}</strong></p>
        <p><span>Account type</span><strong>{user.role}</strong></p>
      </div>
      {user.role === "USER" && <p><Link to="/dashboard">Your dashboard</Link> · <Link to="/my-bookings">My bookings</Link> · <Link to="/my-favorites">My favorites</Link> · <Link to="/my-reviews">My reviews</Link></p>}
      {["ORGANIZER", "ADMIN"].includes(user.role) && <p><Link to="/organizer">Open organizer dashboard</Link></p>}
      {user.role === "ADMIN" && <p><Link to="/admin">Open admin dashboard</Link></p>}
      <p className="muted-note">Profile details are currently read-only.</p>
      <Link className="button button-dark" to="/events">Find something to do <span>↗</span></Link>
    </section>
  );
}

export default Account;
