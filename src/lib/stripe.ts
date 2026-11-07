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

export const PRO_MONTHLY_CREDITS = 30;
export const PACK_CREDITS = 30;
export const FREE_CREDITS_ON_SIGNUP = 10;

export const PLAN_META: Record<
  PlanKey,
  {
    name: string;
    description: string;
    mode: "subscription" | "payment";
    planValue: string;
    creditsGranted: number;
  }
> = {
  pack: {
    name: "Pack, $15",
    description: `${PACK_CREDITS} credits, one-time. Credits never expire.`,
    mode: "payment",
    planValue: "free",
    creditsGranted: PACK_CREDITS,
  },
  pro: {
    name: "Pro, $10/month",
    description: `${PRO_MONTHLY_CREDITS} credits refilled every month. Cancel anytime.`,
    mode: "subscription",
    planValue: "pro",
    creditsGranted: PRO_MONTHLY_CREDITS,
  },
};
