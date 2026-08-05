import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatBoard } from "@/components/peladas/stat-board";
import { PendingStatsBoard } from "@/components/peladas/pending-stats-board";
import { FinalizePeladaCard } from "@/components/peladas/finalize-pelada-card";
import { getDashboardContext } from "@/lib/auth";
import {
  getPeladaById,
  getPeladaStats,
  getParticipants,
} from "@/lib/actions/pelada-actions";
import { TeamDistributionCard } from "@/components/peladas/team-distribution-card";
import { EditPeladaCard } from "@/components/peladas/edit-pelada-card";
import { getTeamDistribution } from "@/lib/actions/team-distribution-actions";
import { DeletePeladaForm } from "@/components/peladas/delete-pelada-form";
import { getPeladaSubtitle, getPeladaTitle } from "@/lib/peladas";
import { getTeamPermissions, PELADA_STATUS_LABELS } from "@/types";
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
  const peladaStatus = pelada.status ?? "open";
  const isFinished = peladaStatus === "finished";
  const [participants, stats, teamDistribution] = await Promise.all([
    getParticipants(team.id),
    getPeladaStats(id),
    getTeamDistribution(id),
  ]);

  const pendingStats = stats.filter(
    (s) => s.status === "pending" && s.user_id
  );
  const ownParticipant = profile
    ? participants.find((p) => p.type === "member" && p.id === profile.id)
    : undefined;

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
        {(permissions.canApproveStats || permissions.isOwner) && (
          <FinalizePeladaCard
            peladaId={id}
            status={peladaStatus}
            pendingCount={pendingStats.length}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={
              isFinished
                ? "rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                : "rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
            }
          >
            {PELADA_STATUS_LABELS[peladaStatus]}
          </span>

          {!isFinished && (
            <Button asChild className="gap-2">
              <Link href={`/dashboard/peladas/${id}/ao-vivo`}>
                <Radio className="h-4 w-4" />
                Modo ao vivo
              </Link>
            </Button>
          )}
        </div>

        {permissions.canCreatePelada && !isFinished && (
          <EditPeladaCard pelada={pelada} />
        )}

        {teamDistribution && (
          <TeamDistributionCard
            peladaId={id}
            distribution={teamDistribution}
            canManage={permissions.canApproveStats && !isFinished}
          />
        )}

        {permissions.canApproveStats &&
          !isFinished &&
          pendingStats.length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-base">
                  Aprovações pendentes ({pendingStats.length})
                </CardTitle>
                <CardDescription>
                  Jogadores enviaram stats — revise antes de finalizar
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
                {isFinished
                  ? "Pelada finalizada — estatísticas somente leitura."
                  : "Use +1 para registrar e −1 para corrigir. Finalize para entrar no ranking."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum jogador no grupo ainda.
                </p>
              ) : (
                <StatBoard
                  peladaId={id}
                  participants={participants}
                  stats={stats}
                  mode="admin"
                  readOnly={isFinished}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Minhas estatísticas</CardTitle>
              <CardDescription>
                {isFinished
                  ? "Pelada finalizada — estatísticas somente leitura."
                  : "Lance suas stats — o admin aprova antes de finalizar e contar no ranking"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ownParticipant ? (
                <StatBoard
                  peladaId={id}
                  participants={[ownParticipant]}
                  stats={stats}
                  mode="player"
                  readOnly={isFinished}
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
