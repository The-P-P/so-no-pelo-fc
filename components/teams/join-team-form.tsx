"use client";

import { useActionState } from "react";
import { Loader2, User } from "lucide-react";
import { joinTeam, type TeamActionResult } from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/types";
import type { TeamRole } from "@/types";

const initialState: TeamActionResult = {};

interface JoinTeamFormProps {
  token?: string;
  initialToken?: string;
  teamName?: string;
  inviteRole?: TeamRole;
}

export function JoinTeamForm({
  token,
  initialToken,
  teamName,
  inviteRole = "player",
}: JoinTeamFormProps) {
  const [state, action, pending] = useActionState(joinTeam, initialState);
  const hasFixedToken = Boolean(token);

  return (
    <form action={action} className="space-y-4">
      {hasFixedToken ? (
        <input type="hidden" name="token" value={token} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="token">Código ou link do convite</Label>
          <Input
            id="token"
            name="token"
            placeholder="Cole aqui o código/link"
            defaultValue={initialToken}
            className="h-12 text-base"
            disabled={pending}
            required
          />
        </div>
      )}

      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {teamName && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium">{teamName}</p>
          <p className="text-xs text-muted-foreground">
            Você vai entrar como{" "}
            <strong>{ROLE_LABELS[inviteRole]}</strong>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nickname">Apelido no grupo (opcional)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="nickname"
            name="nickname"
            placeholder="Zagueiro Violento"
            className="h-12 pl-10 text-base"
            maxLength={40}
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Entrando no grupo...
          </>
        ) : (
          "Entrar no grupo"
        )}
      </Button>
    </form>
  );
}

