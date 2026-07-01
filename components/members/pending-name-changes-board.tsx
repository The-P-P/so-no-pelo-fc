"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, User, Sparkles, X } from "lucide-react";
import {
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
  type ProfileChangeRequest,
} from "@/lib/actions/name-change-actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

interface PendingNameChangesBoardProps {
  requests: ProfileChangeRequest[];
}

function formatChange(request: ProfileChangeRequest): {
  label: string;
  from: string;
  to: string;
  icon: typeof User;
} {
  const displayName =
    request.current_nickname ??
    request.profile.full_name ??
    "Jogador";

  if (request.change_type === "full_name") {
    return {
      label: displayName,
      from: request.profile.full_name ?? "—",
      to: request.requested_value,
      icon: User,
    };
  }

  return {
    label: displayName,
    from: request.current_nickname ?? "—",
    to: request.requested_value || "(remover apelido)",
    icon: Sparkles,
  };
}

export function PendingNameChangesBoard({
  requests,
}: PendingNameChangesBoardProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (requests.length === 0) return null;

  function handleAction(requestId: string, action: "approve" | "reject") {
    setPendingId(requestId);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveProfileChangeRequest(requestId)
          : await rejectProfileChangeRequest(requestId);

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(result.success ?? "Atualizado.", "success");
        router.refresh();
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const { label, from, to, icon: Icon } = formatChange(request);
        const busy = isPending && pendingId === request.id;
        const fieldLabel =
          request.change_type === "full_name" ? "Nome" : "Apelido";

        return (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                {fieldLabel}: {from} → {to}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                disabled={busy}
                onClick={() => handleAction(request.id, "reject")}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                className="h-9"
                disabled={busy}
                onClick={() => handleAction(request.id, "approve")}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Aprovar
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
