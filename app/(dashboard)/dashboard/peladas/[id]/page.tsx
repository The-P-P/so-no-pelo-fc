import Link from "next/link";

import { notFound } from "next/navigation";

import { ArrowLeft, Radio } from "lucide-react";

import { Header } from "@/components/layout/header";

import { StatBoard } from "@/components/peladas/stat-board";

import { PendingStatsBoard } from "@/components/peladas/pending-stats-board";

import { getDashboardContext } from "@/lib/auth";

import {

  getPeladaById,

  getPeladaStats,

  getParticipants,

} from "@/lib/actions/pelada-actions";

import { getAttendanceMembers } from "@/lib/actions/attendance-actions";

import { AttendanceCard } from "@/components/peladas/attendance-card";
import { TeamDistributionCard } from "@/components/peladas/team-distribution-card";
import { EditPeladaCard } from "@/components/peladas/edit-pelada-card";
import { getVictoryCountsByPelada } from "@/lib/actions/ranked-actions";
import { getTeamDistribution } from "@/lib/actions/team-distribution-actions";
import { VICTORY_PDL } from "@/lib/ranked";

import { DeletePeladaForm } from "@/components/peladas/delete-pelada-form";


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

  const [participants, stats, attendanceMembers, victoryCounts, teamDistribution] =
    await Promise.all([
      getParticipants(team.id),
      getPeladaStats(id),
      getAttendanceMembers(team.id, id),
      getVictoryCountsByPelada(team.id, id),
      getTeamDistribution(id),
    ]);



  const presentUserIds = new Set(

    attendanceMembers.filter((m) => m.present).map((m) => m.userId)

  );

  const filteredParticipants = participants.filter(

    (p) => p.type === "fictional" || presentUserIds.has(p.id)

  );



  const pendingStats = stats.filter(

    (s) => s.status === "pending" && s.user_id

  );

  const ownParticipant = profile

    ? participants.find(

        (p) => p.type === "member" && p.id === profile.id

      )

    : undefined;

  const isPresent = profile ? presentUserIds.has(profile.id) : false;



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

        {(permissions.canApproveStats || isPresent) && (
          <div className="flex justify-end">
            <Button asChild className="gap-2">
              <Link href={`/dashboard/peladas/${id}/ao-vivo`}>
                <Radio className="h-4 w-4" />
                Modo ao vivo
              </Link>
            </Button>
          </div>
        )}

        {permissions.canCreatePelada && <EditPeladaCard pelada={pelada} />}

        <AttendanceCard
          peladaId={id}
          members={attendanceMembers}
          currentUserId={profile?.id ?? ""}
          canManageOthers={permissions.canApproveStats}
        />

        {teamDistribution && (
          <TeamDistributionCard
            peladaId={id}
            distribution={teamDistribution}
            canManage={permissions.canApproveStats}
          />
        )}

        {permissions.canApproveStats && pendingStats.length > 0 && (

          <Card className="border-amber-500/30">

            <CardHeader>

              <CardTitle className="text-base">

                Aprovações pendentes ({pendingStats.length})

              </CardTitle>

              <CardDescription>

                Jogadores enviaram stats — revise antes de ir pro ranking

              </CardDescription>

            </CardHeader>

            <CardContent>

              <PendingStatsBoard

                pendingStats={pendingStats}

                participants={participants}

              />

            </CardContent>

          </Card>

        )}



        {permissions.canApproveStats ? (

          <Card>

            <CardHeader>

              <CardTitle className="text-base">Estatísticas (admin)</CardTitle>

              <CardDescription>
                Use +1 para registrar e −1 para corrigir — só quem confirmou
                presença aparece aqui. Cada vitória vale +{VICTORY_PDL} PDL na
                liga.
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
                  victoryCounts={victoryCounts}
                  mode="admin"
                />

              )}

            </CardContent>

          </Card>

        ) : (

          <Card>

            <CardHeader>

              <CardTitle className="text-base">Minhas estatísticas</CardTitle>

              <CardDescription>

                Lance suas stats — o admin aprova antes de contar no ranking

              </CardDescription>

            </CardHeader>

            <CardContent>

              {!isPresent ? (

                <p className="text-sm text-muted-foreground">

                  Confirme sua presença acima para lançar suas estatísticas.

                </p>

              ) : ownParticipant ? (

                <StatBoard

                  peladaId={id}

                  participants={[ownParticipant]}

                  stats={stats}

                  mode="player"

                />

              ) : (

                <p className="text-sm text-muted-foreground">

                  Você não faz parte do elenco deste grupo.

                </p>

              )}

            </CardContent>

          </Card>

        )}

        {permissions.canCreatePelada && pelada.created_by === profile?.id && (

          <Card className="border-destructive/40">

            <CardHeader>

              <CardTitle className="text-base text-destructive">

                Zona de perigo

              </CardTitle>

              <CardDescription>

                Apenas o admin que criou esta partida pode deletar.

              </CardDescription>

            </CardHeader>

            <CardContent>

              <DeletePeladaForm peladaId={id} />

            </CardContent>

          </Card>

        )}

      </div>

    </div>

  );

}

