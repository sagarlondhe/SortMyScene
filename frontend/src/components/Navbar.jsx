import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="navbar">
      <Link to="/">
        <h1>Event Ticket Booking</h1>
      </Link>
      <nav>
        <Link to="/">Events</Link>
        {isAuthenticated ? (
          <>
            <Link to="/bookings">My Bookings</Link>
            <span className="muted">Hi, {user?.username}</span>
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
