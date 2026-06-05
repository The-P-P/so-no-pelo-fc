import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { Sidebar } from "@/components/layout/sidebar";
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
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        user={{
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        }}
        teamName={team?.name}
        userRole={role}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
