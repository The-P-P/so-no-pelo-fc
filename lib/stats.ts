/** Tipos de estatística rastreáveis com botão +1 */
export type StatField = "goals" | "assists" | "god_saves" | "vacilos";

export type StatWeightKey = StatField | "own_goals";

export const STAT_LABELS: Record<StatField, string> = {
  goals: "Gol",
  assists: "Assistência",
  god_saves: "God Save",
  vacilos: "Deu o cu",
};

export const STAT_EMOJIS: Record<StatField, string> = {
  goals: "⚽",
  assists: "🎯",
  god_saves: "🧤",
  vacilos: "💀",
};

/** Pesos padrão — depois o admin ajusta por grupo em team_stat_weights */
export const DEFAULT_STAT_WEIGHTS: Record<StatWeightKey, number> = {
  goals: 3,
  assists: 2,
  god_saves: 2,
  vacilos: -1,
  own_goals: -2,
};

export function calculateStatScore(
  stats: Pick<
    Record<StatWeightKey, number>,
    "goals" | "assists" | "god_saves" | "vacilos" | "own_goals"
  >,
  weights: Record<StatWeightKey, number> = DEFAULT_STAT_WEIGHTS
): number {
  return (
    stats.goals * weights.goals +
    stats.assists * weights.assists +
    stats.god_saves * weights.god_saves +
    stats.vacilos * weights.vacilos +
    stats.own_goals * weights.own_goals
  );
}
