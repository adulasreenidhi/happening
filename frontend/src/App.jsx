import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyBookings from "./pages/MyBookings";
import MyFavorites from "./pages/MyFavorites";
import MyReviews from "./pages/MyReviews";
import UserDashboard from "./pages/UserDashboard";
import Catalog from "./pages/Catalog";
import About from "./pages/About";
import Assistant from "./pages/Assistant";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FavoriteProvider } from "./context/FavoriteContext.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoriteProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/categories" element={<Catalog type="categories" />} />
            <Route path="/cities" element={<Catalog type="cities" />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<Account />} />
              <Route path="/assistant" element={<Assistant />} />
            </Route>
            <Route element={<ProtectedRoute roles={["USER"]} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/my-favorites" element={<MyFavorites />} />
              <Route path="/my-reviews" element={<MyReviews />} />
            </Route>
            <Route element={<ProtectedRoute roles={["ORGANIZER", "ADMIN"]} />}>
              <Route path="/organizer" element={<OrganizerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        </FavoriteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;