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

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default async function PeladaDetailPage({
  params,
}: PeladaDetailPageProps) {
  const { id } = await params;
  const { team, role } = await getDashboardContext();

  if (!team) notFound();

  const pelada = await getPeladaById(id);
  if (!pelada || pelada.team_id !== team.id) notFound();

  const permissions = getTeamPermissions(role);
  const [participants, stats] = await Promise.all([
    getParticipants(team.id),
    getPeladaStats(id),
  ]);

  return (
    <div>
      <Header
        title={`vs ${pelada.opponent}`}
        description={`${formatDate(pelada.date)}${pelada.location ? ` · ${pelada.location}` : ""}`}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/peladas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="p-6">
        {permissions.canApproveStats ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estatísticas</CardTitle>
              <CardDescription>
                Toque em +1 para registrar gol, assistência, god save ou deu o cu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatBoard
                peladaId={id}
                participants={participants}
                stats={stats}
              />
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
