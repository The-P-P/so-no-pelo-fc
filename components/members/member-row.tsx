"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Loader2,
  Pencil,
  Shield,
  ShieldOff,
  UserMinus,
} from "lucide-react";
import {
  demoteMember,
  promoteMember,
  removeMember,
  updateMemberNames,
} from "@/lib/actions/member-actions";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(member.profile.full_name ?? "");
  const [nickname, setNickname] = useState(member.nickname ?? "");

  const name =
    member.profile.full_name ?? member.nickname ?? "Jogador";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSelf = member.user_id === currentUserId;
  const isOwner = member.role === "owner";
  const showRoleActions =
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

  function openEdit() {
    setFullName(member.profile.full_name ?? "");
    setNickname(member.nickname ?? "");
    setEditOpen(true);
  }

  function handleSaveNames() {
    startTransition(async () => {
      const result = await updateMemberNames(
        member.user_id,
        fullName,
        nickname
      );
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result.success ?? "Nome atualizado.", "success");
      setEditOpen(false);
      router.refresh();
    });
  }

  return (
    <>
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
            {member.nickname && (
              <p className="truncate text-xs text-muted-foreground">
                Apelido: {member.nickname}
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

        {(canManage || showRoleActions) && (
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={isPending}
                onClick={openEdit}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar nome
              </Button>
            )}
            {showRoleActions && member.role === "player" && (
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
            {showRoleActions &&
              member.role === "admin" &&
              currentUserRole === "owner" && (
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
            {showRoleActions && (
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
            )}
          </div>
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="pb-4 text-left">
            <SheetTitle>Editar nome</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`fullName-${member.user_id}`}>Nome real</Label>
              <Input
                id={`fullName-${member.user_id}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome real"
                maxLength={60}
                disabled={isPending}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`nickname-${member.user_id}`}>Apelido</Label>
              <Input
                id={`nickname-${member.user_id}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Apelido no grupo (opcional)"
                maxLength={40}
                disabled={isPending}
                className="h-11"
              />
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={isPending}
              onClick={handleSaveNames}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
