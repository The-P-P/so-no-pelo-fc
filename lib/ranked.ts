/** Pontos por vitória na pelada */
export const VICTORY_PDL = 25;

/** PDL necessário para subir de cada elo (Bronze→Silver = 300, depois +100) */
export const ELO_STEP_POINTS = [300, 400, 500, 600, 700, 800, 900, 1000];

export const FIXED_ELO_NAMES = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Immortal",
  "Radiant",
  "Challenger",
] as const;

export type FixedEloName = (typeof FIXED_ELO_NAMES)[number];

export type EloInfo = {
  eloName: string;
  eloIndex: number;
  totalPdl: number;
  pdlInElo: number;
  pdlNeededForNext: number | null;
  nextEloName: string | null;
  isMax: boolean;
  progressPercent: number;
};

/** Limites cumulativos para entrar em cada elo (índice = elo) */
export function getEloThresholds(): number[] {
  const thresholds = [0];
  let sum = 0;
  for (const step of ELO_STEP_POINTS) {
    sum += step;
    thresholds.push(sum);
  }
  return thresholds;
}

export function getAllEloNames(customTopName: string): string[] {
  return [...FIXED_ELO_NAMES, customTopName.trim() || "FENDA"];
}

export function getEloInfo(totalPdl: number, customTopName: string): EloInfo {
  const thresholds = getEloThresholds();
  const eloNames = getAllEloNames(customTopName);
  const maxIndex = eloNames.length - 1;

  let eloIndex = 0;
  for (let i = maxIndex; i >= 0; i--) {
    if (totalPdl >= thresholds[i]) {
      eloIndex = i;
      break;
    }
  }

  const isMax = eloIndex === maxIndex;
  const currentThreshold = thresholds[eloIndex];
  const nextThreshold = isMax ? null : thresholds[eloIndex + 1];
  const stepSize = isMax ? null : ELO_STEP_POINTS[eloIndex];
  const pdlInElo = totalPdl - currentThreshold;
  const pdlNeededForNext = isMax
    ? null
    : (nextThreshold ?? 0) - totalPdl;

  const progressPercent =
    isMax || !stepSize
      ? 100
      : Math.min(100, Math.round((pdlInElo / stepSize) * 100));

  return {
    eloName: eloNames[eloIndex],
    eloIndex,
    totalPdl,
    pdlInElo,
    pdlNeededForNext,
    nextEloName: isMax ? null : eloNames[eloIndex + 1],
    isMax,
    progressPercent,
  };
}

export const ELO_COLORS: Record<string, string> = {
  Bronze: "text-amber-700",
  Silver: "text-slate-400",
  Gold: "text-yellow-500",
  Platinum: "text-cyan-400",
  Diamond: "text-sky-300",
  Immortal: "text-purple-400",
  Radiant: "text-rose-400",
  Challenger: "text-orange-400",
};

export function getEloColor(eloName: string): string {
  return ELO_COLORS[eloName] ?? "text-primary";
}
