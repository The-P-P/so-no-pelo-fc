"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  subscribePush,
  unsubscribePush,
  sendTestPush,
} from "@/lib/actions/push-actions";
import { useToast } from "@/components/providers/toast-provider";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function NotificationSettings() {
  const { showToast } = useToast();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(true);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(ok);
    if (!ok) {
      setChecking(false);
      return;
    }

    setPermission(Notification.permission);

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      } catch {
        setSubscribed(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  function enable() {
    if (!vapidKey) {
      showToast("Chave VAPID pública não encontrada.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          showToast(
            "Ative as notificações nas configurações do navegador.",
            "error"
          );
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const serialized = JSON.parse(JSON.stringify(sub));
        const result = await subscribePush(serialized, navigator.userAgent);
        if (result.error) {
          showToast(result.error, "error");
          return;
        }

        setSubscribed(true);
        showToast(result.success ?? "Notificações ativadas!");
      } catch (error) {
        console.error(error);
        showToast(
          error instanceof Error ? error.message : "Não foi possível ativar.",
          "error"
        );
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        const endpoint = sub?.endpoint;
        await sub?.unsubscribe();
        const result = await unsubscribePush(endpoint);
        setSubscribed(false);
        if (result.error) {
          showToast(result.error, "error");
          return;
        }
        showToast(result.success ?? "Notificações desativadas.");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Tente novamente.",
          "error"
        );
      }
    });
  }

  function test() {
    startTransition(async () => {
      const result = await sendTestPush();
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result.success ?? "Notificação de teste enviada.");
    });
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando notificações…
      </div>
    );
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Este navegador não suporta notificações push.
      </p>
    );
  }

  if (!vapidKey) {
    return (
      <p className="text-sm text-muted-foreground">
        Notificações ainda não foram configuradas neste ambiente.
      </p>
    );
  }

  const iosHint =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !isStandaloneDisplay();

  return (
    <div className="space-y-3">
      {iosHint && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          No iPhone, instale o app na Tela de Início para receber push.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {subscribed && permission === "granted" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={disable}
            >
              <BellOff className="mr-2 h-4 w-4" />
              Desativar
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={test}>
              <Send className="mr-2 h-4 w-4" />
              Enviar teste
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" disabled={pending} onClick={enable}>
            <Bell className="mr-2 h-4 w-4" />
            Ativar notificações
          </Button>
        )}
        {pending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Status:{" "}
        {subscribed && permission === "granted"
          ? "ativas neste dispositivo"
          : permission === "denied"
            ? "bloqueadas pelo navegador"
            : "desativadas"}
      </p>
    </div>
  );
}
