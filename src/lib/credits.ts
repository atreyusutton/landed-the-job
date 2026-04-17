import { db } from "@/lib/db";
import { DAILY_CAP } from "@/lib/stripe";

export class OutOfCreditsError extends Error {
  constructor() {
    super("Out of credits");
    this.name = "OutOfCreditsError";
  }
}

export class DailyCapExceededError extends Error {
  retryAt: Date;
  constructor(retryAt: Date) {
    super("Daily cap exceeded");
    this.name = "DailyCapExceededError";
    this.retryAt = retryAt;
  }
}

function utcMidnight(d: Date = new Date()): Date {
  const m = new Date(d);
  m.setUTCHours(0, 0, 0, 0);
  return m;
}

/**
 * Atomically consume one credit.
 * - "free" plan (and "pack" buyers, who stay on plan="free"): decrements User.credits.
 * - "unlimited" plan (Pro subscribers): no credit decrement, but enforces a daily cap.
 *
 * Both paths use updateMany with predicate filters for atomicity (no check-then-update race).
 */
export async function consumeCredit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, dailyUsageDate: true },
  });
  if (!user) throw new Error("User not found");

  if (user.plan === "unlimited") {
    const today = utcMidnight();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const isToday =
      user.dailyUsageDate &&
      user.dailyUsageDate.getTime() === today.getTime();

    if (isToday) {
      // Same day — increment if under cap (atomic).
      const result = await db.user.updateMany({
        where: {
          id: userId,
          dailyUsageDate: today,
          dailyUsageCount: { lt: DAILY_CAP },
        },
        data: { dailyUsageCount: { increment: 1 } },
      });
      if (result.count === 0) {
        throw new DailyCapExceededError(tomorrow);
      }
    } else {
      // New day — reset to 1.
      await db.user.update({
        where: { id: userId },
        data: { dailyUsageDate: today, dailyUsageCount: 1 },
      });
    }
    return;
  }

  // Credit-based path (free + pack buyers).
  const result = await db.user.updateMany({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });

  if (result.count === 0) {
    throw new OutOfCreditsError();
  }
}
