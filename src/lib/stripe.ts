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
  pack: process.env.STRIPE_PRICE_PACK ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
} as const;

export type PlanKey = keyof typeof PRICES;

export const PLAN_META: Record<
  PlanKey,
  {
    name: string;
    description: string;
    mode: "subscription" | "payment";
    planValue: string;
    creditsGranted?: number;
  }
> = {
  pack: {
    name: "Pack — $15",
    description: "40 credits. Never expire.",
    mode: "payment",
    planValue: "free",
    creditsGranted: 40,
  },
  pro: {
    name: "Pro — $19/month",
    description: "Unlimited tailored resumes and cover letters. Soft cap of 20/day.",
    mode: "subscription",
    planValue: "unlimited",
  },
};

export const DAILY_CAP = 20;
