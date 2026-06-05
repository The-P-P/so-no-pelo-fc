import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardContext } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, team, role } = await getDashboardContext();

  if (!profile) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      }}
      teamName={team?.name}
      userRole={role}
    >
      {children}
    </DashboardShell>
  );
}
