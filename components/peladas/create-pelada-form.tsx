"use client";

import { useActionState } from "react";
import { Loader2, CalendarPlus } from "lucide-react";
import {
  createPelada,
  type PeladaActionResult,
} from "@/lib/actions/pelada-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PeladaActionResult = {};

export function CreatePeladaForm() {
  const [state, action, pending] = useActionState(createPelada, initialState);
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opponent">Adversário</Label>
          <Input
            id="opponent"
            name="opponent"
            placeholder="Treino"
            required
            minLength={2}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Local (opcional)</Label>
          <Input
            id="location"
            name="location"
            placeholder="Campinho da várzea"
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nova pelada
          </>
        )}
      </Button>
    </form>
  );
}
