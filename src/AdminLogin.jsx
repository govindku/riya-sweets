import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const adminUsername = "admin";
    const adminPassword = "admin123";

    if (
      username.trim() === adminUsername &&
      password === adminPassword
    ) {
      localStorage.setItem("riyaAdminLoggedIn", "true");

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 300);
    } else {
      setLoading(false);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        {/* Logo / Icon */}
        <div className="admin-login-logo">
          <span>🍰</span>
        </div>

        {/* Heading */}
        <div className="admin-login-heading">
          <h1>Admin Login</h1>
          <p>Riya Sweets Management Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="admin-login-form">

          {/* Username */}
          <div className="admin-form-group">
            <label htmlFor="admin-username">
              Username
            </label>

            <div className="admin-input-wrapper">
              <span className="admin-input-icon">👤</span>

              <input
                id="admin-username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-form-group">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-input-wrapper">
              <span className="admin-input-icon">🔒</span>

              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="admin-login-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-login-spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                🔐 Login to Dashboard
              </>
            )}
          </button>
        </form>

        {/* Back to Website */}
        <button
          type="button"
          className="admin-back-home"
          onClick={() => navigate("/")}
        >
          ← Back to Website
        </button>

        {/* Footer */}
        <div className="admin-login-footer">
          <span>Riya Sweets</span>
          <span>•</span>
          <span>Admin Panel</span>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
