import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="md:flex min-h-screen bg-white text-[#1a1a1a]">
      <Sidebar credits={user.credits} plan={user.plan} />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
