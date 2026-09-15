import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { supabase } from "./lib/supabase";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".register-card", {
        opacity: 0,
        y: 35,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".register-brand, .register-heading", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.12,
        delay: 0.15,
        ease: "power2.out",
      });

      gsap.from(".register-field, .register-submit, .register-login", {
        opacity: 0,
        y: 15,
        duration: 0.6,
        stagger: 0.08,
        delay: 0.3,
        ease: "power2.out",
      });
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
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const name = formData.name.trim();
    const phone = formData.phone.replace(/\D/g, "");
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name || !phone || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.length < 2) {
      setError("Please enter a valid name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Check existing profile by email
      const { data: emailUser, error: emailCheckError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (emailCheckError) {
        console.error("Email check error:", emailCheckError);
        throw new Error("Unable to check email. Please try again.");
      }

      if (emailUser) {
        setError("An account with this email already exists.");
        return;
      }

      // Check existing profile by phone
      const { data: phoneUser, error: phoneCheckError } = await supabase
        .from("users")
        .select("id, phone")
        .eq("phone", phone)
        .maybeSingle();

      if (phoneCheckError) {
        console.error("Phone check error:", phoneCheckError);
        throw new Error("Unable to check mobile number. Please try again.");
      }

      if (phoneUser) {
        setError("An account with this mobile number already exists.");
        return;
      }

      // Create Supabase Auth account
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
            },
          },
        });

      if (authError) {
        console.error("Supabase Auth error:", authError);

        if (authError.message?.toLowerCase().includes("already registered")) {
          setError("An account with this email already exists.");
        } else {
          setError(authError.message || "Account could not be created.");
        }

        return;
      }

      // Create customer profile in users table
      const createdAt = new Date().toISOString();

      const { data: createdUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            name,
            phone,
            email,
            city: "",
            address: "",
            created_at: createdAt,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("User profile insert error:", insertError);

        // Auth account already exists, so don't expose password anywhere.
        setError(
          "Account was created, but profile setup failed. Please contact support."
        );

        return;
      }

      // LocalStorage compatibility
      const existingUsers = JSON.parse(
        localStorage.getItem("riyaUsers") || "[]"
      );

      const newUser = {
        id: createdUser.id,
        authId: authData.user?.id || null,
        name: createdUser.name,
        phone: createdUser.phone,
        email: createdUser.email,
        city: createdUser.city || "",
        address: createdUser.address || "",
        createdAt: createdUser.created_at,
      };

      const updatedUsers = [
        ...existingUsers.filter(
          (user) =>
            user.email?.toLowerCase() !== email &&
            user.phone !== phone
        ),
        newUser,
      ];

      localStorage.setItem(
        "riyaUsers",
        JSON.stringify(updatedUsers)
      );

      window.dispatchEvent(new Event("riyaUserUpdated"));

      // Supabase email confirmation setting
      if (authData.user && authData.user.identities?.length === 0) {
        setError("An account with this email already exists.");
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="register-overlay"></div>

        <div className="register-container">
          <div className="register-card">
            <div className="register-brand">
              <span>RIYA</span>
              <p>RESTAURANT & CAFE</p>
            </div>

            <div className="register-heading">
              <small>WELCOME TO RIYA</small>

              <h1>
                Create <i>Account</i>
              </h1>

              <p>
                Join us and enjoy a better dining experience.
              </p>
            </div>

            <form
              className="register-form"
              onSubmit={handleSubmit}
            >
              <div className="register-field">
                <label htmlFor="name">Full Name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div className="register-field">
                <label htmlFor="phone">Mobile Number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="10"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>

              <div className="register-field">
                <label htmlFor="email">Email Address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="register-field">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div className="register-field">
                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="register-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="register-success">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="register-login">
              <p>Already have an account?</p>

              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                Login →
              </button>
            </div>

            <div className="register-footer">
              <span>RIYA</span>
              <p>GOOD FOOD • GREAT MOMENTS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
