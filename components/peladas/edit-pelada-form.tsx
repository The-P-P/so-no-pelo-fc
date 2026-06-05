"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import {
  updatePelada,
  type PeladaActionResult,
} from "@/lib/actions/pelada-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Pelada } from "@/types";

const initialState: PeladaActionResult = {};

interface EditPeladaFormProps {
  pelada: Pick<Pelada, "id" | "date" | "location" | "notes">;
  onSaved?: () => void;
}

export function EditPeladaForm({ pelada, onSaved }: EditPeladaFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePelada, initialState);

  useEffect(() => {
    if (state.success) {
      onSaved?.();
      router.refresh();
    }
  }, [state.success, router, onSaved]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="peladaId" value={pelada.id} />

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-date">Data</Label>
          <Input
            id="edit-date"
            name="date"
            type="date"
            defaultValue={pelada.date}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-location">Mapa</Label>
          <Input
            id="edit-location"
            name="location"
            defaultValue={pelada.location ?? ""}
            placeholder="Link do Google Maps ou endereço"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição</Label>
        <textarea
          id="edit-description"
          name="description"
          rows={3}
          defaultValue={pelada.notes ?? ""}
          placeholder="Treino de quinta, pelada com os amigos..."
          disabled={pending}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar alterações
          </>
        )}
      </Button>
    </form>
  );
}
