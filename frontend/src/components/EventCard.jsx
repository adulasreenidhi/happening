import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

function EventCard({ event }) {
  if (!event) return null;

  const eventDate = event.date
    ? new Date(`${event.date}T${event.time || "00:00:00"}`)
    : null;

  const isValidDate = eventDate && !Number.isNaN(eventDate.getTime());
  const isFree = Number(event.price) === 0;
  const isSoldOut = event.availableSeats === 0;

  return (
    <article className="event-card">
      <div className="event-card-media-wrapper">
        <Link className="event-card-image" to={`/events/${event.id}`} tabIndex="-1" aria-hidden="true">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => {
                // Graceful fallback if image URL fails to load
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="event-image-fallback"
            style={{ display: event.imageUrl ? "none" : "flex" }}
          >
            <span className="fallback-category">{event.categoryName || "HAPPENING"}</span>
            <span className="fallback-city">{event.cityName || "CITY EVENT"}</span>
          </div>

          {isValidDate && (
            <time className="event-date-badge" dateTime={event.date}>
              <strong className="badge-day">
                {eventDate.toLocaleDateString(undefined, { day: "2-digit" })}
              </strong>
              <span className="badge-month">
                {eventDate.toLocaleDateString(undefined, { month: "short" })}
              </span>
            </time>
          )}
        </Link>

        <FavoriteButton eventId={event.id} />
      </div>

      <div className="event-card-body">
        <div className="event-card-meta">
          <span className="event-meta-category">{event.categoryName || "City Event"}</span>
          {event.cityName && (
            <span className="event-meta-city">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.cityName}
            </span>
          )}
        </div>

        <h3 className="event-card-title">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        {event.description && (
          <p className="event-card-description">{event.description}</p>
        )}

        <div className="event-card-footer">
          <div className="event-venue-seats">
            <span className="event-venue" title={event.venue}>{event.venue}</span>
            {event.availableSeats != null && (
              <span className={`event-seats-tag ${isSoldOut ? "is-sold-out" : ""}`}>
                {isSoldOut ? "Sold out" : `${event.availableSeats} seats left`}
              </span>
            )}
          </div>

          <div className="event-card-price">
            <strong>{isFree ? "Free" : `₹${event.price}`}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}

export default EventCard;