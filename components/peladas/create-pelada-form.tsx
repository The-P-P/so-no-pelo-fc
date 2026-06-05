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
import { cn } from "@/lib/utils";

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

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="location">Local</Label>
          <Input
            id="location"
            name="location"
            placeholder="Campinho da várzea"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
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
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nova pelada
          </>
        )}
      </Button>
    </form>
  );
}
