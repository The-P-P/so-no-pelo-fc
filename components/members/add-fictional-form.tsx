"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  addFictionalPlayer,
  type MemberActionResult,
} from "@/lib/actions/member-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: MemberActionResult = {};

export function AddFictionalForm() {
  const [state, action, pending] = useActionState(addFictionalPlayer, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nome do jogador</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="Pelé Falso"
            required
            minLength={2}
            maxLength={40}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nickname">Apelido (opcional)</Label>
          <Input
            id="nickname"
            name="nickname"
            placeholder="Goleiro Mão de Alface"
            maxLength={40}
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar fictício
          </>
        )}
      </Button>
    </form>
  );
}
