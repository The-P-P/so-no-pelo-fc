"use client";

import { incrementOwnStat, incrementStat } from "@/lib/actions/pelada-actions";
import { STAT_EMOJIS, STAT_LABELS, type StatField } from "@/lib/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Participant } from "@/types";
import { cn } from "@/lib/utils";

export type PickerMode = StatField;

interface PlayerPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peladaId: string;
  participants: Participant[];
  mode: PickerMode;
  isAdmin: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerPickerSheet({
  open,
  onOpenChange,
  peladaId,
  participants,
  mode,
  isAdmin,
  onSuccess,
  onError,
}: PlayerPickerSheetProps) {
  function handleSelect(participant: Participant) {
    const displayName = participant.displayName ?? "Jogador";
    onOpenChange(false);
    onSuccess?.(
      `${STAT_EMOJIS[mode]} ${STAT_LABELS[mode]} · ${displayName}`
    );

    const action = isAdmin
      ? incrementStat(peladaId, participant.id, participant.type, mode)
      : incrementOwnStat(peladaId, mode);

    void action.then((result) => {
      if (result.error) {
        onError?.(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-4 text-left">
          <SheetTitle>
            {STAT_EMOJIS[mode]} {STAT_LABELS[mode]} — quem?
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {participants.map((participant) => {
            const displayName = participant.displayName ?? "Jogador";

            return (
              <button
                key={`${participant.type}-${participant.id}`}
                type="button"
                onClick={() => handleSelect(participant)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border border-border p-3 transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5 active:scale-95"
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={undefined} alt={displayName} />
                  <AvatarFallback className="text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="line-clamp-2 text-center text-xs font-medium leading-tight">
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>

        {participants.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum participante disponível.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
