"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { leaveTeam } from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

export function LeaveTeamButton() {
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleLeave() {
    const confirmed = window.confirm(
      "Tem certeza que deseja sair deste grupo? Você perderá acesso às peladas e ao ranking dele."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await leaveTeam();
      if (result?.error) {
        showToast(result.error, "error");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full"
      disabled={pending}
      onClick={handleLeave}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {pending ? "Saindo do grupo..." : "Sair do grupo"}
    </Button>
  );
}
