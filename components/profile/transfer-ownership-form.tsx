"use client";

import { useActionState } from "react";
import { Crown, Loader2 } from "lucide-react";
import {
  transferTeamOwnership,
  type TeamActionResult,
} from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: TeamActionResult = {};

type OwnerCandidate = {
  userId: string;
  displayName: string;
  role: "admin" | "player";
};

interface TransferOwnershipFormProps {
  teamName: string;
  candidates: OwnerCandidate[];
}

export function TransferOwnershipForm({
  teamName,
  candidates,
}: TransferOwnershipFormProps) {
  const [state, action, pending] = useActionState(
    transferTeamOwnership,
    initialState
  );

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você precisa ter pelo menos outro membro no grupo para transferir ownership.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newOwnerId">
          Novo dono de <strong>{teamName}</strong>
        </Label>
        <select
          id="newOwnerId"
          name="newOwnerId"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
          disabled={pending}
          defaultValue=""
        >
          <option value="" disabled>
            Selecione um membro
          </option>
          {candidates.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName} ({member.role})
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Transferindo...
          </>
        ) : (
          <>
            <Crown className="mr-2 h-4 w-4" />
            Transferir ownership
          </>
        )}
      </Button>
    </form>
  );
}
