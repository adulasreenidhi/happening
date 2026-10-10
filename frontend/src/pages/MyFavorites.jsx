import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { useFavorites } from "../context/useFavorites";
import { getMyFavorites } from "../services/platform";

function MyFavorites() {
  const { favoriteIds } = useFavorites();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyFavorites()
      .then(({ data }) => {
        if (active) setFavorites(data);
      })
      .catch(() => {
        if (active) setError("Your saved events could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [favoriteIds]);

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading your saved events…</p>
      </div>
    );
  }

  const events = favorites
    .filter((favorite) => favoriteIds.includes(favorite.eventId))
    .map((favorite) => ({
      id: favorite.eventId,
      title: favorite.eventTitle,
      cityName: favorite.cityName,
      categoryName: favorite.categoryName,
      date: favorite.date,
      time: favorite.time,
      venue: favorite.venue,
      price: favorite.price,
      availableSeats: favorite.availableSeats,
      imageUrl: favorite.imageUrl,
      description: "",
    }));

  return (
    <div className="favorites-page container">
      <div className="page-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          SAVED EXPERIENCES
        </span>
        <h1>Events you’ve <em>saved.</em></h1>
        <p>Keep track of gatherings, performances, and talks you are considering attending.</p>
      </div>

      {error && (
        <div className="state-panel error-message" role="alert">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">♥</div>
          <h2>No saved events yet.</h2>
          <p>Tap the heart icon on any event card to save it here for quick access later.</p>
          <Link className="button button-dark" to="/events">
            Browse events to save →
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyFavorites;
