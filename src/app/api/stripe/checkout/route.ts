import { NextResponse } from "next/server";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { getStripe, PRICES, PLAN_META, type PlanKey } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser();
  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const planKey = body.plan as PlanKey;
  if (!planKey || !(planKey in PRICES)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const price = PRICES[planKey];
  if (!price) {
    return NextResponse.json(
      { error: `Stripe price not configured for plan: ${planKey}` },
      { status: 500 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe not configured" },
      { status: 503 },
    );
  }

  // Get or create Stripe customer
  let customerId = user.stripeId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id, clerkId: user.clerkId },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeId: customerId },
    });
  }

  const meta = PLAN_META[planKey];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: meta.mode,
    line_items: [{ price, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${baseUrl}/dashboard/settings?checkout=cancel`,
    metadata: { userId: user.id, plan: planKey },
    ...(meta.mode === "subscription"
      ? { subscription_data: { metadata: { userId: user.id, plan: planKey } } }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}
