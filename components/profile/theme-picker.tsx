"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/themes";
import {
  applyThemeToDocument,
  getSavedTheme,
  saveTheme,
} from "@/lib/theme-storage";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>("varzea");

  useEffect(() => {
    setActiveTheme(getSavedTheme());
  }, []);

  function handleSelect(themeId: ThemeId) {
    setActiveTheme(themeId);
    saveTheme(themeId);
    applyThemeToDocument(themeId);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {THEMES.map((theme) => {
        const isActive = activeTheme === theme.id;

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleSelect(theme.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
              isActive
                ? "border-primary ring-2 ring-primary/40"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="mb-2 flex h-10 gap-1">
              {theme.preview.map((color) => (
                <span
                  key={color}
                  className={cn(
                    "h-full flex-1 rounded-md",
                    theme.rgb && "animate-rgb-preview"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs font-semibold leading-tight">{theme.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
              {theme.description}
            </p>
            {theme.rgb && (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                RGB
              </span>
            )}
            {isActive && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
