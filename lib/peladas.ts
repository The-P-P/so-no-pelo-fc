import type { Pelada } from "@/types";

export function formatPeladaDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function getPeladaTitle(pelada: Pick<Pelada, "notes">) {
  if (pelada.notes?.trim()) return pelada.notes.trim();
  return "Pelada";
}

export function getPeladaSubtitle(
  pelada: Pick<Pelada, "date" | "location">
) {
  const parts = [formatPeladaDate(pelada.date)];
  if (pelada.location) parts.push(pelada.location);
  return parts.join(" · ");
}
