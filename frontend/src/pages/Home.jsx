import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      <section className="hero">
        <h1>Discover What's Happening</h1>

        <p>
          Find events, experiences and activities happening around your city.
        </p>

        <Link to="/events">
          Explore Events
        </Link>
      </section>

      <section className="home-intro">
        <h2>Find Events You’ll Love</h2>

        <p>
          Discover technology events, workshops, concerts, cultural events,
          sports and more.
        </p>
      </section>

      <section className="categories">
        <h2>Explore Categories</h2>

        <div className="category-list">
          <div className="category-card">Technology</div>
          <div className="category-card">Music</div>
          <div className="category-card">Sports</div>
          <div className="category-card">Arts & Culture</div>
        </div>
      </section>

      <section className="home-cta">
        <h2>Ready to discover your next event?</h2>

        <Link to="/events">
          Browse All Events
        </Link>
      </section>

    </div>
  );
}

export default Home;