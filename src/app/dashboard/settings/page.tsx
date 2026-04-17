import { requireUser } from "@/lib/user";
import { PLAN_META } from "@/lib/stripe";
import { PlansPicker } from "./PlansPicker";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const isPro = user.plan === "unlimited";
  const isCanceling = isPro && user.subscriptionCancelAtEnd;
  const periodEnd = user.subscriptionPeriodEnd;

  // On Pro, hide the Pack option (they don't need credits while subscribed).
  const planEntries = Object.entries(PLAN_META).filter(
    ([key]) => !(isPro && key === "pack"),
  );
  const plans = planEntries.map(([key, meta]) => ({
    key,
    name: meta.name,
    description: meta.description,
  }));

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-[#666] text-sm mt-1">
          Manage your subscription and account.
        </p>
      </div>

      {sp.checkout === "success" && (
        <div className="border border-[#1a1a1a] bg-[#fafafa] p-4 text-sm">
          Payment received. Your credits and plan will reflect in a moment.
        </div>
      )}
      {sp.checkout === "cancel" && (
        <div className="border border-[#1a1a1a] bg-[#fafafa] p-4 text-sm">
          Checkout canceled. No charge was made.
        </div>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
          Current plan
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#666]">Plan</div>
            <div className="font-bold">{prettyPlan(user.plan)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#666]">
              {isPro ? "Daily cap" : "Credits"}
            </div>
            <div className="font-bold">
              {isPro
                ? `${user.dailyUsageCount}/20 used today`
                : user.credits}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#666]">Email</div>
            <div className="font-bold truncate">{user.email}</div>
          </div>
        </div>

        {isPro && periodEnd && (
          <div className="mt-4 border border-[#1a1a1a] p-4 text-sm">
            {isCanceling ? (
              <>
                <div className="font-bold">
                  Your Pro plan ends on {formatDate(periodEnd)}.
                </div>
                <div className="text-[#666] mt-1">
                  After that, you&apos;ll go back to credit-based billing. You currently
                  have <strong>{user.credits} saved credit{user.credits === 1 ? "" : "s"}</strong>{" "}
                  that will be available again.
                </div>
              </>
            ) : (
              <>
                <div className="font-bold">
                  Your Pro plan renews on {formatDate(periodEnd)}.
                </div>
                {user.credits > 0 && (
                  <div className="text-[#666] mt-1">
                    You have <strong>{user.credits} saved credit{user.credits === 1 ? "" : "s"}</strong>{" "}
                    from before — they&apos;re held for you and will be available
                    again if you ever cancel.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!isPro && user.subscriptionStatus === "canceled" && periodEnd && (
          <div className="mt-4 border border-[#eee] p-3 text-xs text-[#666]">
            Your previous Pro subscription ended {formatDate(periodEnd)}.
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
          {isPro ? "Plans" : "Buy credits or upgrade"}
        </h2>
        <PlansPicker
          plans={plans}
          showPortal={isPro && !!user.stripeId}
        />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
          Account
        </h2>
        <p className="text-sm text-[#666] mb-2">
          To change your password or delete your account, use the account menu in
          the sidebar (powered by Clerk).
        </p>
      </section>
    </div>
  );
}

function prettyPlan(p: string): string {
  if (p === "unlimited") return "Pro (Unlimited)";
  if (p === "free") return "Free";
  return p;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
