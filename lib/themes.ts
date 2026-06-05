export type ThemeId =
  | "varzea"
  | "neon"
  | "sunset"
  | "ocean"
  | "lemon"
  | "candy"
  | "rgb-wave"
  | "rgb-gamer";

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  description: string;
  preview: [string, string, string];
  rgb?: boolean;
};

export const THEMES: ThemeConfig[] = [
  {
    id: "varzea",
    name: "Várzea",
    description: "Clássico campinho noturno",
    preview: ["#0a0a0a", "#16a34a", "#dc2626"],
  },
  {
    id: "neon",
    name: "Neon Pitch",
    description: "Verde elétrico vibes",
    preview: ["#0b1020", "#22d3ee", "#a855f7"],
  },
  {
    id: "sunset",
    name: "Sunset FC",
    description: "Pelada no fim da tarde",
    preview: ["#1a0f14", "#f97316", "#ec4899"],
  },
  {
    id: "ocean",
    name: "Ocean FC",
    description: "Fresco e esportivo",
    preview: ["#07131f", "#0ea5e9", "#14b8a6"],
  },
  {
    id: "lemon",
    name: "Lemon Fresh",
    description: "Energia jovem e leve",
    preview: ["#14140a", "#eab308", "#84cc16"],
  },
  {
    id: "candy",
    name: "Candy Squad",
    description: "Rosa e roxo estilo hype",
    preview: ["#160d1f", "#f472b6", "#c084fc"],
  },
  {
    id: "rgb-wave",
    name: "RGB Wave",
    description: "Cores em movimento contínuo",
    preview: ["#0a0a12", "#ff0080", "#00e5ff"],
    rgb: true,
  },
  {
    id: "rgb-gamer",
    name: "RGB Gamer",
    description: "Setup gamer na resenha",
    preview: ["#050508", "#7c3aed", "#22c55e"],
    rgb: true,
  },
];

export const DEFAULT_THEME: ThemeId = "varzea";
export const THEME_STORAGE_KEY = "spfc_theme";

export function isRgbTheme(themeId: ThemeId): boolean {
  return themeId === "rgb-wave" || themeId === "rgb-gamer";
}
