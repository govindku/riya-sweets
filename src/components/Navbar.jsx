import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Prevent navigation when user clicks
  // the navbar link of the page they are already on.
  const handleNavigation = (event, path) => {
    if (location.pathname === path) {
      event.preventDefault();
    }

    closeMenu();
  };

  return (
    <header className="navbar">
      {/* LOGO */}
      <Link
        to="/"
        className="navbar-logo"
        onClick={(event) => handleNavigation(event, "/")}
      >
        RIYA<span>.</span>
      </Link>

      {/* DESKTOP / MOBILE MENU */}
      <nav className={`navbar-menu ${menuOpen ? "active" : ""}`}>
        <Link
          to="/"
          onClick={(event) => handleNavigation(event, "/")}
        >
          Home
        </Link>

        <Link
          to="/menu"
          onClick={(event) => handleNavigation(event, "/menu")}
        >
          Menu
        </Link>

        <Link
          to="/about"
          onClick={(event) => handleNavigation(event, "/about")}
        >
          About
        </Link>

        <Link
          to="/gallery"
          onClick={(event) => handleNavigation(event, "/gallery")}
        >
          Gallery
        </Link>

        <Link
          to="/contact"
          onClick={(event) => handleNavigation(event, "/contact")}
        >
          Contact
        </Link>

        <Link
          to="/my-account"
          onClick={(event) => handleNavigation(event, "/my-account")}
        >
          My Account
        </Link>

        <Link
          to="/order"
          onClick={(event) => handleNavigation(event, "/order")}
        >
          Order
        </Link>

        <Link
          to="/login"
          onClick={(event) => handleNavigation(event, "/login")}
        >
          Login
        </Link>
      </nav>

      {/* BOOK TABLE */}
      <Link
        to="/contact#reservation"
        className="navbar-button"
        onClick={closeMenu}
      >
        Book a Table
      </Link>

      {/* HAMBURGER */}
      <button
        className={`navbar-toggle ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation"
        type="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
  );
}

export default Navbar;
