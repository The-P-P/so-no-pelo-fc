"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      className="h-12 w-full text-muted-foreground"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sair da conta
    </Button>
  );
}
