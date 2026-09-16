import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/Navbar";

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
  };

  const handleSubmit = (e) => {
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

    setSubmitting(true);
    setSubmitted(false);

    setTimeout(() => {
      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
      });

      setSubmitting(false);
      setSubmitted(true);
    }, 700);
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
          <p className="section-label">
            WE ARE HERE FOR YOU
          </p>

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

      

      {/* MAP */}
      <section
        className="contact-location-section"
        id="map"
      >
        <div className="contact-location-content">
          <p className="section-label">
            FIND US
          </p>

          <h2>
            Come and
            <br />
            <i>visit us.</i>
          </h2>

          <p>
            Visit Riya Sweets and enjoy delicious sweets,
            fresh cakes, namkeen and more.
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