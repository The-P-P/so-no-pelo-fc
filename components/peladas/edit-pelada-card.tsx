"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EditPeladaForm } from "@/components/peladas/edit-pelada-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPeladaDate } from "@/lib/peladas";
import { cn } from "@/lib/utils";
import type { Pelada } from "@/types";

interface EditPeladaCardProps {
  pelada: Pick<Pelada, "id" | "date" | "location" | "notes">;
}

function getEditSummary(
  pelada: Pick<Pelada, "date" | "location" | "notes">
): string {
  const parts = [formatPeladaDate(pelada.date)];
  if (pelada.location?.trim()) parts.push(pelada.location.trim());
  if (pelada.notes?.trim()) parts.push(pelada.notes.trim());
  return parts.join(" · ");
}

export function EditPeladaCard({ pelada }: EditPeladaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const handleSaved = useCallback(() => setExpanded(false), []);
  const summary = getEditSummary(pelada);

  return (
    <Card>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Editar pelada</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {expanded
                ? "Altere data, mapa ou descrição desta partida"
                : summary}
            </CardDescription>
          </div>
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </span>
        </CardHeader>
      </button>

      <CardContent className={cn(!expanded && "hidden")}>
        <EditPeladaForm pelada={pelada} onSaved={handleSaved} />
      </CardContent>
    </Card>
  );
}
