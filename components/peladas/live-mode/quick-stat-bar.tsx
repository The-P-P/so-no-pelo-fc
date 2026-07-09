"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { incrementOwnStat } from "@/lib/actions/pelada-actions";
import { PLAYER_BOARD_FIELDS, STAT_EMOJIS, STAT_LABELS, type StatField } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  PlayerPickerSheet,
  type PickerMode,
} from "@/components/peladas/live-mode/player-picker-sheet";
import type { Participant } from "@/types";
import { useState } from "react";

interface QuickStatBarProps {
  peladaId: string;
  participants: Participant[];
  isAdmin: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function QuickStatBar({
  peladaId,
  participants,
  isAdmin,
  onSuccess,
  onError,
}: QuickStatBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<PickerMode>("goals");

  function openPicker(mode: StatField) {
    setActiveMode(mode);
    setPickerOpen(true);
  }

  function handlePlayerStat(field: StatField) {
    startTransition(async () => {
      const result = await incrementOwnStat(peladaId, field);
      if (result.error) {
        onError?.(result.error);
        return;
      }
      onSuccess?.(result.success ?? "Registrado!");
      router.refresh();
    });
  }

  function handleStatTap(field: StatField) {
    if (isAdmin) {
      openPicker(field);
      return;
    }
    handlePlayerStat(field);
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:bottom-0 md:pb-4">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-2">
          {PLAYER_BOARD_FIELDS.map((field) => (
            <button
              key={field}
              type="button"
              disabled={pending}
              onClick={() => handleStatTap(field)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-3 transition-colors",
                "hover:border-primary/50 hover:bg-primary/5 active:scale-95",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <span className="text-xl">{STAT_EMOJIS[field]}</span>
              <span className="text-center text-[10px] font-medium leading-tight">
                {STAT_LABELS[field]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <PlayerPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          peladaId={peladaId}
          participants={participants}
          mode={activeMode}
          isAdmin
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </>
  );
}
