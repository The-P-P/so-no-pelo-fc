"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "spfc_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/.test(ua);
  return isIOS && (isSafari || /iPad|iPhone|iPod/.test(ua));
}

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showIosTip, setShowIosTip] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    if (isIosSafari()) {
      setShowIosTip(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
    setShowIosTip(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[60] mx-auto max-w-lg px-3",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4",
        className
      )}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Instalar Só no Pelo FC
          </p>
          {showIosTip && !deferred ? (
            <p className="mt-1 text-xs text-muted-foreground">
              No iPhone: toque em{" "}
              <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
              Compartilhar e depois em{" "}
              <span className="font-medium text-foreground">
                Adicionar à Tela de Início
              </span>
              .
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Adicione à tela inicial para abrir como app e receber
              notificações.
            </p>
          )}
          {deferred && (
            <Button
              size="sm"
              className="mt-2 h-8"
              onClick={() => void install()}
            >
              Instalar
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
