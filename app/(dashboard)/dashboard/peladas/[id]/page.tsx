import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatBoard } from "@/components/peladas/stat-board";
import { getDashboardContext } from "@/lib/auth";
import {
  getPeladaById,
  getPeladaStats,
  getParticipants,
} from "@/lib/actions/pelada-actions";
import { getAttendanceMembers } from "@/lib/actions/attendance-actions";
import { AttendanceBoard } from "@/components/peladas/attendance-board";
import { getPeladaSubtitle, getPeladaTitle } from "@/lib/peladas";
import { getTeamPermissions } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PeladaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PeladaDetailPage({
  params,
}: PeladaDetailPageProps) {
  const { id } = await params;
  const { team, role, profile } = await getDashboardContext();

  if (!team) notFound();

  const pelada = await getPeladaById(id);
  if (!pelada || pelada.team_id !== team.id) notFound();

  const permissions = getTeamPermissions(role);
  const [participants, stats, attendanceMembers] = await Promise.all([
    getParticipants(team.id),
    getPeladaStats(id),
    getAttendanceMembers(team.id, id),
  ]);

  const presentUserIds = new Set(
    attendanceMembers.filter((m) => m.present).map((m) => m.userId)
  );
  const filteredParticipants = participants.filter(
    (p) => p.type === "fictional" || presentUserIds.has(p.id)
  );

  return (
    <div>
      <Header
        title={getPeladaTitle(pelada)}
        description={getPeladaSubtitle(pelada)}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/peladas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presença</CardTitle>
            <CardDescription>
              Marque quem vai pra bola — nem sempre o grupo inteiro joga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceBoard
              peladaId={id}
              members={attendanceMembers}
              currentUserId={profile?.id ?? ""}
              canManageOthers={permissions.canApproveStats}
            />
          </CardContent>
        </Card>

        {permissions.canApproveStats ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estatísticas</CardTitle>
              <CardDescription>
                Toque em +1 para registrar gol, assistência, god save ou deu o
                cu — só quem confirmou presença aparece aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguém confirmou presença ainda. Marque quem vai jogar
                  antes de lançar as stats.
                </p>
              ) : (
                <StatBoard
                  peladaId={id}
                  participants={filteredParticipants}
                  stats={stats}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Apenas admins podem lançar estatísticas por enquanto.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
