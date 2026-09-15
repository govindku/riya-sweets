import { useEffect, useState } from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";

gsap.registerPlugin(ScrollTrigger);

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(".contact-hero-label", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(
          ".contact-hero-title",
          {
            y: 70,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.35"
        )
        .from(
          ".contact-hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5"
        );

      gsap.from(".contact-info-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".contact-info-grid",
          start: "top 80%",
        },
      });

      gsap.from(".contact-form-wrapper", {
        x: 70,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".contact-main",
          start: "top 75%",
        },
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

    setSubmitted(false);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.subject ||
      !formData.message.trim()
    ) {
      alert("Please fill all the fields.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitted(false);
      setErrorMessage("");

      const newMessage = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        status: "New",
      };

      const { data, error } = await supabase
        .from("messages")
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        console.error("Message submit error:", error);
        setErrorMessage(
          "Message send nahi ho saka. Please try again."
        );
        return;
      }

      // Keep localStorage updated for compatibility
      const existingMessages = JSON.parse(
        localStorage.getItem("riyaMessages") || "[]"
      );

      const localMessage = {
        id:
          data?.id ||
          "MSG-" + Date.now().toString().slice(-6),
        name: newMessage.name,
        phone: newMessage.phone,
        email: newMessage.email,
        subject: newMessage.subject,
        message: newMessage.message,
        status: newMessage.status,
        createdAt:
          data?.created_at || new Date().toISOString(),
      };

      localStorage.setItem(
        "riyaMessages",
        JSON.stringify([...existingMessages, localMessage])
      );

      // Notify Admin Messages if it is open in the same tab
      window.dispatchEvent(new Event("riyaMessagesUpdated"));

      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Contact form error:", error);

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <Navbar />

      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-overlay"></div>

        <div className="contact-hero-content">
          <p className="section-label contact-hero-label">
            GET IN TOUCH
          </p>

          <h1 className="contact-hero-title">
            Contact <i>Us</i>
          </h1>

          <p className="contact-hero-description">
            Have a question, want to make a reservation or simply
            want to say hello? We'd love to hear from you.
          </p>
        </div>

        <div className="contact-hero-scroll">
          SCROLL TO EXPLORE ↓
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="contact-info-section">
        <div className="contact-section-heading">
          <p className="section-label">WE ARE HERE FOR YOU</p>

          <h2>
            Let's start a
            <br />
            <i>conversation.</i>
          </h2>
        </div>

        <div className="contact-info-grid">
          {/* LOCATION */}
          <div className="contact-info-card">
            <div className="contact-info-icon">⌖</div>

            <span>VISIT US</span>

            <h3>Our Location</h3>

            <p>
              House-Dinara, Chuk Road,
              <br />
              Bihar, PIN 802213
            </p>

            <a
              href="https://maps.app.goo.gl/xpaSz7rNECjJJcMW9"
              target="_blank"
              rel="noreferrer"
            >
              Get Directions →
            </a>
          </div>

          {/* PHONE */}
          <div className="contact-info-card">
            <div className="contact-info-icon">☎</div>

            <span>CALL US</span>

            <h3>Phone</h3>

            <p>
              +91 84345 48649
              <br />
              Customer Support
            </p>

            <a href="tel:+918434548649">
              Call Now →
            </a>
          </div>

          {/* EMAIL */}
          <div className="contact-info-card">
            <div className="contact-info-icon">✉</div>

            <span>EMAIL US</span>

            <h3>Email</h3>

            <p>
              mjy121418@gmail.com
              <br />
              We'll be happy to help.
            </p>

            <a href="mailto:mjy121418@gmail.com">
              Send Email →
            </a>
          </div>

          {/* OPENING HOURS */}
          <div className="contact-info-card">
            <div className="contact-info-icon">◷</div>

            <span>OPENING HOURS</span>

            <h3>When We're Open</h3>

            <p>
              Monday – Sunday
              <br />
              7:00 AM – 8:00 PM
            </p>

            <p className="contact-hours-extra">
              Open all days
              <br />
              Come visit Riya Sweets.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="contact-main">
        <div className="contact-form-content">
          <p className="section-label">SEND A MESSAGE</p>

          <h2>
            We'd love to
            <br />
            <i>hear from you.</i>
          </h2>

          <p>
            Whether you're planning a special celebration, have a
            question about our menu or simply want to connect, send
            us a message.
          </p>

          <div className="contact-form-note">
            <span>RIYA SWEETS.</span>
            <small>Fresh sweets. Great moments.</small>
          </div>
        </div>

        <div className="contact-form-wrapper">
          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="form-row">
              <div className="form-group">
                <label>Your Name</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Subject</label>

              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="" disabled>
                  Select a subject
                </option>

                <option value="Party Booking">
                  Party Booking
                </option>

                <option value="Order Enquiry">
                  Order Enquiry
                </option>

                <option value="General Enquiry">
                  General Enquiry
                </option>

                <option value="Feedback">
                  Feedback
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Your Message</label>

              <textarea
                rows="6"
                name="message"
                placeholder="Write your message..."
                value={formData.message}
                onChange={handleChange}
                disabled={submitting}
              ></textarea>
            </div>

            {submitted && (
              <div className="contact-success-message">
                ✓ Your message has been sent successfully.
              </div>
            )}

            {errorMessage && (
              <div className="contact-success-message">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="contact-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Message →"}
            </button>
          </form>
        </div>
      </section>

      {/* MAP */}
      <section
        className="contact-location-section"
        id="map"
      >
        <div className="contact-location-content">
          <p className="section-label">FIND US</p>

          <h2>
            Come and
            <br />
            <i>visit us.</i>
          </h2>

          <p>
            Visit Riya Sweets and enjoy delicious sweets, fresh
            cakes, namkeen and more.
          </p>

          <div className="location-details">
            <div>
              <span>ADDRESS</span>

              <p>
                House-Dinara, Chuk Road,
                <br />
                Bihar, PIN 802213
              </p>
            </div>

            <div>
              <span>OPENING HOURS</span>

              <p>
                Monday – Sunday
                <br />
                7:00 AM – 8:00 PM
              </p>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/xpaSz7rNECjJJcMW9"
            target="_blank"
            rel="noreferrer"
            className="map-button"
          >
            Get Directions →
          </a>
        </div>

        <div className="google-map-wrapper">
          <iframe
            title="Riya Sweets Location"
            src="https://www.google.com/maps?q=House-Dinara%2C%20Chuk%20Road%2C%20Bihar%2C%20802213&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </main>
  );
}

export default Contact;
