import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";
import "./Order.css";

// =====================================================
// FIXED DELIVERY CHARGE
// =====================================================

const getDeliveryCharge = () => {
  const savedSettings = JSON.parse(
    localStorage.getItem("riyaSettings") || "{}"
  );

  const charge = Number(
    savedSettings.deliveryCharge
  );

  return Number.isFinite(charge) && charge >= 0
    ? charge
    : 50;
};

function Order() {
  const navigate = useNavigate();

  const [orderItems, setOrderItems] = useState([]);
  const [paymentMethod, setPaymentMethod] =
    useState("Online Payment");

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  const [orderId, setOrderId] = useState("");
  const [placedTotal, setPlacedTotal] =
    useState(0);

  const [placedDeliveryCharge, setPlacedDeliveryCharge] =
    useState(0);

  const [paymentId, setPaymentId] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [deliveryCalculated, setDeliveryCalculated] =
    useState(false);

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  const [deliveryError, setDeliveryError] =
    useState("");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
  });

  // =====================================================
  // LOAD CART + USER
  // =====================================================

  useEffect(() => {
    const savedOrder =
      localStorage.getItem("riyaOrder");

    if (savedOrder) {
      try {
        setOrderItems(
          JSON.parse(savedOrder)
        );
      } catch (error) {
        console.error(
          "Failed to load cart:",
          error
        );

        setOrderItems([]);
      }
    }

    const loggedInUser =
      JSON.parse(
        localStorage.getItem(
          "riyaLoggedInUser"
        ) || "null"
      );

    if (loggedInUser) {
      setCustomer({
        name: loggedInUser.name || "",
        phone: loggedInUser.phone || "",
        email: loggedInUser.email || "",
        address:
          loggedInUser.address || "",
        city: loggedInUser.city || "",
        pincode:
          loggedInUser.pincode || "",
      });
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(".order-hero-label", {
          y: 25,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        .from(
          ".order-hero-title",
          {
            y: 60,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
          },
          "-=0.3"
        )
        .from(
          ".order-main",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.3"
        );
    });

    return () => ctx.revert();
  }, []);

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (
    id,
    change
  ) => {
    const updatedItems = orderItems
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                Number(
                  item.quantity || 0
                ) + change,
            }
          : item
      )
      .filter(
        (item) =>
          Number(item.quantity) > 0
      );

    setOrderItems(updatedItems);

    localStorage.setItem(
      "riyaOrder",
      JSON.stringify(updatedItems)
    );
  };

  // =====================================================
  // PRICE
  // =====================================================

  const subtotal = orderItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const total =
    subtotal +
    Number(deliveryCharge || 0);

  // =====================================================
  // DELIVERY
  // =====================================================

  const calculateDelivery = (
    addressValue,
    cityValue,
    pincodeValue
  ) => {
    const address =
      addressValue.trim();

    const city =
      cityValue.trim();

    const pincode =
      pincodeValue.trim();

    setDeliveryError("");
    setDeliveryCalculated(false);
    setDeliveryCharge(0);

    if (
      !address ||
      !city ||
      !/^\d{6}$/.test(pincode)
    ) {
      return;
    }

    setDeliveryCharge(
      getDeliveryCharge()
    );

    setDeliveryCalculated(true);
  };

  useEffect(() => {
    const address =
      customer.address.trim();

    const city =
      customer.city.trim();

    const pincode =
      customer.pincode.trim();

    setDeliveryCalculated(false);
    setDeliveryCharge(0);
    setDeliveryError("");

    if (
      !address ||
      !city ||
      !/^\d{6}$/.test(pincode)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      calculateDelivery(
        address,
        city,
        pincode
      );
    }, 400);

    return () =>
      clearTimeout(timer);
  }, [
    customer.address,
    customer.city,
    customer.pincode,
  ]);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE USER DETAILS
  // =====================================================

  const saveUserDetails = (
    loggedInUser
  ) => {
    const existingUsers =
      JSON.parse(
        localStorage.getItem(
          "riyaUsers"
        ) || "[]"
      );

    const userEmail =
      loggedInUser.email?.toLowerCase();

    const userIndex =
      existingUsers.findIndex(
        (user) =>
          user.email?.toLowerCase() ===
          userEmail
      );

    const updatedUser = {
      ...loggedInUser,
      name: customer.name,
      phone: customer.phone,
      email: loggedInUser.email,
      address: customer.address,
      city: customer.city,
      pincode: customer.pincode,
    };

    if (userIndex >= 0) {
      const updatedUsers = [
        ...existingUsers,
      ];

      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        ...updatedUser,
      };

      localStorage.setItem(
        "riyaUsers",
        JSON.stringify(
          updatedUsers
        )
      );
    } else {
      const newUser = {
        id:
          "USER-" +
          Date.now()
            .toString()
            .slice(-6),

        ...updatedUser,

        createdAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        "riyaUsers",
        JSON.stringify([
          ...existingUsers,
          newUser,
        ])
      );
    }

    localStorage.setItem(
      "riyaLoggedInUser",
      JSON.stringify(
        updatedUser
      )
    );
  };

  // =====================================================
  // SAVE ORDER
  // =====================================================

  const saveOrder = async (
    loggedInUser,
    newOrderId,
    razorpayPaymentId,
    razorpayOrderId
  ) => {
    const createdAt =
      new Date().toISOString();

    const newOrder = {
      orderId: newOrderId,

      userId:
        loggedInUser.email,

      customer: {
        name: customer.name,
        phone: customer.phone,
        email:
          loggedInUser.email ||
          customer.email,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
      },

      paymentMethod,

      paymentStatus: "Paid",

      paymentId:
        razorpayPaymentId,

      razorpayOrderId,

      items: orderItems.map(
        (item) => ({
          ...item,
        })
      ),

      subtotal,
      deliveryCharge,

      deliveryCalculation: {
        type:
          "Fixed Delivery Charge",
        distanceKm: null,
        estimatedMinutes: null,
      },

      total,

      status:
        "Order Placed",

      createdAt,
    };

    const existingOrders =
      JSON.parse(
        localStorage.getItem(
          "riyaOrders"
        ) || "[]"
      );

    localStorage.setItem(
      "riyaOrders",
      JSON.stringify([
        ...existingOrders,
        newOrder,
      ])
    );

    window.dispatchEvent(
      new Event("riyaOrderUpdated")
    );

    const supabaseOrder = {
      order_id: newOrderId,

      user_id:
        loggedInUser.email ||
        customer.email ||
        null,

      customer_name:
        customer.name,

      customer_phone:
        customer.phone,

      customer_email:
        loggedInUser.email ||
        customer.email ||
        null,

      items: orderItems.map(
        (item) => ({
          id: item.id,
          name: item.name,
          price: Number(
            item.price || 0
          ),
          quantity: Number(
            item.quantity || 0
          ),
          image:
            item.image || "",
        })
      ),

      subtotal: Number(subtotal),

      delivery_charge:
        Number(deliveryCharge),

      total_amount:
        Number(total),

      address:
        customer.address,

      city:
        customer.city,

      pincode:
        customer.pincode,

      payment_method:
        paymentMethod,

      payment_status:
        "Paid",

      order_status:
        "Pending",

      razorpay_order_id:
        razorpayOrderId,

      razorpay_payment_id:
        razorpayPaymentId,

      created_at:
        createdAt,
    };

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .insert([
        supabaseOrder,
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "Supabase order save failed:",
        error
      );

      return {
        success: false,
        localOrder: newOrder,
        error,
      };
    }

    return {
      success: true,
      localOrder: newOrder,
      supabaseOrder: data,
    };
  };

  // =====================================================
  // RAZORPAY PAYMENT
  // =====================================================

  const startRazorpayPayment =
    async (loggedInUser) => {
      try {
        setIsProcessing(true);

        if (!deliveryCalculated) {
          alert(
            "Please enter your complete delivery details."
          );

          setIsProcessing(false);
          return;
        }

        if (deliveryCharge <= 0) {
          alert(
            "Unable to calculate delivery charge."
          );

          setIsProcessing(false);
          return;
        }

        const response =
          await fetch(
            "https://riya-sweets.onrender.com/create-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                amount: total,
              }),
            }
          );

        let razorpayOrder = {};

        try {
          razorpayOrder =
            await response.json();
        } catch {
          throw new Error(
            "Invalid response from payment server."
          );
        }

        if (
          !response.ok ||
          !razorpayOrder.success
        ) {
          throw new Error(
            razorpayOrder.message ||
              "Unable to create payment order."
          );
        }

        const options = {
          key:
            import.meta.env
              .VITE_RAZORPAY_KEY_ID,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,

          name:
            "Riya Sweets",

          description:
            "Food Order + Delivery Payment",

          order_id:
            razorpayOrder.id,

          prefill: {
            name:
              customer.name,

            email:
              loggedInUser.email ||
              customer.email,

            contact:
              customer.phone,
          },

          notes: {
            restaurant:
              "Riya Sweets",

            city:
              customer.city,

            deliveryCharge:
              `₹${deliveryCharge}`,
          },

          theme: {
            color: "#ff3b30",
          },

          handler:
            async function (
              paymentResponse
            ) {
              try {
                const verifyResponse =
                  await fetch(
                    "https://riya-sweets.onrender.com/verify-payment",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body: JSON.stringify({
                        razorpay_order_id:
                          paymentResponse.razorpay_order_id,

                        razorpay_payment_id:
                          paymentResponse.razorpay_payment_id,

                        razorpay_signature:
                          paymentResponse.razorpay_signature,
                      }),
                    }
                  );

                let verifyData = {};

                try {
                  verifyData =
                    await verifyResponse.json();
                } catch {
                  throw new Error(
                    "Invalid payment verification response."
                  );
                }

                if (
                  !verifyResponse.ok ||
                  !verifyData.success
                ) {
                  alert(
                    verifyData.message ||
                      "Payment verification failed. Please contact the restaurant."
                  );

                  setIsProcessing(false);
                  return;
                }

                saveUserDetails(
                  loggedInUser
                );

                const newOrderId =
                  "RIYA-" +
                  Date.now()
                    .toString()
                    .slice(-6);

                const orderSaveResult =
                  await saveOrder(
                    loggedInUser,
                    newOrderId,
                    paymentResponse.razorpay_payment_id,
                    paymentResponse.razorpay_order_id
                  );

                if (
                  !orderSaveResult.success
                ) {
                  console.error(
                    "Payment successful but Supabase order save failed.",
                    orderSaveResult.error
                  );

                  alert(
                    "Payment successful. Your order is saved, but owner dashboard sync is temporarily unavailable."
                  );
                }

                localStorage.removeItem(
                  "riyaOrder"
                );

                setOrderId(
                  newOrderId
                );

                setPlacedTotal(
                  total
                );

                setPlacedDeliveryCharge(
                  deliveryCharge
                );

                setPaymentId(
                  paymentResponse.razorpay_payment_id
                );

                setOrderItems([]);

                setOrderPlaced(
                  true
                );

                setIsProcessing(
                  false
                );

                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                });
              } catch (error) {
                console.error(
                  "Payment verification error:",
                  error
                );

                alert(
                  error?.message ||
                    "Payment verification failed. Please try again."
                );

                setIsProcessing(false);
              }
            },

          modal: {
            ondismiss:
              function () {
                setIsProcessing(
                  false
                );
              },
          },
        };

        if (!options.key) {
          alert(
            "Razorpay Key ID is missing. Please check your .env file."
          );

          setIsProcessing(false);
          return;
        }

        if (
          typeof window.Razorpay ===
          "undefined"
        ) {
          alert(
            "Razorpay Checkout could not be loaded. Please refresh the page."
          );

          setIsProcessing(false);
          return;
        }

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
          "payment.failed",
          function (response) {
            console.error(
              "Payment failed:",
              response.error
            );

            alert(
              response.error?.description ||
                "Payment failed. Please try again."
            );

            setIsProcessing(false);
          }
        );

        razorpay.open();
      } catch (error) {
        console.error(
          "Razorpay payment error:",
          error
        );

        const message =
          error?.message ===
          "Failed to fetch"
            ? "Payment server se connection nahi ho raha. Please make sure server is running."
            : error?.message ||
              "Unable to start payment. Please try again.";

        alert(message);

        setIsProcessing(false);
      }
    };

  // =====================================================
  // PLACE ORDER
  // LOGIN CHECK HAPPENS HERE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -----------------------------------------------
    // CART CHECK
    // -----------------------------------------------

    if (orderItems.length === 0) {
      alert(
        "Your cart is empty."
      );

      return;
    }

    // -----------------------------------------------
    // LOGIN CHECK
    // -----------------------------------------------

    const loggedInUser =
      JSON.parse(
        localStorage.getItem(
          "riyaLoggedInUser"
        ) || "null"
      );

    // IMPORTANT:
    // Order page open rahega.
    // Login sirf Place Order par check hoga.

    if (!loggedInUser) {
      navigate("/login", {
        state: {
          from: "/order",
        },
      });

      return;
    }

    // -----------------------------------------------
    // PROCESSING CHECK
    // -----------------------------------------------

    if (isProcessing) {
      return;
    }

    // -----------------------------------------------
    // DELIVERY CHECK
    // -----------------------------------------------

    if (!deliveryCalculated) {
      alert(
        "Please enter a valid delivery address, city and PIN code."
      );

      return;
    }

    if (deliveryCharge <= 0) {
      alert(
        "Unable to calculate a valid delivery charge."
      );

      return;
    }

    // -----------------------------------------------
    // PAYMENT
    // -----------------------------------------------

    await startRazorpayPayment(
      loggedInUser
    );
  };

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (orderPlaced) {
    return (
      <main className="order-page">
        <Navbar />

        <section className="order-success">
          <div className="order-success-card">

            <div className="success-icon">
              ✓
            </div>

            <p className="section-label">
              RIYA SWEETS
            </p>

            <h1>
              Order <i>Confirmed!</i>
            </h1>

            <p className="success-message">
              Thank you,{" "}
              {customer.name ||
                "Guest"}
              .
              <br />
              Your payment was successful
              and your order has been placed.
            </p>

            <div className="success-order-id">
              <span>
                ORDER ID
              </span>

              <strong>
                {orderId}
              </strong>
            </div>

            <div className="success-total">
              <span>
                Food Total
              </span>

              <strong>
                ₹
                {Math.max(
                  0,
                  placedTotal -
                    placedDeliveryCharge
                )}
              </strong>
            </div>

            <div className="success-total">
              <span>
                Delivery Charge
              </span>

              <strong>
                ₹
                {placedDeliveryCharge}
              </strong>
            </div>

            <div className="success-total">
              <span>
                Final Total
              </span>

              <strong>
                ₹{placedTotal}
              </strong>
            </div>

            <div className="payment-status">
              <span>
                PAYMENT
              </span>

              <strong>
                Paid Online
              </strong>
            </div>

            {paymentId && (
              <div className="success-total">
                <span>
                  PAYMENT ID
                </span>

                <strong>
                  {paymentId}
                </strong>
              </div>
            )}

            <div className="delivery-pending-info">
              <p>
                Delivery Charge: ₹
                {placedDeliveryCharge}
              </p>
            </div>

            <div className="success-actions">
              <a
                href="/menu"
                className="success-btn secondary"
              >
                Order More
              </a>

              <a
                href="/my-account"
                className="success-btn secondary"
              >
                My Orders
              </a>

              <a
                href="/"
                className="success-btn"
              >
                Back to Home →
              </a>
            </div>

          </div>
        </section>
      </main>
    );
  }

  // =====================================================
  // NORMAL ORDER PAGE
  // =====================================================

  return (
    <main className="order-page">
      <Navbar />

      <section className="order-hero">
        <div className="order-hero-overlay"></div>

        <div className="order-hero-content">
          <p className="section-label order-hero-label">
            RIYA SWEETS
          </p>

          <h1 className="order-hero-title">
            Complete Your{" "}
            <i>Order</i>
          </h1>

          <p>
            Almost there. Just a few details
            and your delicious meal will be
            on its way.
          </p>
        </div>
      </section>

      <section className="order-main">

        <div className="order-form-section">

          <div className="order-section-heading">
            <p className="section-label">
              DELIVERY DETAILS
            </p>

            <h2>
              Where should we
              <br />
              <i>deliver?</i>
            </h2>
          </div>

          <form
            className="order-form"
            onSubmit={handleSubmit}
          >

            <div className="order-form-row">

              <div className="order-field">
                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="order-field">
                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>

            </div>

            <div className="order-field">
              <label>
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleChange}
                placeholder="your@email.com"
                readOnly
              />
            </div>

            <div className="order-field">
              <label>
                Delivery Address
              </label>

              <textarea
                name="address"
                value={customer.address}
                onChange={handleChange}
                placeholder="House no., street, landmark..."
                rows="4"
                required
              ></textarea>
            </div>

            <div className="order-form-row">

              <div className="order-field">
                <label>
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={customer.city}
                  onChange={handleChange}
                  placeholder="Your city"
                  required
                />
              </div>

              <div className="order-field">
                <label>
                  PIN Code
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={customer.pincode}
                  onChange={handleChange}
                  placeholder="000000"
                  maxLength="6"
                  inputMode="numeric"
                  required
                />
              </div>

            </div>

            <div className="delivery-calculation">

              {deliveryCalculated && (
                <div className="delivery-calculated">
                  <div className="delivery-info">

                    <div>
                      <span>
                        Delivery Type
                      </span>

                      <strong>
                        Standard Delivery
                      </strong>
                    </div>

                    <div>
                      <span>
                        Delivery Charge
                      </span>

                      <strong>
                        ₹{deliveryCharge}
                      </strong>
                    </div>

                  </div>
                </div>
              )}

              {deliveryError && (
                <p className="delivery-error">
                  {deliveryError}
                </p>
              )}

            </div>

            <div className="payment-section">

              <p className="section-label">
                PAYMENT METHOD
              </p>

              <div className="payment-options">

                <div
                  className={`payment-option ${
                    paymentMethod ===
                    "Online Payment"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod(
                      "Online Payment"
                    )
                  }
                >
                  <span className="payment-icon">
                    💳
                  </span>

                  <span>
                    <strong>
                      Online Payment
                    </strong>

                    <small>
                      UPI, Card or Net Banking
                    </small>
                  </span>

                  {paymentMethod ===
                    "Online Payment" && (
                    <span className="payment-check">
                      ✓
                    </span>
                  )}
                </div>

                <div
                  className={`payment-option ${
                    paymentMethod ===
                    "UPI / QR Code"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod(
                      "UPI / QR Code"
                    )
                  }
                >
                  <span className="payment-icon">
                    📱
                  </span>

                  <span>
                    <strong>
                      UPI / QR Code
                    </strong>

                    <small>
                      Pay using UPI or Scan QR
                    </small>
                  </span>

                  {paymentMethod ===
                    "UPI / QR Code" && (
                    <span className="payment-check">
                      ✓
                    </span>
                  )}
                </div>

              </div>

              {paymentMethod ===
                "UPI / QR Code" && (
                <div className="upi-qr-box">

                  <div className="upi-qr-placeholder">
                    <span>📱</span>

                    <strong>
                      UPI / QR Payment
                    </strong>

                    <small>
                      Restaurant QR Code यहाँ
                      दिखाई देगा
                    </small>
                  </div>

                  <p>
                    Scan the QR code using any
                    UPI app to make your payment.
                  </p>

                </div>
              )}

            </div>

            {/* IMPORTANT:
                Button delivery calculation se disabled nahi hai.
                Click karne par handleSubmit login check karega.
            */}

            <button
              type="submit"
              className="place-order-btn"
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing Payment..."
                : `Pay ₹${total} & Place Order →`}
            </button>

          </form>
        </div>

        <aside className="order-summary">

          <div className="order-summary-header">
            <p className="section-label">
              YOUR ORDER
            </p>

            <h2>
              Order <i>Summary</i>
            </h2>
          </div>

          {orderItems.length === 0 ? (
            <div className="order-empty">

              <div>🛒</div>

              <h3>
                Your cart is empty
              </h3>

              <p>
                Go back to the menu and add
                something delicious.
              </p>

              <a href="/menu">
                Explore Menu →
              </a>

            </div>
          ) : (
            <>
              <div className="order-items">

                {orderItems.map(
                  (item) => (
                    <div
                      className="order-item"
                      key={item.id}
                    >

                      <img
                        src={item.image}
                        alt={item.name}
                      />

                      <div className="order-item-info">

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          ₹{item.price}
                        </p>

                        <div className="order-quantity">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                -1
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                1
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                      </div>

                      <strong>
                        ₹
                        {Number(
                          item.price || 0
                        ) *
                          Number(
                            item.quantity || 0
                          )}
                      </strong>

                    </div>
                  )
                )}

              </div>

              <div className="order-price-summary">

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹{subtotal}
                  </strong>
                </div>

                <div>
                  <span>
                    Delivery
                  </span>

                  <strong>
                    {deliveryCalculated
                      ? `₹${deliveryCharge}`
                      : "Enter Address"}
                  </strong>
                </div>

                <div className="order-grand-total">

                  <span>
                    Final Total
                  </span>

                  <strong>
                    ₹{total}
                  </strong>

                </div>

              </div>

              <div className="order-secure">
                <span>✓</span>

                <p>
                  Secure online payment via
                  Razorpay. Your final payment
                  includes food and delivery
                  charges.
                </p>
              </div>
            </>
          )}

        </aside>

      </section>
    </main>
  );
}

export default Order;
