"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import { switchActiveTeam } from "@/lib/actions/team-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type TeamRole } from "@/types";

type TeamOption = {
  id: string;
  name: string;
  role: TeamRole;
};

interface GroupSwitcherProps {
  teams: TeamOption[];
  activeTeamId?: string;
}

export function GroupSwitcher({ teams, activeTeamId }: GroupSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSwitch(teamId: string) {
    if (teamId === activeTeamId) return;

    startTransition(async () => {
      const result = await switchActiveTeam(teamId);
      if (result.error) {
        setToast({ type: "error", message: result.error });
        return;
      }

      setToast({ type: "success", message: result.success ?? "Grupo alterado." });
      router.refresh();
    });
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seu grupo</CardTitle>
          <CardDescription>
            Crie ou entre em um grupo para começar a pelada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-12">
            <Link href="/dashboard/grupo/criar">
              <Plus className="mr-2 h-4 w-4" />
              Criar grupo
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12">
            <Link href="/dashboard/grupo/entrar">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar com convite
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Seus grupos</CardTitle>
        <CardDescription>
          Cada grupo tem peladas, ranking e membros próprios. Toque para
          alternar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {teams.map((team) => {
          const isActive = team.id === activeTeamId;

          return (
            <button
              key={team.id}
              type="button"
              disabled={isPending}
              onClick={() => handleSwitch(team.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                isActive
                  ? "border-primary/50 bg-primary/10"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {team.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{team.name}</p>
                  {isActive && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Grupo atual
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[team.role]}
                </p>
              </div>
              {isActive && (
                <Check className="h-5 w-5 shrink-0 text-primary" />
              )}
            </button>
          );
        })}

        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link href="/dashboard/grupo/criar">
              <Plus className="mr-2 h-4 w-4" />
              Novo grupo
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link href="/dashboard/grupo/entrar">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar em outro
            </Link>
          </Button>
        </div>
      </CardContent>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] w-[min(92vw,360px)] -translate-x-1/2 md:bottom-6">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
              toast.type === "success"
                ? "border-primary/40 bg-card text-foreground"
                : "border-destructive/50 bg-card text-foreground"
            )}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <p className="line-clamp-2">{toast.message}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
