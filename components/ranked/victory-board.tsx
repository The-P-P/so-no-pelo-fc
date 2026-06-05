"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2 } from "lucide-react";
import { toggleVictory } from "@/lib/actions/ranked-actions";
import { VICTORY_PDL } from "@/lib/ranked";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { VictoryMember } from "@/lib/actions/ranked-actions";
import { cn } from "@/lib/utils";

interface VictoryBoardProps {
  peladaId: string;
  members: VictoryMember[];
  canManage: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function VictoryRow({
  peladaId,
  member,
  canManage,
}: {
  peladaId: string;
  member: VictoryMember;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const displayName = member.nickname ?? member.displayName;

  function handleToggle() {
    startTransition(async () => {
      await toggleVictory(peladaId, member.userId);
      router.refresh();
    });
  }

  if (!member.present) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
        member.won
          ? "border-yellow-500/40 bg-yellow-500/10"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={member.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {member.won
              ? `Vitória · +${VICTORY_PDL} PDL`
              : "Sem vitória nesta pelada"}
          </p>
        </div>
      </div>

      {canManage ? (
        <Button
          variant={member.won ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-8 gap-1",
            member.won && "bg-yellow-600 hover:bg-yellow-600/90"
          )}
          onClick={handleToggle}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Crown className="h-4 w-4" />
              {member.won ? "Desfazer" : "Vitória"}
            </>
          )}
        </Button>
      ) : (
        member.won && (
          <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
            Vencedor
          </span>
        )
      )}
    </div>
  );
}

export function VictoryBoard({
  peladaId,
  members,
  canManage,
}: VictoryBoardProps) {
  const present = members.filter((m) => m.present);
  const winners = present.filter((m) => m.won).length;

  if (present.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ninguém confirmou presença ainda. Marque quem jogou antes de registrar
        vitórias.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <strong>{winners}</strong> vitória{winners !== 1 ? "s" : ""} nesta
        pelada · cada uma vale <strong>+{VICTORY_PDL} PDL</strong>
      </p>
      <div className="space-y-2">
        {members.map((member) => (
          <VictoryRow
            key={member.userId}
            peladaId={peladaId}
            member={member}
            canManage={canManage}
          />
        ))}
      </div>
      {canManage && (
        <p className="text-xs text-muted-foreground">
          Marque vitória para quem ganhou na pelada. Toque em{" "}
          <strong>Desfazer</strong> se errou.
        </p>
      )}
    </div>
  );
}
