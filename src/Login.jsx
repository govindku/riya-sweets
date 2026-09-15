import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(".login-card", {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power4.out",
        })
        .from(
          ".login-brand",
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.5",
        )
        .from(
          ".login-field",
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.3",
        )
        .from(
          ".login-options",
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.25",
        )
        .from(
          ".login-submit",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.2",
        );
    });

    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Supabase Auth Login
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError("Invalid email or password.");
        return;
      }

      const authUser = authData.user;

      // Get customer profile from users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Create logged-in customer object
      const loggedInUser = {
        id: profile?.id || authUser?.id || null,
        authId: authUser?.id || null,
        name: profile?.name || authUser?.user_metadata?.name || "",
        phone: profile?.phone || "",
        email: profile?.email || authUser?.email || email,
        city: profile?.city || "",
        address: profile?.address || "",
        createdAt: profile?.created_at || new Date().toISOString(),
      };

      // Save for existing website compatibility
      localStorage.setItem(
        "riyaLoggedInUser",
        JSON.stringify(loggedInUser),
      );

      window.dispatchEvent(new Event("riyaLoginUpdated"));

      navigate("/my-account");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <Navbar />

      <div className="login-background">
        <div className="login-overlay"></div>

        <div className="login-container">
          <div className="login-card">
            <div className="login-brand">
              <span>RIYA.</span>
              <p>RESTAURANT & DINING</p>
            </div>

            <div className="login-heading">
              <p className="section-label">WELCOME BACK</p>

              <h1>
                Sign <i>In</i>
              </h1>

              <p>
                Sign in to your account and continue your Riya experience.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="login-field">
                <label>Password</label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && <p className="login-error">{error}</p>}

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <a href="#forgot">Forgot Password?</a>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In →"}
              </button>
            </form>

            <div className="login-divider">
              <span></span>
              <p>OR</p>
              <span></span>
            </div>

            <div className="login-create">
              <p>Don't have an account?</p>

              <button
                type="button"
                onClick={() => navigate("/register")}
              >
                Create an Account →
              </button>
            </div>

            <div className="login-footer">
              <span>RIYA.</span>
              <p>Good food. Great moments.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
