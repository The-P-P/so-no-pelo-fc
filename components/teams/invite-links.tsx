"use client";

import { useEffect, useState } from "react";
import { Copy, Check, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteLinksProps {
  playerToken: string;
  adminToken: string;
}

function InviteCard({
  title,
  description,
  token,
  icon: Icon,
  variant,
}: {
  title: string;
  description: string;
  token: string;
  icon: typeof UserPlus;
  variant: "default" | "admin";
}) {
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(
    `/dashboard/grupo/entrar?token=${token}`
  );

  useEffect(() => {
    setInviteUrl(
      `${window.location.origin}/dashboard/grupo/entrar?token=${token}`
    );
  }, [token]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === "admin"
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant={variant === "admin" ? "default" : "outline"}
        size="sm"
        className="w-full"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Link copiado!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copiar convite
          </>
        )}
      </Button>
    </div>
  );
}

export function InviteLinks({ playerToken, adminToken }: InviteLinksProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InviteCard
        title="Convite de participante"
        description="Entra como jogador no grupo"
        token={playerToken}
        icon={UserPlus}
        variant="default"
      />
      <InviteCard
        title="Convite de admin"
        description="Entra com permissão de administrador"
        token={adminToken}
        icon={Shield}
        variant="admin"
      />
    </div>
  );
}
