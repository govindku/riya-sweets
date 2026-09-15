import { useEffect } from "react";
import { gsap } from "gsap";

function Loading() {
  useEffect(() => {
    const counter = { value: 0 };

    const timeline = gsap.timeline();

    timeline.to(counter, {
      value: 100,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        const number = document.querySelector(
          ".loading-number"
        );

        if (number) {
          number.textContent =
            Math.floor(counter.value) + "%";
        }
      },
    });

    timeline.to(".loading-progress-bar", {
      width: "100%",
      duration: 2.5,
      ease: "power2.inOut",
    }, "<");

    timeline.to(".loading-content", {
      y: -40,
      opacity: 0,
      duration: 0.6,
      ease: "power3.in",
    });

    timeline.to(".loading-page", {
      opacity: 0,
      duration: 0.7,
      ease: "power2.inOut",
    });
  }, []);

  return (
    <main className="loading-page">

      <div className="loading-background"></div>

      <div className="loading-overlay"></div>

      <div className="loading-content">

        <div className="loading-logo">
          RIYA<span>.</span>
        </div>

        <p className="loading-subtitle">
          RESTAURANT & DINING
        </p>

        <div className="loading-line">
          <div className="loading-progress-bar"></div>
        </div>

        <div className="loading-bottom">
          <span>PREPARING YOUR EXPERIENCE</span>

          <strong className="loading-number">
            0%
          </strong>
        </div>

      </div>

      <div className="loading-corner loading-corner-left">
        EST. 2026
      </div>

      <div className="loading-corner loading-corner-right">
        RIYA RESTAURANT
      </div>

    </main>
  );
}

export default Loading;