import { db } from "@/lib/db";

export class OutOfCreditsError extends Error {
  constructor() {
    super("Out of credits");
    this.name = "OutOfCreditsError";
  }
}

/**
 * Atomically consume one credit. No-op for unlimited plans.
 * Throws OutOfCreditsError if the user has 0 credits.
 */
export async function consumeCredit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) throw new Error("User not found");
  if (user.plan === "unlimited") return;

  const result = await db.user.updateMany({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });

  if (result.count === 0) {
    throw new OutOfCreditsError();
  }
}
