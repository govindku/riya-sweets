import { useEffect, useState } from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";

gsap.registerPlugin(ScrollTrigger);

function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load gallery from Supabase
  const loadGallery = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gallery load error:", error);
        setGalleryItems([]);
        return;
      }

      // Only show available images
      const visibleGallery = (data || []).filter(
        (item) => item.available !== false
      );

      setGalleryItems(visibleGallery);
    } catch (error) {
      console.error("Gallery error:", error);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();

    // Detect gallery changes from Admin Gallery
    const handleGalleryUpdate = () => {
      loadGallery();
    };

    window.addEventListener(
      "riyaGalleryUpdated",
      handleGalleryUpdate
    );

    return () => {
      window.removeEventListener(
        "riyaGalleryUpdated",
        handleGalleryUpdate
      );
    };
  }, []);

  useEffect(() => {
    if (galleryItems.length === 0) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(".gallery-page-label", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(
          ".gallery-page-title",
          {
            y: 70,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.35"
        )
        .from(
          ".gallery-page-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5"
        );

      gsap.fromTo(
        ".gallery-card",
        {
          y: 60,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".gallery-grid",
            start: "top 80%",
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, [galleryItems]);

  return (
    <main className="gallery-page">
      <Navbar />

      {/* HERO */}
      <section className="gallery-page-hero">
        <div className="gallery-page-overlay"></div>

        <div className="gallery-page-content">
          <p className="section-label gallery-page-label">
            RIYA SWEETS
          </p>

          <h1 className="gallery-page-title">
            Our <i>Gallery</i>
          </h1>

          <p className="gallery-page-description">
            A glimpse into the flavours, atmosphere and beautiful
            moments that make Riya special.
          </p>
        </div>

        <div className="gallery-page-scroll">
          SCROLL TO EXPLORE ↓
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery-section">
        <div className="gallery-heading">
          <p className="section-label">A VISUAL JOURNEY</p>

          <h2>
            Moments worth
            <br />
            <i>remembering.</i>
          </h2>

          <p>
            Explore our restaurant, dishes and the little details
            that make every visit memorable.
          </p>
        </div>

        <div className="gallery-grid">
          {loading ? (
            <div className="gallery-empty">
              <h3>Loading Gallery...</h3>
              <p>Please wait while we load our gallery.</p>
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="gallery-empty">
              <h3>No Gallery Images</h3>
              <p>
                Gallery images will appear here when they are added
                from the admin panel.
              </p>
            </div>
          ) : (
            galleryItems.map((item, index) => (
              <article
                className={`gallery-card gallery-card-${
                  (index % 6) + 1
                }`}
                key={item.id || `${item.title}-${index}`}
              >
                <div className="gallery-image">
                  <img
                    src={item.image_url}
                    alt={item.title || "Riya Sweets"}
                    loading="lazy"
                  />

                  <div className="gallery-card-overlay">
                    <span>{item.category || "GALLERY"}</span>

                    <h3>
                      {item.title || "Riya Sweets"}
                    </h3>

                    {item.description && (
                      <p>{item.description}</p>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default Gallery;

