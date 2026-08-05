"use client";

import { useState } from "react";
import { incrementOwnStat } from "@/lib/actions/pelada-actions";
import { PLAYER_BOARD_FIELDS, STAT_EMOJIS, STAT_LABELS, type StatField } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  PlayerPickerSheet,
  type PickerMode,
} from "@/components/peladas/live-mode/player-picker-sheet";
import type { Participant } from "@/types";

interface QuickStatBarProps {
  peladaId: string;
  participants: Participant[];
  isAdmin: boolean;
  readOnly?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function QuickStatBar({
  peladaId,
  participants,
  isAdmin,
  readOnly = false,
  onSuccess,
  onError,
}: QuickStatBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<PickerMode>("goals");

  function openPicker(mode: StatField) {
    setActiveMode(mode);
    setPickerOpen(true);
  }

  function handlePlayerStat(field: StatField) {
    onSuccess?.(
      `${STAT_EMOJIS[field]} ${STAT_LABELS[field]} registrado!`
    );

    void incrementOwnStat(peladaId, field).then((result) => {
      if (result.error) {
        onError?.(result.error);
      }
    });
  }

  function handleStatTap(field: StatField) {
    if (readOnly) return;
    if (isAdmin) {
      openPicker(field);
      return;
    }
    handlePlayerStat(field);
  }

  if (readOnly) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:pb-4">
        <p className="mx-auto max-w-lg text-center text-sm text-muted-foreground">
          Pelada finalizada — estatísticas travadas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:bottom-0 md:pb-4">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-2">
          {PLAYER_BOARD_FIELDS.map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => handleStatTap(field)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-3 transition-colors",
                "hover:border-primary/50 hover:bg-primary/5 active:scale-95"
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
