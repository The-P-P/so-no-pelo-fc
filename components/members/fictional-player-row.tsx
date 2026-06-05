"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeFictionalPlayer } from "@/lib/actions/member-actions";
import { Button } from "@/components/ui/button";
import type { FictionalPlayer } from "@/types";

export function FictionalPlayerRow({ player }: { player: FictionalPlayer }) {
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await removeFictionalPlayer(player.id);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3">
      <div>
        <p className="text-sm font-medium">
          {player.display_name}
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Fictício
          </span>
        </p>
        {player.nickname && (
          <p className="text-xs text-muted-foreground">{player.nickname}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={handleRemove}
        disabled={pending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
