"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  updateTeamNickname,
  type ProfileActionResult,
} from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileActionResult = {};

interface UpdateNicknameFormProps {
  currentNickname?: string | null;
  teamName?: string;
}

export function UpdateNicknameForm({
  currentNickname,
  teamName,
}: UpdateNicknameFormProps) {
  const [state, action, pending] = useActionState(
    updateTeamNickname,
    initialState
  );

  if (!teamName) {
    return (
      <p className="text-sm text-muted-foreground">
        Entre em um grupo para definir seu apelido no elenco.
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

      <p className="text-xs text-muted-foreground">
        Apelido no grupo <strong className="text-foreground">{teamName}</strong>
      </p>

      <div className="space-y-2">
        <Label htmlFor="nickname">Apelido</Label>
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="nickname"
            name="nickname"
            defaultValue={currentNickname ?? ""}
            placeholder="Zagueiro Violento"
            className="h-12 pl-10 text-base"
            maxLength={40}
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
        ) : (
          "Salvar apelido"
        )}
      </Button>
    </form>
  );
}
