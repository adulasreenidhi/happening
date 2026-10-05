import { Link } from "react-router-dom";

function EventCard({ event }) {
  return (
    <div>
      <img
        src={event.imageUrl}
        alt={event.title}
      />

      <h3>{event.title}</h3>

      <p>{event.description}</p>

      <p>Venue: {event.venue}</p>

      <p>Date: {event.date}</p>

      <p>Price: ₹{event.price}</p>

      <Link to={`/events/${event.id}`}>
        View Details
      </Link>
    </div>
  );
}

export default EventCard;