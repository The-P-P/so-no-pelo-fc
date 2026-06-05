"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  const router = useRouter();
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/perfil");
  }

  return (
    <div className="hidden flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-start sm:justify-between md:flex md:px-6 md:py-6">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <h1 className="break-words text-2xl font-bold tracking-tight">
            {title}
          </h1>
        </div>
        {description && (
          <p className="break-words text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
