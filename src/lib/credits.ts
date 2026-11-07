import { db } from "@/lib/db";

export class OutOfCreditsError extends Error {
  constructor() {
    super("Out of credits");
    this.name = "OutOfCreditsError";
  }
}

/**
 * Atomically consume one credit. All plans are credit-based now:
 * - Free users: 10 credits on signup.
 * - Pro: 30 credits refilled every month by the Stripe webhook.
 * - Pack: 30 credits added as a one-time purchase.
 *
 * updateMany with a predicate filter gives us atomicity without a read-then-write race.
 */
export async function consumeCredit(userId: string): Promise<void> {
  const result = await db.user.updateMany({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });

  if (result.count === 0) {
    throw new OutOfCreditsError();
  }
}
