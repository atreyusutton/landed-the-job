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

async function applyPlan(userId: string, planKey: PlanKey) {
  const meta = PLAN_META[planKey];
  await db.user.update({
    where: { id: userId },
    data: {
      plan: meta.planValue,
      ...(meta.creditsGranted ? { credits: { increment: meta.creditsGranted } } : {}),
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
      const userId = (session.metadata?.userId as string) ?? null;
      const planKey = session.metadata?.plan as PlanKey | undefined;
      if (userId && planKey) await applyPlan(userId, planKey);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const userId =
        (sub.metadata?.userId as string) ??
        (await userIdForCustomer(customerId));
      const planKey = sub.metadata?.plan as PlanKey | undefined;
      if (userId && planKey && sub.status === "active") {
        await applyPlan(userId, planKey);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId =
        (sub.metadata?.userId as string) ??
        (await userIdForCustomer(sub.customer as string));
      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: { plan: "free" },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription })
          .subscription;
      if (subId && typeof subId === "string") {
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId =
          (sub.metadata?.userId as string) ??
          (await userIdForCustomer(sub.customer as string));
        const planKey = sub.metadata?.plan as PlanKey | undefined;
        // Re-grant monthly credits on renewal.
        if (userId && planKey) await applyPlan(userId, planKey);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
