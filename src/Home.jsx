import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

function Home() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);

  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurantName: "Riya Sweets",
    phone: "8434548649",
    email: "mjy121418@gmail.com",
    address: "House-Dinara, Chuk Road, Bihar, PIN 802213",
    openingTime: "07:00",
    closingTime: "20:00",
  });

  const [currentReview, setCurrentReview] = useState(0);

  const menuSliderRef = useRef(null);

  // =========================
  // REVIEWS
  // =========================

  const reviews = [
    {
      name: "Aarav Sharma",
      role: "Customer",
      review:
        "The cake was fresh, delicious and beautifully made. Perfect for our celebration.",
    },
    {
      name: "Priya Singh",
      role: "Regular Customer",
      review:
        "Riya Sweets has become one of our favourite places for fresh sweets and cakes.",
    },
    {
      name: "Rahul Verma",
      role: "Customer",
      review:
        "Great taste and fresh products. The cake looked amazing and tasted even better.",
    },
    {
      name: "Ananya Gupta",
      role: "Customer",
      review:
        "Ordered a cake for a special occasion and everything was prepared with great care.",
    },
    {
      name: "Kabir Mehta",
      role: "Customer",
      review:
        "Fresh sweets, delicious cakes and a great variety of treats. Highly recommended.",
    },
    {
      name: "Meera Kapoor",
      role: "Regular Customer",
      review:
        "The quality and taste are consistently good. Riya Sweets is a great choice for celebrations.",
    },
  ];

  // =========================
  // LOAD SETTINGS
  // =========================

  const loadSettings = () => {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem("riyaSettings") || "null"
      );

      if (savedSettings) {
        setRestaurantSettings((prev) => ({
          ...prev,
          ...savedSettings,
        }));
      }
    } catch (error) {
      console.error("Error loading restaurant settings:", error);
    }
  };

  // =========================
  // LOAD POPULAR MENU
  // =========================

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .eq("is_popular", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading popular menu:", error);
        setMenuItems([]);
        return;
      }

      const popularItems = (data || []).map((item) => ({
        ...item,
        image: item.image_url || "",
        popular: item.is_popular === true,
      }));

      setMenuItems(popularItems);

      console.log("Home Popular Items:", popularItems);
    } catch (error) {
      console.error("Error loading menu:", error);
      setMenuItems([]);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadSettings();
    loadMenu();

    const handleStorage = () => {
      loadSettings();
    };

    const handleMenuUpdate = () => {
      loadMenu();
    };

    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("riyaMenuUpdated", handleMenuUpdate);
    window.addEventListener("riyaSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("riyaMenuUpdated", handleMenuUpdate);
      window.removeEventListener(
        "riyaSettingsUpdated",
        handleSettingsUpdate
      );
    };
  }, []);

  // =========================
  // HERO ANIMATION
  // =========================

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline();

      heroTimeline
        .from(".hero-small", {
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(
          ".hero h1",
          {
            y: 45,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.35"
        )
        .from(
          ".hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.55"
        )
        .from(
          ".hero-buttons",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".hero-scroll",
          {
            opacity: 0,
            duration: 0.5,
          },
          "-=0.2"
        );
    });

    return () => ctx.revert();
  }, []);

  // =========================
  // SCROLL ANIMATIONS
  // =========================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils
        .toArray(
          ".about-image, .about-content, .menu-heading, .why-heading, .why-card, .reviews-heading, .reservation-content"
        )
        .forEach((element) => {
          gsap.fromTo(
            element,
            {
              y: 45,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: element,
                start: "top 85%",
                once: true,
              },
            }
          );
        });

      gsap.utils.toArray(".dish-card").forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            y: 50,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: index * 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".dish-grid",
              start: "top 85%",
              once: true,
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, [menuItems]);

  // =========================
  // REVIEW AUTO SLIDER
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) =>
        prev === reviews.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [reviews.length]);

  // =========================
  // REVIEW NAVIGATION
  // =========================

  const previousReview = () => {
    setCurrentReview((prev) =>
      prev === 0 ? reviews.length - 1 : prev - 1
    );
  };

  const nextReview = () => {
    setCurrentReview((prev) =>
      prev === reviews.length - 1 ? 0 : prev + 1
    );
  };

  // =========================
  // MENU SLIDER
  // =========================

  const scrollMenu = (direction) => {
    if (!menuSliderRef.current) return;

    const slider = menuSliderRef.current;

    const scrollAmount = Math.min(slider.clientWidth * 0.85, 500);

    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // =========================
  // TIME FORMAT
  // =========================

  const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    let hour = Number(hours);

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Navbar />

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">
        <div className="hero-content">
          <p className="hero-small">
            WELCOME TO {restaurantSettings.restaurantName.toUpperCase()}
          </p>

          <h1>
            Sweet Moments,
            <br />
            <span>Freshly Made.</span>
          </h1>

          <p className="hero-description">
            Fresh Cakes, Delicious Sweets & More — Made with Care at Riya
            Sweets. Perfect for birthdays, parties, celebrations and every
            special moment.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/menu")}
            >
              Explore Menu →
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/reservation")}
            >
              Plan Your Celebration
            </button>
          </div>
        </div>

        <div className="hero-scroll" aria-hidden="true">
          SCROLL TO EXPLORE
        </div>
      </section>

      {/* =========================
          ABOUT PREVIEW
      ========================= */}

      <section className="about-preview">
        <div className="about-image">
          <img
            src="/images/riya-2.jpeg"
            alt={`${restaurantSettings.restaurantName} interior`}
          />
        </div>

        <div className="about-content">
          <p className="section-label">OUR STORY</p>

          <h2>
            Made With
            <br />
            <i>Passion.</i>
          </h2>

          <p>
            At {restaurantSettings.restaurantName}, every dish is created with
            attention to flavour, presentation and quality. Our goal is simple
            — to give every guest a dining experience worth remembering.
          </p>

          <button
            type="button"
            className="text-link"
            onClick={() => navigate("/about")}
          >
            Discover Our Story →
          </button>
        </div>
      </section>

      {/* =========================
          POPULAR MENU
      ========================= */}

      <section className="popular-menu">
        <div className="menu-heading">
          <div>
            <p className="section-label">OUR CUSTOMER FAVOURITES</p>

            <h2>
              Popular <i>Sweet Treats.</i>
            </h2>
          </div>

          <button
            type="button"
            className="text-link menu-view-all"
            onClick={() => navigate("/menu")}
            aria-label="View the complete Riya Sweets menu"
          >
            View Full Menu →
          </button>
        </div>

        {menuItems.length === 0 ? (
          <div className="home-menu-empty">
            <span aria-hidden="true">🍰</span>

            <h3>Popular Treats Coming Soon</h3>

            <p>Our customer favourites will appear here soon.</p>
          </div>
        ) : (
          <div className="dish-carousel-wrapper">
            <button
              type="button"
              className="dish-arrow dish-arrow-left"
              onClick={() => scrollMenu("left")}
              aria-label="Show previous popular items"
            >
              ←
            </button>

            <div
              className="dish-grid"
              ref={menuSliderRef}
              aria-label="Popular Riya Sweets items"
            >
              {menuItems.map((item) => (
                <article className="dish-card" key={item.id}>
                  <div className="dish-image">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                    />

                    {item.tag && (
                      <span className="dish-badge">
                        {item.tag}
                      </span>
                    )}

                    {item.popular && (
                      <span className="dish-badge">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="dish-info">
                    <div>
                      <p className="dish-category">
                        {item.category || "Special"}
                      </p>

                      <h3>{item.name}</h3>

                      {item.description && (
                        <p className="dish-description">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <span className="dish-price">
                      ₹{Number(item.price || 0)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="dish-arrow dish-arrow-right"
              onClick={() => scrollMenu("right")}
              aria-label="Show next popular items"
            >
              →
            </button>
          </div>
        )}
      </section>

      {/* =========================
          WHY CHOOSE RIYA
      ========================= */}

      <section className="why-choose">
        <div className="why-heading">
          <p className="section-label">WHY RIYA SWEETS</p>

          <h2>
            Made For
            <br />
            <i>Special Moments.</i>
          </h2>

          <p>
            From freshly made cakes to delicious sweets and namkeen, Riya
            Sweets brings quality, freshness and great taste to every
            celebration.
          </p>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <span className="why-number">01</span>

            <div className="why-icon" aria-hidden="true">
              ✦
            </div>

            <h3>Freshly Made Cakes</h3>

            <p>
              Our own cake-making facility prepares fresh cakes with care,
              quality ingredients and attention to taste.
            </p>
          </div>

          <div className="why-card">
            <span className="why-number">02</span>

            <div className="why-icon" aria-hidden="true">
              ◇
            </div>

            <h3>Quality & Freshness</h3>

            <p>
              We focus on freshness and quality across our cakes, sweets,
              namkeen and other delicious treats.
            </p>
          </div>

          <div className="why-card">
            <span className="why-number">03</span>

            <div className="why-icon" aria-hidden="true">
              ♡
            </div>

            <h3>Perfect For Celebrations</h3>

            <p>
              Birthday cakes, custom cakes, sweets and celebration supplies
              make your special moments even more memorable.
            </p>
          </div>

          <div className="why-card">
            <span className="why-number">04</span>

            <div className="why-icon" aria-hidden="true">
              ◎
            </div>

            <h3>Home Delivery</h3>

            <p>
              Enjoy your favourite Riya Sweets products at home with delivery
              available within our service area.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          REVIEWS
      ========================= */}

      <section className="reviews-section">
        <div className="reviews-heading">
          <p className="section-label">GUEST EXPERIENCES</p>

          <h2>
            What They <i>Say.</i>
          </h2>
        </div>

        <div className="reviews-slider">
          <button
            type="button"
            className="review-arrow"
            onClick={previousReview}
            aria-label="Previous review"
          >
            ←
          </button>

          <div className="review-track">
            {reviews.map((review, index) => (
              <article
                className={`review-slide ${
                  index === currentReview ? "active" : ""
                }`}
                key={review.name}
              >
                <div className="review-stars">★★★★★</div>

                <p className="review-quote">
                  “{review.review}”
                </p>

                <div className="review-author">
                  <div className="review-avatar">
                    {review.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{review.name}</h3>
                    <span>{review.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="review-arrow"
            onClick={nextReview}
            aria-label="Next review"
          >
            →
          </button>
        </div>

        <div className="review-dots">
          {reviews.map((review, index) => (
            <button
              type="button"
              key={review.name}
              className={`review-dot ${
                index === currentReview ? "active" : ""
              }`}
              onClick={() => setCurrentReview(index)}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* =========================
          RESERVATION CTA
      ========================= */}

      <section className="reservation-cta">
        <div className="reservation-overlay"></div>

        <div className="reservation-content">
          <p className="section-label">
            MAKE YOUR CELEBRATION SPECIAL
          </p>

          <h2>
            Celebrate
            <br />
            <i>With Something Sweet.</i>
          </h2>

          <p>
            Planning a birthday, party or special celebration? Book your
            celebration requirements with Riya Sweets and make your special
            moments even sweeter.
          </p>

          <div className="reservation-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/reservation")}
              aria-label="Plan your celebration with Riya Sweets"
            >
              Plan Your Celebration →
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/menu")}
              aria-label="Explore the Riya Sweets menu"
            >
              Explore Menu
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="site-footer">
        <div className="footer-inner">
          {/* BRAND */}

          <div className="footer-brand">
            <div className="footer-logo">
              {restaurantSettings.restaurantName
                .replace(/\s+/g, "")
                .toUpperCase()}
              <span>.</span>
            </div>

            <p>
              A modern restaurant experience built around great food,
              beautiful moments and genuine hospitality.
            </p>

            <div className="footer-socials">
              <a
                href="https://www.instagram.com/new_riya_sweets22/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                IG
              </a>

              <a
                href="https://www.facebook.com/share/19TGHKHrTc/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                FB
              </a>

              <a
                href="https://wa.me/918434548649"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                WA
              </a>
            </div>
          </div>

          {/* EXPLORE */}

          <div className="footer-column">
            <p className="footer-title">EXPLORE</p>

            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => navigate("/menu")}
            >
              Menu
            </button>

            <button
              type="button"
              onClick={() => navigate("/about")}
            >
              About
            </button>

            <button
              type="button"
              onClick={() => navigate("/gallery")}
            >
              Gallery
            </button>
          </div>

          {/* INFORMATION */}

          <div className="footer-column">
            <p className="footer-title">INFORMATION</p>

            <button
              type="button"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>

            <button
              type="button"
              onClick={() => navigate("/order")}
            >
              Order Online
            </button>

            <button
              type="button"
              onClick={() => navigate("/reservation")}
            >
              Book a Table
            </button>

            <div className="footer-hours">
              <span>Monday — Sunday</span>

              <strong>
                {formatTime(restaurantSettings.openingTime)} —{" "}
                {formatTime(restaurantSettings.closingTime)}
              </strong>
            </div>
          </div>

          {/* FIND US */}

          <div className="footer-column">
            <p className="footer-title">FIND US</p>

            <p className="footer-address">
              {restaurantSettings.restaurantName}
              <br />
              {restaurantSettings.address || "Your City, India"}
              <br />
              {restaurantSettings.phone || "Phone number not added"}
              <br />
              {restaurantSettings.email || "Email not added"}
            </p>
          </div>
        </div>

        {/* FOOTER BOTTOM */}

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()}{" "}
            {restaurantSettings.restaurantName}. All rights reserved.
          </p>

          <div className="footer-bottom-links">
            <button
              type="button"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/login")}
            >
              Admin
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
