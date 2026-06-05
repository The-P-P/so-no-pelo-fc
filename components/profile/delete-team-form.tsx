"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteTeam, type TeamActionResult } from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TeamActionResult = {};

interface DeleteTeamFormProps {
  teamName: string;
}

export function DeleteTeamForm({ teamName }: DeleteTeamFormProps) {
  const [state, action, pending] = useActionState(deleteTeam, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" />
          Ação irreversível
        </p>
        <p className="mt-1 text-xs">
          Esse grupo, peladas, ranking e membros serão removidos.
        </p>
      </div>

      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confirmName">
          Digite <strong>{teamName}</strong> para confirmar
        </Label>
        <Input
          id="confirmName"
          name="confirmName"
          placeholder={teamName}
          className="h-11"
          required
          disabled={pending}
        />
      </div>

      <Button
        type="submit"
        variant="destructive"
        className="h-11 w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Deletando grupo...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar grupo
          </>
        )}
      </Button>
    </form>
  );
}
