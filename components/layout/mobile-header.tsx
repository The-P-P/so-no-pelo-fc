"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  teamName?: string;
  pageTitle?: string;
}

export function MobileHeader({ teamName, pageTitle }: MobileHeaderProps) {
  const router = useRouter();
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/perfil");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleBack}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Voltar</span>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">
            {pageTitle ?? teamName ?? "Só no Pelo FC"}
          </p>
          {pageTitle && teamName && (
            <p className="truncate text-xs text-muted-foreground">{teamName}</p>
          )}
          {!pageTitle && (
            <p className="truncate text-xs text-muted-foreground">
              Stats de várzea
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
