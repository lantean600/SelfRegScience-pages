import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AppRouteGate } from "@/components/motion/AppRouteGate";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <AppRouteGate>{children}</AppRouteGate>
    </AppShell>
  );
}
