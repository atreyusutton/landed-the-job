import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/resumes", label: "Resumes" },
  { href: "/dashboard/cover-letters", label: "Cover Letters" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar({ credits, plan }: { credits: number; plan: string }) {
  const creditsLabel = plan === "unlimited" ? "Unlimited" : credits;

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden border-b border-[#1a1a1a] flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-bold tracking-[0.15em] uppercase text-sm">
          LandedTheJob
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#666]">
            <span className="font-bold text-[#1a1a1a]">{creditsLabel}</span> credits
          </span>
          <UserButton />
        </div>
      </header>
      <nav className="md:hidden border-b border-[#eee] flex overflow-x-auto text-xs">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap px-4 py-3 uppercase tracking-wider hover:bg-[#fafafa]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-[#1a1a1a] min-h-screen flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[#1a1a1a]">
          <Link href="/" className="font-bold tracking-[0.15em] uppercase text-sm">
            LandedTheJob
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm uppercase tracking-wider hover:bg-[#f5f5f5]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-[#1a1a1a] text-xs">
          <div className="mb-3">
            <div className="uppercase tracking-wider text-[#666]">Credits</div>
            <div className="font-bold text-base">{creditsLabel}</div>
            <div className="uppercase tracking-wider text-[#666] mt-1">
              Plan: {plan}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-[#666]">Account</span>
          </div>
        </div>
      </aside>
    </>
  );
}
