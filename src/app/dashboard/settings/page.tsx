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
  const plans = Object.entries(PLAN_META).map(([key, meta]) => ({
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
            <div className="font-bold">{user.plan}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#666]">Credits</div>
            <div className="font-bold">
              {user.plan === "unlimited" ? "Unlimited" : user.credits}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#666]">Email</div>
            <div className="font-bold">{user.email}</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
          Plans
        </h2>
        <PlansPicker plans={plans} hasStripeCustomer={!!user.stripeId} />
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
