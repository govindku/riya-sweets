
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">

      {/* LOGO */}
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        RIYA<span>.</span>
      </Link>

      {/* DESKTOP / MOBILE MENU */}
      <nav className={`navbar-menu ${menuOpen ? "active" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/menu" onClick={closeMenu}>Menu</Link>
        <Link to="/about" onClick={closeMenu}>About</Link>
        <Link to="/gallery" onClick={closeMenu}>Gallery</Link>
        <Link to="/contact" onClick={closeMenu}>Contact</Link>
        <Link to="/my-account">My Account</Link>
        <Link to="/order" onClick={closeMenu}>Order</Link>
        <Link to="/login" onClick={closeMenu}>Login</Link>
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
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

    </header>
  );
}

export default Navbar;

