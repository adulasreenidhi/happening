import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import api from "../services/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading events...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div className="events-page">
      <h1>Upcoming Events</h1>

      <p>Discover events happening around you.</p>

      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;