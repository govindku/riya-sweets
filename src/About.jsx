import Navbar from "./components/Navbar";

import { useEffect } from "react";

import { gsap } from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function About() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const introTimeline = gsap.timeline();

      introTimeline
        .from(".about-page-label", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(
          ".about-page-title",
          {
            y: 70,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.35"
        )
        .from(
          ".about-page-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5"
        );

      gsap.from(".about-story-image", {
        x: -80,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".about-story",
          start: "top 75%",
        },
      });

      gsap.from(".about-story-content", {
        x: 80,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".about-story",
          start: "top 75%",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="about-page">
      {/* =========================
          ABOUT HERO
      ========================= */}

      <Navbar />

      <section className="about-page-hero">
        <div className="about-page-hero-overlay"></div>

        <div className="about-page-hero-content">
          <p className="section-label about-page-label">
            THE RIYA SWEETS STORY
          </p>

          <h1 className="about-page-title">
            About <i>Riya Sweets</i>
          </h1>

          <p className="about-page-description">
            Fresh cakes, delicious sweets and memorable celebrations — made
            with care, quality and a passion for bringing people together.
          </p>
        </div>

        <div className="about-page-scroll">
          SCROLL TO EXPLORE ↓
        </div>
      </section>

      {/* =========================
          OUR STORY
      ========================= */}

      <section className="about-story">
        <div className="about-story-image">
          <img
            src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=90"
            alt="Fresh food and sweets at Riya Sweets"
          />
        </div>

        <div className="about-story-content">
          <p className="section-label">OUR STORY</p>

          <h2>
            Made for
            <br />
            <i>Sweet Moments.</i>
          </h2>

          <p>
            Riya Sweets is built around a simple belief — every special moment
            deserves something delicious. From freshly prepared cakes and
            pastries to traditional sweets, namkeen and celebration treats,
            we bring quality and freshness to every order.
          </p>

          <p>
            Our cakes are prepared at our own cake-making facility, allowing us
            to focus on freshness, taste and careful preparation. Whether you
            are celebrating a birthday, planning a party or simply craving
            something sweet, we prepare our products with the same attention
            and care.
          </p>

          <p>
            Located at House-Dinara, Chuk Road, Bihar, Riya Sweets serves
            customers with a wide range of cakes, custom cakes, sweets,
            pastries, namkeen, fast food, cold drinks and celebration
            supplies. We also provide home delivery within our service area,
            making it easier to enjoy your favourite treats wherever you are.
          </p>

          <div className="about-story-signature">
            <span>RIYA.</span>

            <small>
              Freshly made. Thoughtfully prepared. Made for celebrations.
            </small>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
