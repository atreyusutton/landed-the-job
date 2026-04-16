import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

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
