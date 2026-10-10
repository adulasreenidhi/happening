import { Link } from "react-router-dom";

function About() {
  return (
    <div className="about-editorial-page container container-narrow">
      <div className="about-header">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          ABOUT HAPPENING
        </span>
        <h1 className="about-title">
          Good things happen<br />
          when people <em>show up.</em>
        </h1>
        <p className="about-lead">
          HAPPENING is a unified city event discovery and management platform built to bridge the gap
          between organizers creating cultural moments and people looking to experience them.
        </p>
      </div>

      <div className="about-editorial-content">
        <section className="about-section-block">
          <h2>For Event Seekers</h2>
          <p>
            Whether it’s an intimate acoustic set, a hands-on pottery workshop, or a weekend tech symposium,
            HAPPENING helps you discover and register for verified experiences happening near you. Filter by
            city, genre, date, or budget, and reserve tickets with confidence.
          </p>
        </section>

        <section className="about-section-block">
          <h2>For Organizers & Creators</h2>
          <p>
            Hosting an event should be straightforward. Organizers gain a dedicated studio workspace to
            publish listings, manage venue and seating capacities, and track real-time attendee registrations.
          </p>
        </section>

        <section className="about-section-block">
          <h2>Curated Quality & Moderation</h2>
          <p>
            To prevent spam and ensure accurate venue information, every newly submitted event is reviewed by
            platform administrators before appearing in public city discovery.
          </p>
        </section>

        <div className="about-actions-row">
          <Link className="button button-dark btn-lg" to="/events">
            Explore upcoming events <span aria-hidden="true">→</span>
          </Link>
          <Link className="button button-light btn-lg" to="/register">
            Join HAPPENING
          </Link>
        </div>
      </div>
    </div>
  );
}

export default About;
