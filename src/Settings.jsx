import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    restaurantName: "Riya Sweets",
    phone: "8434548649",
    email: "mjy121418@gmail.com",
    address: "House-Dinara, Chuk Road, Bihar, PIN 802213",
    openingTime: "07:00",
    closingTime: "20:00",
    deliveryCharge: 50,
  });

  const [admin, setAdmin] = useState({
    name: "Administrator",
    username: "admin",
  });

  const [message, setMessage] = useState("");

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem("riyaSettings") || "null"
      );

      const savedAdmin = JSON.parse(
        localStorage.getItem("riyaAdminProfile") || "null"
      );

      if (savedSettings) {
        setSettings((prev) => ({
          ...prev,
          ...savedSettings,
        }));
      }

      if (savedAdmin) {
        setAdmin((prev) => ({
          ...prev,
          ...savedAdmin,
        }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Restaurant settings change
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Admin profile change
  const handleAdminChange = (e) => {
    const { name, value } = e.target;

    setAdmin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save all settings
  const saveSettings = () => {
    try {
      const finalSettings = {
        ...settings,
        deliveryCharge: Number(settings.deliveryCharge) || 0,
      };

      localStorage.setItem(
        "riyaSettings",
        JSON.stringify(finalSettings)
      );

      localStorage.setItem(
        "riyaAdminProfile",
        JSON.stringify(admin)
      );

      // Update state with final values
      setSettings(finalSettings);

      setMessage("Settings saved successfully ✓");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("riyaAdminLoggedIn");
    navigate("/admin/login");
  };

  return (
    <div className="settings-layout">
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="settings-sidebar">
        <div className="settings-logo">
          <span>RIYA</span>
          <small>RESTAURANT ADMIN</small>
        </div>

        <nav className="settings-nav">
          <button onClick={() => navigate("/admin")}>
            📊 Dashboard
          </button>

          <button onClick={() => navigate("/admin/orders")}>
            🛒 Orders
          </button>

          <button onClick={() => navigate("/admin/users")}>
            👥 Users
          </button>

          <button onClick={() => navigate("/admin/menu")}>
            🍔 Menu
          </button>

          <button onClick={() => navigate("/admin/gallery")}>
            🖼️ Gallery
          </button>

          <button
            className="active"
            onClick={() => navigate("/admin/settings")}
          >
            ⚙️ Settings
          </button>

          <button
            className="logout-settings"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </nav>

        <div className="settings-sidebar-bottom">
          <span>RIYA SWEETS</span>
          <small>Admin Panel</small>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="settings-main">
        {/* HEADER */}

        <div className="settings-header">
          <div>
            <p>ADMIN PANEL</p>
            <h1>Settings</h1>
          </div>

          <button
            className="settings-save-top"
            onClick={saveSettings}
          >
            💾 Save Changes
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="settings-success">
            {message}
          </div>
        )}

        {/* =========================
            ADMIN PROFILE
        ========================= */}

        <section className="settings-section">
          <div className="settings-section-title">
            <div className="settings-section-icon">
              👤
            </div>

            <div>
              <h2>Admin Profile</h2>
              <p>Manage your administrator information</p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label>Admin Name</label>

              <input
                type="text"
                name="name"
                value={admin.name}
                onChange={handleAdminChange}
                placeholder="Enter admin name"
              />
            </div>

            <div className="settings-field">
              <label>Username</label>

              <input
                type="text"
                name="username"
                value={admin.username}
                onChange={handleAdminChange}
                placeholder="Enter username"
              />
            </div>
          </div>
        </section>

        {/* =========================
            RESTAURANT INFORMATION
        ========================= */}

        <section className="settings-section">
          <div className="settings-section-title">
            <div className="settings-section-icon">
              🍽️
            </div>

            <div>
              <h2>Restaurant Information</h2>
              <p>Update your restaurant details</p>
            </div>
          </div>

          <div className="settings-grid">
            {/* Restaurant Name */}

            <div className="settings-field">
              <label>Restaurant Name</label>

              <input
                type="text"
                name="restaurantName"
                value={settings.restaurantName}
                onChange={handleSettingsChange}
                placeholder="Enter restaurant name"
              />
            </div>

            {/* Phone */}

            <div className="settings-field">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleSettingsChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* Delivery Charge */}

            <div className="settings-field">
              <label>Delivery Charge (₹)</label>

              <input
                type="number"
                name="deliveryCharge"
                value={settings.deliveryCharge}
                onChange={handleSettingsChange}
                placeholder="Enter delivery charge"
                min="0"
              />
            </div>

            {/* Email */}

            <div className="settings-field">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleSettingsChange}
                placeholder="restaurant@example.com"
              />
            </div>

            {/* Address */}

            <div className="settings-field full-width">
              <label>Restaurant Address</label>

              <textarea
                name="address"
                value={settings.address}
                onChange={handleSettingsChange}
                placeholder="Enter restaurant address"
                rows="3"
              />
            </div>
          </div>
        </section>

        {/* =========================
            BUSINESS HOURS
        ========================= */}

        <section className="settings-section">
          <div className="settings-section-title">
            <div className="settings-section-icon">
              🕐
            </div>

            <div>
              <h2>Business Hours</h2>
              <p>Set restaurant opening and closing time</p>
            </div>
          </div>

          <div className="settings-grid">
            {/* Opening Time */}

            <div className="settings-field">
              <label>Opening Time</label>

              <input
                type="time"
                name="openingTime"
                value={settings.openingTime}
                onChange={handleSettingsChange}
              />
            </div>

            {/* Closing Time */}

            <div className="settings-field">
              <label>Closing Time</label>

              <input
                type="time"
                name="closingTime"
                value={settings.closingTime}
                onChange={handleSettingsChange}
              />
            </div>
          </div>
        </section>

        {/* =========================
            SECURITY
        ========================= */}

        <section className="settings-section security-section">
          <div className="settings-section-title">
            <div className="settings-section-icon">
              🔐
            </div>

            <div>
              <h2>Security</h2>
              <p>Manage your admin session</p>
            </div>
          </div>

          <div className="security-box">
            <div>
              <strong>Admin Session</strong>

              <p>
                You are currently logged in as an administrator.
              </p>
            </div>

            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>

        {/* =========================
            SAVE
        ========================= */}

        <div className="settings-bottom">
          <button
            className="save-settings-btn"
            onClick={saveSettings}
          >
            💾 Save All Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default Settings;