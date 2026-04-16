import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const cu = await currentUser();
  if (!cu) redirect("/sign-in");

  const email = cu.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Clerk user has no primary email address");
  }

  return db.user.create({
    data: {
      clerkId: userId,
      email,
      name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null,
    },
  });
}

export async function requireUser() {
  return getOrCreateUser();
}
