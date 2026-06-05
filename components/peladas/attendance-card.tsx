"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AttendanceBoard } from "@/components/peladas/attendance-board";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AttendanceMember } from "@/types";

interface AttendanceCardProps {
  peladaId: string;
  members: AttendanceMember[];
  currentUserId: string;
  canManageOthers: boolean;
}

export function AttendanceCard({
  peladaId,
  members,
  currentUserId,
  canManageOthers,
}: AttendanceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const confirmed = members.filter((m) => m.present).length;
  const summary = `${confirmed} de ${members.length} confirmado${
    members.length !== 1 ? "s" : ""
  } pra bola`;

  return (
    <Card>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Presença</CardTitle>
            <CardDescription className="mt-1">
              {expanded
                ? "Marque quem vai pra bola — nem sempre o grupo inteiro joga"
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
        <AttendanceBoard
          peladaId={peladaId}
          members={members}
          currentUserId={currentUserId}
          canManageOthers={canManageOthers}
        />
      </CardContent>
    </Card>
  );
}
