"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deletePelada, type PeladaActionResult } from "@/lib/actions/pelada-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PeladaActionResult = {};

interface DeletePeladaFormProps {
  peladaId: string;
}

export function DeletePeladaForm({ peladaId }: DeletePeladaFormProps) {
  const [state, action, pending] = useActionState(deletePelada, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="peladaId" value={peladaId} />

      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" />
          Ação irreversível
        </p>
        <p className="mt-1 text-xs">
          Isso vai remover a partida e as estatísticas relacionadas.
        </p>
      </div>

      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confirmText">
          Digite <strong>DELETAR</strong> para confirmar
        </Label>
        <Input
          id="confirmText"
          name="confirmText"
          placeholder="DELETAR"
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
            Deletando partida...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar partida
          </>
        )}
      </Button>
    </form>
  );
}
