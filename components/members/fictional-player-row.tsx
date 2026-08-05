"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import {
  removeFictionalPlayer,
  updateFictionalPlayer,
} from "@/lib/actions/member-actions";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FictionalPlayer } from "@/types";

interface FictionalPlayerRowProps {
  player: FictionalPlayer;
  canManage?: boolean;
}

export function FictionalPlayerRow({
  player,
  canManage = true,
}: FictionalPlayerRowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(player.display_name);
  const [nickname, setNickname] = useState(player.nickname ?? "");

  function handleRemove() {
    startTransition(async () => {
      const result = await removeFictionalPlayer(player.id);
      if (result.error) showToast(result.error, "error");
      else {
        showToast(result.success ?? "Removido.", "success");
        router.refresh();
      }
    });
  }

  function openEdit() {
    setDisplayName(player.display_name);
    setNickname(player.nickname ?? "");
    setEditOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateFictionalPlayer(
        player.id,
        displayName,
        nickname
      );
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result.success ?? "Atualizado.", "success");
      setEditOpen(false);
      router.refresh();
    });
  }

  return (
    <>
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
        {canManage && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={openEdit}
              disabled={pending}
            >
              <Pencil className="h-4 w-4" />
            </Button>
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
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="pb-4 text-left">
            <SheetTitle>Editar jogador fictício</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`displayName-${player.id}`}>Nome</Label>
              <Input
                id={`displayName-${player.id}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nome do jogador"
                maxLength={60}
                disabled={pending}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fNickname-${player.id}`}>Apelido</Label>
              <Input
                id={`fNickname-${player.id}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Apelido (opcional)"
                maxLength={40}
                disabled={pending}
                className="h-11"
              />
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={pending}
              onClick={handleSave}
            >
              {pending ? (
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
