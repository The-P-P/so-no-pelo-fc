"use client";

import { useTransition } from "react";
import { Check, Users, X } from "lucide-react";
import {
  confirmAllAttendance,
  toggleAttendance,
} from "@/lib/actions/attendance-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AttendanceMember } from "@/types";
import { cn } from "@/lib/utils";

interface AttendanceBoardProps {
  peladaId: string;
  members: AttendanceMember[];
  currentUserId: string;
  canManageOthers: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AttendanceRow({
  peladaId,
  member,
  currentUserId,
  canManageOthers,
}: {
  peladaId: string;
  member: AttendanceMember;
  currentUserId: string;
  canManageOthers: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isSelf = member.userId === currentUserId;
  const canToggle = isSelf || canManageOthers;
  const displayName = member.nickname ?? member.displayName;

  function handleToggle(present: boolean) {
    startTransition(async () => {
      await toggleAttendance(peladaId, member.userId, present);
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
        member.present
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={member.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {displayName}
            {isSelf && (
              <span className="ml-2 text-xs text-muted-foreground">(você)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.present
              ? "Vai pra bola"
              : member.hasMarked
                ? "Não vai"
                : "Ainda não confirmou"}
          </p>
        </div>
      </div>

      {canToggle ? (
        <div className="flex gap-1">
          <Button
            variant={member.present ? "default" : "outline"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleToggle(true)}
            disabled={pending || member.present}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant={member.hasMarked && !member.present ? "destructive" : "outline"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleToggle(false)}
            disabled={pending || (member.hasMarked && !member.present)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            member.present
              ? "bg-primary/10 text-primary"
              : member.hasMarked
                ? "bg-muted text-muted-foreground"
                : "bg-muted/50 text-muted-foreground"
          )}
        >
          {member.present ? "Confirmado" : member.hasMarked ? "Ausente" : "—"}
        </span>
      )}
    </div>
  );
}

export function AttendanceBoard({
  peladaId,
  members,
  currentUserId,
  canManageOthers,
}: AttendanceBoardProps) {
  const [bulkPending, startBulkTransition] = useTransition();
  const confirmed = members.filter((m) => m.present).length;
  const allConfirmed = confirmed === members.length;

  function handleConfirmAll() {
    startBulkTransition(async () => {
      await confirmAllAttendance(peladaId);
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum membro no grupo ainda.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <strong>{confirmed}</strong> de <strong>{members.length}</strong>{" "}
          confirmados pra bola
        </p>
        {canManageOthers && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirmAll}
            disabled={bulkPending || allConfirmed}
          >
            <Users className="mr-2 h-4 w-4" />
            Confirmar todos
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <AttendanceRow
            key={member.userId}
            peladaId={peladaId}
            member={member}
            currentUserId={currentUserId}
            canManageOthers={canManageOthers}
          />
        ))}
      </div>
      {!canManageOthers && (
        <p className="text-xs text-muted-foreground">
          Marque sua presença com ✓ (vou) ou ✗ (não vou).
        </p>
      )}
    </div>
  );
}
