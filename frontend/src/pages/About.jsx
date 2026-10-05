import { Link } from "react-router-dom";

function About() {
  return (
    <section className="section about-page">
      <span className="eyebrow">ABOUT HAPPENING</span>
      <h1>Good things happen<br />when you <em>show up.</em></h1>
      <p>
        HAPPENING brings local events and the people who make them together.
        Discover what is on, find a community that shares your interests, and
        make your next city plan.
      </p>
      <p>
        Organizers can share events with their city, and every new event is
        reviewed before it appears in public discovery.
      </p>
      <Link className="button button-dark" to="/events">Explore events <span>↗</span></Link>
    </section>
  );
}

export default About;
