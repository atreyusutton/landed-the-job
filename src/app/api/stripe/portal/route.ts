import { NextResponse } from "next/server";
import { requireUser } from "@/lib/user";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user.stripeId) {
    return NextResponse.json(
      { error: "No Stripe customer on file" },
      { status: 400 },
    );
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${baseUrl}/dashboard/settings`,
  });
  return NextResponse.json({ url: session.url });
}
