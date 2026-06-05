"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ToastType = "success" | "error";

type ToastState = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[70] w-[min(92vw,420px)] -translate-x-1/2 md:bottom-6">
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg backdrop-blur",
              toast.type === "success"
                ? "border-primary/40 text-foreground"
                : "border-destructive/50 text-foreground"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <p className="flex-1 line-clamp-2">{toast.message}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setToast(null)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Fechar aviso</span>
            </Button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa ser usado dentro de <ToastProvider />");
  }
  return ctx;
}
