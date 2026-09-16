import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setError(
          "Password reset link is invalid or has expired."
        );
      }

      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    setError("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/admin/login", {
          replace: true,
        });
      }, 2000);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Checking reset link...
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          <span>🔐</span>
        </div>

        <div className="admin-login-heading">
          <h1>Reset Password</h1>
          <p>
            Create a new password for your
            Riya Sweets admin account
          </p>
        </div>

        {!success ? (
          <form
            onSubmit={handleUpdatePassword}
            className="admin-login-form"
          >
            <div className="admin-form-group">
              <label htmlFor="new-password">
                New Password
              </label>

              <div className="admin-input-wrapper">
                <span className="admin-input-icon">
                  🔒
                </span>

                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <div className="admin-input-wrapper">
                <span className="admin-input-icon">
                  🔒
                </span>

                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {error && (
              <div className="admin-login-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading
                ? "Updating Password..."
                : "🔐 Update Password"}
            </button>
          </form>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "50px",
                marginBottom: "15px",
              }}
            >
              ✅
            </div>

            <h3>Password Updated Successfully</h3>

            <p>
              Redirecting to Admin Login...
            </p>
          </div>
        )}

        <button
          type="button"
          className="admin-back-home"
          onClick={() => navigate("/")}
        >
          ← Back to Website
        </button>

        <div className="admin-login-footer">
          <span>Riya Sweets</span>
          <span>•</span>
          <span>Admin Panel</span>
        </div>

      </div>
    </div>
  );
}

export default ResetPassword;