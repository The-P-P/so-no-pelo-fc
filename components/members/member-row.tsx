"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Shield, ShieldOff, UserMinus } from "lucide-react";
import {
  demoteMember,
  promoteMember,
  removeMember,
} from "@/lib/actions/member-actions";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type TeamMemberWithProfile, type TeamRole } from "@/types";

interface MemberRowProps {
  member: TeamMemberWithProfile;
  currentUserId: string;
  currentUserRole: TeamRole;
  canManage: boolean;
}

export function MemberRow({
  member,
  currentUserId,
  currentUserRole,
  canManage,
}: MemberRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const name =
    member.nickname ?? member.profile.full_name ?? "Jogador";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSelf = member.user_id === currentUserId;
  const isOwner = member.role === "owner";
  const showActions =
    canManage && !isSelf && !isOwner && member.user_id !== currentUserId;

  function runAction(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) showToast(result.error, "error");
      else {
        showToast(result.success ?? "Atualizado.", "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={member.profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-xs text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          {member.nickname && member.profile.full_name && (
            <p className="truncate text-xs text-muted-foreground">
              {member.profile.full_name}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
          {member.role === "owner" && (
            <Crown className="mr-1 inline h-3 w-3" />
          )}
          {ROLE_LABELS[member.role]}
        </span>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2">
          {member.role === "player" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={isPending}
              onClick={() => runAction(() => promoteMember(member.user_id))}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Shield className="mr-1 h-3.5 w-3.5" />
                  Promover
                </>
              )}
            </Button>
          )}
          {member.role === "admin" && currentUserRole === "owner" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={isPending}
              onClick={() => runAction(() => demoteMember(member.user_id))}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShieldOff className="mr-1 h-3.5 w-3.5" />
                  Rebaixar
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={() => runAction(() => removeMember(member.user_id))}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserMinus className="mr-1 h-3.5 w-3.5" />
                Remover
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
