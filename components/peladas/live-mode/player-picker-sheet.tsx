"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  incrementOwnStat,
  incrementStat,
} from "@/lib/actions/pelada-actions";
import { incrementVictory } from "@/lib/actions/ranked-actions";
import { STAT_EMOJIS, STAT_LABELS, BOARD_EMOJIS, type StatField } from "@/lib/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Participant } from "@/types";
import { cn } from "@/lib/utils";

export type PickerMode = StatField | "victory";

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

function getPickerTitle(mode: PickerMode) {
  if (mode === "victory") {
    return `${BOARD_EMOJIS.victories} Quem venceu?`;
  }
  return `${STAT_EMOJIS[mode]} ${STAT_LABELS[mode]} — quem?`;
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const eligibleParticipants =
    mode === "victory"
      ? participants.filter((p) => p.type === "member")
      : participants;

  function handleSelect(participant: Participant) {
    startTransition(async () => {
      let result: { error?: string; success?: string };

      if (mode === "victory") {
        result = await incrementVictory(peladaId, participant.id);
      } else if (isAdmin) {
        result = await incrementStat(
          peladaId,
          participant.id,
          participant.type,
          mode
        );
      } else {
        result = await incrementOwnStat(peladaId, mode);
      }

      if (result.error) {
        onError?.(result.error);
        return;
      }

      onSuccess?.(result.success ?? "Registrado!");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-4 text-left">
          <SheetTitle>{getPickerTitle(mode)}</SheetTitle>
        </SheetHeader>

        {pending && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {eligibleParticipants.map((participant) => {
            const displayName =
              participant.nickname ?? participant.displayName;

            return (
              <button
                key={`${participant.type}-${participant.id}`}
                type="button"
                disabled={pending}
                onClick={() => handleSelect(participant)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border border-border p-3 transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5 active:scale-95",
                  "disabled:pointer-events-none disabled:opacity-50"
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

        {eligibleParticipants.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {mode === "victory"
              ? "Nenhum membro presente para marcar vitória."
              : "Nenhum participante disponível."}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
