// server.js
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
const stripe = Stripe("sk_test_51RnKBhDBy99qhL5HcXMMTeReZmf7sDC9eHhi33zefBNhjOz8gkAG54rcSXg2yPR1mk08vckDxbUxv3swb0lWJzyL00QEPMBriz");

app.use(cors());
app.use(express.json());

app.post("/api/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: "usd",
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
