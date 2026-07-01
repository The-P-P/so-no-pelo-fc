"use client";

import { useActionState } from "react";
import { Clock, Loader2, User } from "lucide-react";
import {
  updateProfileName,
  type ProfileActionResult,
} from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileActionResult = {};

interface UpdateNameFormProps {
  currentName?: string | null;
  pendingName?: string | null;
  requiresApproval?: boolean;
}

export function UpdateNameForm({
  currentName,
  pendingName,
  requiresApproval = false,
}: UpdateNameFormProps) {
  const [state, action, pending] = useActionState(updateProfileName, initialState);

  return (
    <form action={action} className="space-y-4">
      {pendingName && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Aguardando aprovação do admin para alterar para{" "}
            <strong>{pendingName}</strong>.
          </span>
        </div>
      )}

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
        <Label htmlFor="fullName">Nome</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="fullName"
            name="fullName"
            defaultValue={pendingName ?? currentName ?? ""}
            placeholder="Seu nome"
            className="h-12 pl-10 text-base"
            maxLength={60}
            required
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Salvando...
          </>
        ) : requiresApproval ? (
          "Solicitar alteração"
        ) : (
          "Salvar nome"
        )}
      </Button>
    </form>
  );
}
