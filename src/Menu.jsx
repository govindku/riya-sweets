import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "./lib/supabase";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [dishes, setDishes] = useState([]);

  const [orderItems, setOrderItems] = useState(() => {
    const savedItems = localStorage.getItem("riyaOrder");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD MENU FROM SUPABASE
  // =========================

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("available", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading menu:", error);
          setDishes([]);
          return;
        }

        const formattedMenu = (data || []).map((item) => ({
          ...item,
          image: item.image_url || "",
          price: Number(item.price || 0),
        }));

        setDishes(formattedMenu);
      } catch (error) {
        console.error("Menu loading error:", error);
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();

    // Same-tab menu update
    const handleMenuUpdate = () => {
      loadMenu();
    };

    // Other-tab update
    window.addEventListener("storage", handleMenuUpdate);

    // Admin menu update event
    window.addEventListener("riyaMenuUpdated", handleMenuUpdate);

    return () => {
      window.removeEventListener("storage", handleMenuUpdate);
      window.removeEventListener("riyaMenuUpdated", handleMenuUpdate);
    };
  }, []);

  // =========================
  // CATEGORIES
  // =========================

  const dynamicCategories = Array.from(
    new Set(dishes.map((dish) => dish.category).filter(Boolean)),
  );

  const categories = ["All", ...dynamicCategories];

  // =========================
  // FILTER MENU
  // =========================

  const filteredDishes =
    activeCategory === "All"
      ? dishes
      : dishes.filter((dish) => dish.category === activeCategory);

  // =========================
  // CART FUNCTIONS
  // =========================

  const saveOrder = (items) => {
    setOrderItems(items);
    localStorage.setItem("riyaOrder", JSON.stringify(items));
  };

  const addToCart = (dish) => {
    const existingItem = orderItems.find((item) => item.id === dish.id);

    let updatedItems;

    if (existingItem) {
      updatedItems = orderItems.map((item) =>
        item.id === dish.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      );
    } else {
      updatedItems = [
        ...orderItems,
        {
          ...dish,
          quantity: 1,
        },
      ];
    }

    saveOrder(updatedItems);
  };

  const increaseQuantity = (id) => {
    const updatedItems = orderItems.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item,
    );

    saveOrder(updatedItems);
  };

  const decreaseQuantity = (id) => {
    const updatedItems = orderItems
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item,
      )
      .filter((item) => item.quantity > 0);

    saveOrder(updatedItems);
  };

  // =========================
  // CART TOTAL
  // =========================

  const totalItems = orderItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const totalPrice = orderItems.reduce(
    (total, item) => total + Number(item.price || 0) * item.quantity,
    0,
  );

  // =========================
  // PROCEED TO ORDER
  // =========================

  const handleProceedToOrder = () => {
    const loggedInUser = JSON.parse(
      localStorage.getItem("riyaLoggedInUser") || "null",
    );

    // User is NOT logged in
    if (!loggedInUser) {
      setIsCartOpen(false);

      window.location.href = "/login?redirect=order";
      return;
    }

    // User is already logged in
    setIsCartOpen(false);
    window.location.href = "/order";
  };

  // =========================
  // GSAP MENU ANIMATION
  // =========================

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline();

      heroTimeline
        .from(".menu-hero-label", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(
          ".menu-hero-title",
          {
            y: 70,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.35",
        )
        .from(
          ".menu-hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5",
        );

      if (!loading && filteredDishes.length > 0) {
        gsap.from(".menu-dish-card", {
          y: 50,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".menu-dishes-section",
            start: "top 80%",
          },
        });
      }
    });

    return () => ctx.revert();
  }, [activeCategory, dishes, loading]);

  // =========================
  // CART ANIMATION
  // =========================

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";

      gsap.to(".cart-overlay", {
        opacity: 1,
        duration: 0.3,
        pointerEvents: "auto",
        ease: "power2.out",
      });

      gsap.to(".cart-sidebar", {
        x: 0,
        duration: 0.65,
        ease: "power4.out",
      });
    } else {
      document.body.style.overflow = "";

      gsap.to(".cart-overlay", {
        opacity: 0,
        duration: 0.25,
        pointerEvents: "none",
        ease: "power2.in",
      });

      gsap.to(".cart-sidebar", {
        x: "100%",
        duration: 0.55,
        ease: "power4.inOut",
      });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  return (
    <main className="menu-page">
      {/* =========================
          NAVBAR
      ========================= */}

      <header className="menu-navbar">
        <a href="/" className="menu-navbar-logo">
          RIYA<span>.</span>
        </a>

        <nav className="menu-navbar-menu">
          <a href="/">Home</a>
          <a href="/menu">Menu</a>
          <a href="/about">About</a>
          <a href="/gallery">Gallery</a>
          <a href="/contact">Contact</a>
          <a href="/order">Order</a>
          <a href="/login">Login</a>
        </nav>

        <button
          type="button"
          className="menu-cart-button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Open shopping cart${
            totalItems > 0 ? `, ${totalItems} items` : ""
          }`}
        >
          <span className="cart-icon">🛒</span>
          <span>Cart</span>

          {totalItems > 0 && (
            <span className="cart-count">{totalItems}</span>
          )}
        </button>
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="menu-hero">
        <div className="menu-hero-overlay"></div>

        <div className="menu-hero-content">
          <p className="section-label menu-hero-label">RIYA SWEETS</p>

          <h1 className="menu-hero-title">
            Our <i>Menu</i>
          </h1>

          <p className="menu-hero-description">
            Discover freshly made cakes, sweets and delicious treats prepared
            with care at Riya Sweets.
          </p>
        </div>

        <div className="menu-hero-scroll">
          SCROLL TO EXPLORE ↓
        </div>
      </section>

      {/* =========================
          MENU
      ========================= */}

      <section className="menu-dishes-section">
        <div className="menu-section-heading">
          <p className="section-label">EXPLORE OUR MENU</p>

          <h2>
            Made with <i>passion.</i>
          </h2>

          <p>
            From freshly made cakes and sweets to delicious treats, discover
            something special for every celebration.
          </p>
        </div>

        {/* =========================
            CATEGORY
        ========================= */}

        {!loading && dishes.length > 0 && (
          <div className="menu-categories">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={
                  activeCategory === category
                    ? "menu-category active"
                    : "menu-category"
                }
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* =========================
            FOOD CARDS
        ========================= */}

        <div className="menu-dishes-grid">
          {loading ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "80px 20px",
              }}
            >
              <h3>Loading Menu...</h3>
              <p>Please wait while we load our latest menu.</p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "80px 20px",
              }}
            >
              <h3>No dishes available</h3>

              <p>
                No dishes found in the{" "}
                <strong>{activeCategory}</strong> category.
              </p>

              <p>Please check back soon for our latest menu.</p>
            </div>
          ) : (
            filteredDishes.map((dish) => (
              <article className="menu-dish-card" key={dish.id}>
                <div className="menu-dish-image">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "45px",
                      }}
                    >
                      🍰
                    </div>
                  )}

                  {dish.tag && (
                    <span className="menu-dish-tag">{dish.tag}</span>
                  )}
                </div>

                <div className="menu-dish-info">
                  <div>
                    <p className="menu-dish-category">{dish.category}</p>

                    <h3>{dish.name}</h3>
                  </div>

                  <span className="menu-dish-price">
                    ₹{Number(dish.price || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  className="add-order-btn"
                  onClick={() => addToCart(dish)}
                  aria-label={`Add ${dish.name} to cart`}
                >
                  Add to Cart +
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {/* =========================
          CART OVERLAY
      ========================= */}

      <div
        className="cart-overlay"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* =========================
          CART SIDEBAR
      ========================= */}

      <aside className="cart-sidebar">
        <div className="cart-header">
          <div>
            <p className="cart-small-title">YOUR ORDER</p>

            <h2>
              My <i>Cart</i>
            </h2>
          </div>

          <button
            type="button"
            className="cart-close"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="cart-items">
          {orderItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>

              <h3>Your cart is empty</h3>

              <p>Add some delicious dishes from our menu.</p>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="empty-cart-btn"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            orderItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div className="cart-item-details">
                  <h3>{item.name}</h3>

                  <p>₹{Number(item.price || 0)}</p>

                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <strong className="cart-item-total">
                  ₹{Number(item.price || 0) * item.quantity}
                </strong>
              </div>
            ))
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Total</span>

              <strong>₹{totalPrice}</strong>
            </div>

            <button
              type="button"
              className="proceed-order-btn"
              onClick={handleProceedToOrder}
            >
              Proceed to Order →
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}

export default Menu;