"use client";

import { useEffect } from "react";
import { applyThemeToDocument, getSavedTheme } from "@/lib/theme-storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyThemeToDocument(getSavedTheme());
  }, []);

  return children;
}
