import { useEffect, useState } from "react";
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
        if (active) setError("Your favorites could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [favoriteIds]);

  if (loading) return <p className="state-message" role="status">Loading your favorites…</p>;

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
    <section className="section dashboard-page">
      <span className="eyebrow">SAVED FOR LATER</span><h1>My <em>favorites.</em></h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {events.length === 0 ? <div className="empty-state"><h2>No saved events.</h2><p>Tap the heart on an event to keep it close.</p></div> : (
        <div className="events-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div>
      )}
    </section>
  );
}

export default MyFavorites;
