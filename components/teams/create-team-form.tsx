"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createTeam, type TeamActionResult } from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TeamActionResult = {};

export function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeam, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome do grupo</Label>
        <Input
          id="name"
          name="name"
          placeholder="Só no Pelo FC"
          className="h-12 text-base"
          required
          minLength={2}
          maxLength={60}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Pelada de quinta no campinho da várzea..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          maxLength={200}
          disabled={pending}
        />
      </div>

      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Criando grupo...
          </>
        ) : (
          "Criar grupo"
        )}
      </Button>
    </form>
  );
}
