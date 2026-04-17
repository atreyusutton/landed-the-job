import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fast path: row already exists for this clerkId.
  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const cu = await currentUser();
  if (!cu) redirect("/sign-in");

  const email = cu.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Clerk user has no primary email address");
  }

  // A row with this email may already exist from a different Clerk instance
  // (e.g. dev keys vs production keys). Reclaim it instead of trying to
  // create a duplicate that would violate the email unique constraint.
  const byEmail = await db.user.findUnique({ where: { email } });
  if (byEmail) {
    return db.user.update({
      where: { id: byEmail.id },
      data: { clerkId: userId },
    });
  }

  try {
    return await db.user.create({
      data: {
        clerkId: userId,
        email,
        name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null,
      },
    });
  } catch (err) {
    // Parallel call (e.g. dashboard layout + page rendering at once) already
    // created the row — look it up by either column and return.
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      const winner = await db.user.findFirst({
        where: { OR: [{ clerkId: userId }, { email }] },
      });
      if (winner) return winner;
    }
    throw err;
  }
}

export async function requireUser() {
  return getOrCreateUser();
}
