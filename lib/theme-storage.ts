import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeId } from "@/lib/themes";

export function getSavedTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
  return saved ?? DEFAULT_THEME;
}

export function saveTheme(themeId: ThemeId) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function applyThemeToDocument(themeId: ThemeId) {
  const root = document.documentElement;
  root.dataset.theme = themeId;
  if (themeId === "rgb-wave" || themeId === "rgb-gamer") {
    root.dataset.rgb = "true";
  } else {
    delete root.dataset.rgb;
  }
}
