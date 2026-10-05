import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

function EventCard({ event }) {
  const eventDate = event.date
    ? new Date(`${event.date}T${event.time || "00:00:00"}`)
    : null;

  return (
    <article className="event-card">
      <Link className="event-card-image" to={`/events/${event.id}`}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="event-image-placeholder" aria-hidden="true">
            <span>{event.categoryName || "HAPPENING"}</span>
          </span>
        )}
        {eventDate && !Number.isNaN(eventDate.getTime()) && (
          <time className="event-date-badge" dateTime={event.date}>
            <strong>{eventDate.toLocaleDateString(undefined, { day: "2-digit" })}</strong>
            <span>{eventDate.toLocaleDateString(undefined, { month: "short" })}</span>
          </time>
        )}
      </Link>
      <FavoriteButton eventId={event.id} />
      <div className="event-card-body">
        <div className="event-card-meta">
          <span>{event.categoryName || "City event"}</span>
          {event.cityName && <span>{event.cityName}</span>}
        </div>
        <h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3>
        <p className="event-card-description">{event.description}</p>
        <div className="event-card-footer">
          <span>{event.venue}{event.availableSeats != null && ` · ${event.availableSeats === 0 ? "sold out" : `${event.availableSeats} seats left`}`}</span>
          <strong>{Number(event.price) > 0 ? `₹${event.price}` : "Free"}</strong>
        </div>
      </div>
    </article>
  );
}

export default EventCard;