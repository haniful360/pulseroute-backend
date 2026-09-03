import Stripe from "stripe";
import config from "../config";

export const stripe = new Stripe(
  config.stripe_secret_key || "sk_test_placeholder_key_for_build",
);
