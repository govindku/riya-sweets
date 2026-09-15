const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config({
  path: path.join(__dirname, ".env"),
});

console.log("Razorpay Key Loaded:", !!process.env.RAZORPAY_KEY_ID);

console.log("Razorpay Secret Loaded:", !!process.env.RAZORPAY_KEY_SECRET);

console.log("Google Maps Key Loaded:", !!process.env.GOOGLE_MAPS_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
=================================
RESTAURANT LOCATION
=================================
*/

const RESTAURANT_LOCATION = {
  latitude: 25.2434175,
  longitude: 84.0660448,
};

/*
=================================
DELIVERY CHARGE SETTINGS
=================================

Base charge according to driving distance.

0 - 5 KM     = ₹30
5 - 10 KM    = ₹50
10 - 15 KM   = ₹80
15 - 20 KM   = ₹100

After calculating the base charge,
20% extra is added.

Example:
₹50 × 1.20 = ₹60
*/

const getBaseDeliveryCharge = (distanceKm) => {
  if (distanceKm <= 5) {
    return 30;
  }

  if (distanceKm <= 10) {
    return 50;
  }

  if (distanceKm <= 15) {
    return 80;
  }

  if (distanceKm <= 20) {
    return 100;
  }

  return null;
};

/*
=================================
TEST ROUTE
=================================
*/

app.get("/", (req, res) => {
  res.json({
    message: "Riya Restaurant Payment Server is running",
  });
});

/*
=================================
CALCULATE DELIVERY CHARGE
=================================
*/

app.post("/calculate-delivery", async (req, res) => {
  try {
    const { address, pinCode } = req.body;

    if (!address || !pinCode) {
      return res.status(400).json({
        success: false,
        message: "Address and PIN code are required.",
      });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key is missing on server.",
      });
    }

    const destination = `${address}, ${pinCode}, India`;

    const googleResponse = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },

        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: RESTAURANT_LOCATION.latitude,
                longitude: RESTAURANT_LOCATION.longitude,
              },
            },
          },

          destination: {
            address: destination,
          },

          travelMode: "DRIVE",

          routingPreference: "TRAFFIC_AWARE",

          units: "METRIC",
        }),
      },
    );

    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error("Google Routes API error:", googleData);

      return res.status(500).json({
        success: false,
        message:
          googleData?.error?.message ||
          "Unable to calculate delivery distance.",
      });
    }

    if (
      !googleData.routes ||
      googleData.routes.length === 0 ||
      !googleData.routes[0].distanceMeters
    ) {
      return res.status(400).json({
        success: false,
        message: "Unable to find a driving route to this address.",
      });
    }

    const distanceMeters = googleData.routes[0].distanceMeters;

    const distanceKm = distanceMeters / 1000;

    const baseDeliveryCharge = getBaseDeliveryCharge(distanceKm);

    if (baseDeliveryCharge === null) {
      return res.status(400).json({
        success: false,
        message: "Sorry, delivery is available only within 20 KM.",
        distanceKm: Number(distanceKm.toFixed(2)),
      });
    }

    /*
    20% DELIVERY CHARGE INCREASE
    */

    const deliveryCharge = Math.round(baseDeliveryCharge * 1.2);

    const durationSeconds = googleData.routes[0].duration
      ? parseInt(googleData.routes[0].duration.replace("s", ""), 10)
      : null;

    const estimatedMinutes = durationSeconds
      ? Math.ceil(durationSeconds / 60)
      : null;

    console.log(
      `Delivery calculation: ${distanceKm.toFixed(2)} KM → ₹${deliveryCharge}`,
    );

    return res.json({
      success: true,

      distanceKm: Number(distanceKm.toFixed(2)),

      baseDeliveryCharge,

      deliveryIncreasePercent: 20,

      deliveryCharge,

      estimatedMinutes,
    });
  } catch (error) {
    console.error("Delivery calculation error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to calculate delivery charge.",
    });
  }
});

/*
=================================
CREATE RAZORPAY ORDER
=================================
*/

app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `riya_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order.id);

    res.json({
      success: true,
      ...order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Unable to create Razorpay order",
    });
  }
});

/*
=================================
VERIFY RAZORPAY PAYMENT
=================================
*/

app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    console.log("Payment verification request received");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key is missing on server",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    return res.json({
      success: true,
      message: "Payment verified successfully",

      paymentId: razorpay_payment_id,

      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to verify payment",
    });
  }
});

/*
=================================
START SERVER
=================================
*/

app.listen(process.env.PORT || 5000, "127.0.0.1", () => {
  console.log(
    `Razorpay server running on http://127.0.0.1:${process.env.PORT || 5000}`,
  );
});
