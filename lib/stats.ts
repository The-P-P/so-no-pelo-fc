/** Tipos de estatística rastreáveis com botão +1 */
export type StatField =
  | "goals"
  | "assists"
  | "god_saves"
  | "vacilos"
  | "own_goals";

export type StatWeightKey = StatField;

export const STAT_FIELDS: StatField[] = [
  "goals",
  "assists",
  "god_saves",
  "vacilos",
  "own_goals",
];

export const STAT_LABELS: Record<StatField, string> = {
  goals: "Gol",
  assists: "Assistência",
  god_saves: "God Save",
  vacilos: "Deu o cu",
  own_goals: "Gol contra",
};

export const STAT_EMOJIS: Record<StatField, string> = {
  goals: "⚽",
  assists: "🎯",
  god_saves: "🧤",
  vacilos: "💀",
  own_goals: "🙈",
};

export const WEIGHT_LABELS: Record<StatWeightKey, string> = {
  goals: "Gol",
  assists: "Assistência",
  god_saves: "God Save",
  vacilos: "Vacilo",
  own_goals: "Gol contra",
};

export function formatWeightsDescription(
  weights: Record<StatWeightKey, number>
): string {
  return STAT_FIELDS.map((key) => {
    const w = weights[key];
    const sign = w > 0 ? `+${w}` : String(w);
    return `${WEIGHT_LABELS[key].toLowerCase()} ${sign}`;
  }).join(", ");
}

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
