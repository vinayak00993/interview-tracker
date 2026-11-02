import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/app/AppHeader";
import { MobileTabBar } from "@/components/app/MobileTabBar";

/**
 * Signed-in shell: one header, one mobile tab bar, every page inside.
 * On phones the header and tab bar pin and the content scrolls between
 * them, which keeps iOS Safari's chrome from fighting the layout.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen md:min-h-0 md:block h-[100dvh] md:h-auto">
      <AppHeader name={session.user.name ?? session.user.email ?? ""} />
      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">{children}</div>
      <MobileTabBar />
    </div>
  );
}
