import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./Reservation.css";
import { supabase } from "./lib/supabase";

function Reservation() {
  const navigate = useNavigate();

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    table: "Indoor",
    request: "",
  });

  const [bookingId, setBookingId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // LOAD LOGGED-IN CUSTOMER
  // =========================
  useEffect(() => {
    const loggedInUser = JSON.parse(
      localStorage.getItem("riyaLoggedInUser") || "null",
    );

    if (loggedInUser) {
      setFormData((prev) => ({
        ...prev,
        name: loggedInUser.name || "",
        phone: loggedInUser.phone || "",
      }));
    }
  }, []);

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // VALIDATE TIME
  // =========================
  const isValidTime = (time) => {
    if (!time) return false;

    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    const openingTime = 11 * 60;
    const closingTime = 23 * 60;

    return totalMinutes >= openingTime && totalMinutes <= closingTime;
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // FORMAT TIME
  // =========================
  const formatTime = (time) => {
    if (!time) return "—";

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================
  // SUBMIT RESERVATION
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    // =========================
    // CHECK LOGIN
    // =========================
    const loggedInUser = JSON.parse(
      localStorage.getItem("riyaLoggedInUser") || "null",
    );

    if (!loggedInUser) {
      alert("Please login before booking a table.");
      navigate("/login");
      return;
    }

    const name = formData.name.trim();
    const phone = formData.phone.trim();

    // =========================
    // REQUIRED FIELDS
    // =========================
    if (!name || !phone || !formData.date || !formData.time) {
      alert("Please fill all required fields.");
      return;
    }

    // =========================
    // NAME VALIDATION
    // =========================
    if (name.length < 2) {
      alert("Please enter a valid name.");
      return;
    }

    // =========================
    // PHONE VALIDATION
    // =========================
    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // =========================
    // DATE VALIDATION
    // =========================
    const today = getToday();

    if (formData.date < today) {
      alert("Please select today or a future date.");
      return;
    }

    // =========================
    // TIME VALIDATION
    // =========================
    if (!isValidTime(formData.time)) {
      alert("Reservation time must be between 11:00 AM and 11:00 PM.");
      return;
    }

    try {
      setSubmitting(true);

      // =========================
      // CHECK DUPLICATE BOOKING
      // =========================
      const { data: existingBookings, error: duplicateError } =
        await supabase
          .from("reservations")
          .select("id, booking_id, status")
          .eq("reservation_date", formData.date)
          .eq("reservation_time", formData.time)
          .eq("table_preference", formData.table)
          .neq("status", "Cancelled");

      if (duplicateError) {
        console.error("Duplicate check error:", duplicateError);
        alert("Unable to check table availability. Please try again.");
        return;
      }

      if (existingBookings && existingBookings.length > 0) {
        alert(
          "This table is already reserved for the selected date and time. Please choose another time or table.",
        );
        return;
      }

      // =========================
      // GENERATE BOOKING ID
      // =========================
      const newBookingId =
        "RIYA-" + Date.now().toString().slice(-6);

      // =========================
      // SAVE RESERVATION TO SUPABASE
      // =========================
      const reservationData = {
        booking_id: newBookingId,
        user_id: loggedInUser.email || "",
        customer_name: name,
        customer_phone: cleanPhone,
        customer_email: loggedInUser.email || "",
        reservation_date: formData.date,
        reservation_time: formData.time,
        guests: Number(formData.guests),
        table_preference: formData.table,
        special_request: formData.request.trim(),
        status: "Pending",
      };

      const { data: savedReservation, error: insertError } =
        await supabase
          .from("reservations")
          .insert([reservationData])
          .select()
          .single();

      if (insertError) {
        console.error("Reservation insert error:", insertError);
        alert("Booking could not be saved. Please try again.");
        return;
      }

      // =========================
      // SAVE / UPDATE USER
      // =========================
      const existingUsers = JSON.parse(
        localStorage.getItem("riyaUsers") || "[]",
      );

      const userEmail = loggedInUser.email?.toLowerCase();

      const userIndex = existingUsers.findIndex(
        (user) => user.email?.toLowerCase() === userEmail,
      );

      const updatedUser = {
        ...loggedInUser,
        name,
        phone: cleanPhone,
        email: loggedInUser.email,
        address: loggedInUser.address || "",
        city: loggedInUser.city || "",
        pincode: loggedInUser.pincode || "",
      };

      if (userIndex >= 0) {
        const updatedUsers = [...existingUsers];

        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          ...updatedUser,
        };

        localStorage.setItem(
          "riyaUsers",
          JSON.stringify(updatedUsers),
        );
      } else {
        const newUser = {
          id: "USER-" + Date.now().toString().slice(-6),
          ...updatedUser,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(
          "riyaUsers",
          JSON.stringify([...existingUsers, newUser]),
        );
      }

      // Keep logged-in customer updated
      localStorage.setItem(
        "riyaLoggedInUser",
        JSON.stringify(updatedUser),
      );

      // =========================
      // CREATE DISPLAY OBJECT
      // =========================
      const bookingForDisplay = {
        id: savedReservation.id,
        bookingId: savedReservation.booking_id,
        userId: savedReservation.user_id,
        customer: {
          name: savedReservation.customer_name,
          phone: savedReservation.customer_phone,
          email: savedReservation.customer_email || "",
        },
        date: savedReservation.reservation_date,
        time: savedReservation.reservation_time,
        guests: savedReservation.guests,
        table: savedReservation.table_preference,
        request: savedReservation.special_request || "",
        status: savedReservation.status,
        createdAt: savedReservation.created_at,
      };

      // =========================
      // UPDATE OLD LOCAL EVENT
      // =========================
      window.dispatchEvent(
        new Event("riyaReservationUpdated"),
      );

      // =========================
      // SAVE SUCCESS INFORMATION
      // =========================
      setBookingId(savedReservation.booking_id);
      setConfirmedBooking(bookingForDisplay);
      setSubmitted(true);

      // =========================
      // RESET FORM
      // =========================
      setFormData({
        name: "",
        phone: "",
        date: "",
        time: "",
        guests: "2",
        table: "Indoor",
        request: "",
      });

      // =========================
      // SCROLL TO TOP
      // =========================
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Reservation error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // MAKE ANOTHER BOOKING
  // =========================
  const makeAnotherBooking = () => {
    const loggedInUser = JSON.parse(
      localStorage.getItem("riyaLoggedInUser") || "null",
    );

    setSubmitted(false);
    setBookingId("");
    setConfirmedBooking(null);

    setFormData({
      name: loggedInUser?.name || "",
      phone: loggedInUser?.phone || "",
      date: "",
      time: "",
      guests: "2",
      table: "Indoor",
      request: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // SUCCESS PAGE
  // =========================
  if (submitted) {
    return (
      <>
        <Navbar />

        <main className="reservation-page">
          <section className="reservation-success">
            <div className="success-icon">✓</div>

            <p className="section-label">
              RESERVATION REQUEST RECEIVED
            </p>

            <h1>
              Table Request
              <br />
              Received
            </h1>

            <p className="success-text">
              Thank you for choosing Riya Restaurant. Your reservation
              request has been received successfully.
            </p>

            <div className="booking-id-box">
              <span>Booking ID</span>
              <strong>{bookingId}</strong>
            </div>

            {confirmedBooking && (
              <div className="reservation-summary">
                <div className="summary-row">
                  <span>Guest Name</span>
                  <strong>
                    {confirmedBooking.customer.name}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Phone</span>
                  <strong>
                    {confirmedBooking.customer.phone}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Date</span>
                  <strong>
                    {formatDate(confirmedBooking.date)}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Time</span>
                  <strong>
                    {formatTime(confirmedBooking.time)}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Guests</span>
                  <strong>
                    {confirmedBooking.guests}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Table</span>
                  <strong>
                    {confirmedBooking.table}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Status</span>
                  <strong className="summary-status">
                    Pending
                  </strong>
                </div>
              </div>
            )}

            <p className="reservation-note">
              Your reservation is currently pending. Our restaurant
              team will review your request.
            </p>

            <div className="success-actions">
              <button
                className="btn-primary"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>

              <button
                className="btn-secondary"
                onClick={makeAnotherBooking}
              >
                Make Another Booking
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate("/my-account")}
              >
                My Bookings
              </button>
            </div>
          </section>
        </main>
      </>
    );
  }

  // =========================
  // RESERVATION FORM
  // =========================
  return (
    <>
      <Navbar />

      <main className="reservation-page">

        {/* HERO */}
        <section className="reservation-hero">
          <p className="section-label">
            RESERVE YOUR TABLE
          </p>

          <h1>
            Make Your
            <br />
            Reservation
          </h1>

          <p>
            Reserve your table at Riya Restaurant and enjoy a
            memorable dining experience.
          </p>
        </section>

        {/* FORM CONTAINER */}
        <section className="reservation-container">

          {/* INFORMATION */}
          <div className="reservation-info">
            <p className="section-label">
              RIYA RESTAURANT
            </p>

            <h2>
              Your table is
              <br />
              waiting for you.
            </h2>

            <p>
              Whether it's a family dinner, a special celebration,
              or a casual evening with friends, reserve your
              preferred table in advance.
            </p>

            <div className="reservation-details">
              <div>
                <span>Opening Hours</span>
                <strong>07:00 AM - 08:00 PM</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>+91 84345 48649</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>Dinara Riya Sweet</strong>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form
            className="reservation-form"
            onSubmit={handleSubmit}
          >

            {/* NAME + PHONE */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  maxLength="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Phone <span>*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  inputMode="numeric"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            {/* DATE + TIME */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Date <span>*</span>
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getToday()}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Time <span>*</span>
                </label>

                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  min="11:00"
                  max="23:00"
                  required
                />

                <small className="input-help">
                  Available: 11:00 AM — 11:00 PM
                </small>
              </div>
            </div>

            {/* GUESTS + TABLE */}
            <div className="form-row">
              <div className="form-group">
                <label>Guests</label>

                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                >
                  {Array.from({ length: 12 }, (_, index) => {
                    const guestCount = index + 1;

                    return (
                      <option
                        key={guestCount}
                        value={guestCount}
                      >
                        {guestCount}{" "}
                        {guestCount === 1 ? "Guest" : "Guests"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Table Preference</label>

                <select
                  name="table"
                  value={formData.table}
                  onChange={handleChange}
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Window">Window</option>
                  <option value="Private">
                    Private Table
                  </option>
                </select>
              </div>
            </div>

            {/* SPECIAL REQUEST */}
            <div className="form-group">
              <label>Special Request</label>

              <textarea
                name="request"
                value={formData.request}
                onChange={handleChange}
                placeholder="Any special request?"
                rows="5"
                maxLength="500"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="reservation-submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Reserve My Table →"}
            </button>

            <p className="reservation-note">
              * Your reservation request will be reviewed by our
              restaurant team.
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

export default Reservation;
