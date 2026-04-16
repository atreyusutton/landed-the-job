import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to your environment to enable billing.",
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return _stripe;
}

export const PRICES = {
  monthly_20: process.env.STRIPE_PRICE_MONTHLY_20 ?? "",
  monthly_unlimited: process.env.STRIPE_PRICE_MONTHLY_UNLIMITED ?? "",
  credit_pack_50: process.env.STRIPE_PRICE_CREDIT_PACK_50 ?? "",
} as const;

export type PlanKey = keyof typeof PRICES;

export const PLAN_META: Record<
  PlanKey,
  { name: string; description: string; mode: "subscription" | "payment"; planValue: string; creditsGranted?: number }
> = {
  monthly_20: {
    name: "$9 / month",
    description: "20 generations per month.",
    mode: "subscription",
    planValue: "monthly_20",
    creditsGranted: 20,
  },
  monthly_unlimited: {
    name: "$19 / month",
    description: "Unlimited generations.",
    mode: "subscription",
    planValue: "unlimited",
  },
  credit_pack_50: {
    name: "$29 one-time",
    description: "50 credits, never expire.",
    mode: "payment",
    planValue: "free",
    creditsGranted: 50,
  },
};
