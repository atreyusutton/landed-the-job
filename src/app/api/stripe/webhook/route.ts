import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PLAN_META, type PlanKey } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function userIdForCustomer(customerId: string): Promise<string | null> {
  const u = await db.user.findFirst({
    where: { stripeId: customerId },
    select: { id: true },
  });
  return u?.id ?? null;
}

/**
 * Apply a plan to a user. Credits are gated on `grantCredits` so we don't
 * triple-grant on the three events that fire during a subscription purchase
 * (checkout.session.completed, customer.subscription.created, invoice.paid).
 *
 * - Pack: one-time payment. Grant credits on checkout.session.completed.
 * - Pro: subscription. Grant credits on invoice.paid (fires on initial AND renewal).
 */
async function applyPlan(
  userId: string,
  planKey: PlanKey,
  opts: { grantCredits: boolean },
) {
  const meta = PLAN_META[planKey];
  await db.user.update({
    where: { id: userId },
    data: {
      plan: meta.planValue,
      ...(opts.grantCredits && meta.creditsGranted
        ? { credits: { increment: meta.creditsGranted } }
        : {}),
    },
  });
}

/**
 * Persist subscription state for the Settings UI ("renews on X" / "ends on X").
 * Credits are NEVER touched here — they're preserved across plan changes.
 */
async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  // Stripe types are inconsistent across SDK versions; cast to a flexible shape.
  const s = sub as Stripe.Subscription & {
    current_period_end?: number;
    cancel_at_period_end?: boolean;
  };
  const periodEnd = s.current_period_end
    ? new Date(s.current_period_end * 1000)
    : null;

  await db.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionPeriodEnd: periodEnd,
      subscriptionCancelAtEnd: !!s.cancel_at_period_end,
    },
  });
}

/**
 * Pull the subscription ID off an invoice. The top-level `invoice.subscription`
 * field was removed in recent Stripe API versions (we pin to 2026-03-25.dahlia)
 * and replaced with `invoice.parent.subscription_details.subscription`. Try the
 * new path first, fall back to the legacy field for safety.
 */
function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (parentSub) {
    return typeof parentSub === "string" ? parentSub : parentSub.id;
  }
  const legacy = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription;
  }).subscription;
  if (legacy) {
    return typeof legacy === "string" ? legacy : legacy.id;
  }
  return null;
}

async function clearSubscription(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
    },
  });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature/secret" }, { status: 400 });
  }
  const raw = await req.text();

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe not configured" },
      { status: 503 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : ""}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId as string | undefined;
      const planKey = session.metadata?.plan as PlanKey | undefined;
      if (!userId || !planKey) break;
      const meta = PLAN_META[planKey];
      // One-time packs grant credits here. Subscriptions wait for invoice.paid.
      await applyPlan(userId, planKey, { grantCredits: meta.mode === "payment" });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const userId =
        (sub.metadata?.userId as string) ??
        (await userIdForCustomer(customerId));
      if (!userId) break;

      const planKey = sub.metadata?.plan as PlanKey | undefined;
      if (planKey && sub.status === "active") {
        // Set plan, do NOT grant credits. Credits come from invoice.paid.
        await applyPlan(userId, planKey, { grantCredits: false });
      }
      await syncSubscription(userId, sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId =
        (sub.metadata?.userId as string) ??
        (await userIdForCustomer(sub.customer as string));
      if (userId) await clearSubscription(userId);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = extractSubscriptionId(invoice);
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const userId =
        (sub.metadata?.userId as string) ??
        (await userIdForCustomer(sub.customer as string));
      if (!userId) break;
      const planKey = sub.metadata?.plan as PlanKey | undefined;
      // Subscription renewal (or first payment): grant monthly credits.
      if (planKey) await applyPlan(userId, planKey, { grantCredits: true });
      await syncSubscription(userId, sub);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
