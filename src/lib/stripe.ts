import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add your live Stripe key (sk_live_...) to .env.local or production environment variables from https://dashboard.stripe.com/apikeys"
  );
}

export const isLiveStripe = key.startsWith("sk_live_") || key.startsWith("rk_live_");

export const stripe = new Stripe(key, {
  apiVersion: "2024-06-20",
});
