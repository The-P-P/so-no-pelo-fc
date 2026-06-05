import { Header } from "@/components/layout/header";
import { InviteLinks } from "@/components/teams/invite-links";
import { getDashboardContext } from "@/lib/auth";
import {
  getTeamMemberCount,
  getTeamPeladaCount,
  getFictionalPlayerCount,
} from "@/lib/teams";
import { getTopScorer } from "@/lib/actions/ranking-actions";
import { getTeamPermissions, ROLE_LABELS } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Trophy, Users, Plus, LogIn } from "lucide-react";

export const metadata = {
  title: "Grupo | Só no Pelo FC",
};

export default async function DashboardPage() {
  const { profile, team, role } = await getDashboardContext();

  const memberCount = team ? await getTeamMemberCount(team.id) : 0;
  const fictionalCount = team ? await getFictionalPlayerCount(team.id) : 0;
  const peladaCount = team ? await getTeamPeladaCount(team.id) : 0;
  const topScorer = team ? await getTopScorer(team.id) : null;
  const permissions = getTeamPermissions(role);

  return (
    <div>
      <Header
        title={team?.name ?? "Bem-vindo, craque!"}
        description={
          team
            ? `Você é ${ROLE_LABELS[role]} do grupo. Bora pra mais uma pelada?`
            : "Crie ou entre em um grupo pra começar."
        }
      />

      <div className="p-6">
        {!team ? (
          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Criar grupo</CardTitle>
                <CardDescription>
                  Você vira o dono e manda no bonde.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="h-12 w-full text-base">
                  <Link href="/dashboard/grupo/criar">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar grupo
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entrar no grupo</CardTitle>
                <CardDescription>
                  Tem o convite? Entra na pelada dos amigos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="h-12 w-full text-base">
                  <Link href="/dashboard/grupo/entrar">
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar com convite
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Peladas</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{peladaCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {peladaCount === 0
                      ? "Nenhuma pelada ainda"
                      : "peladas registradas"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Jogadores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {memberCount + fictionalCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {memberCount} reais
                    {fictionalCount > 0 && ` · ${fictionalCount} fictícios`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ranking</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {topScorer && topScorer.score > 0 ? (
                    <>
                      <p className="text-2xl font-bold truncate">
                        {topScorer.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Líder com +{topScorer.score} pts
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground">
                        <Link
                          href="/dashboard/ranking"
                          className="hover:underline"
                        >
                          Ver ranking completo
                        </Link>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {permissions.canManageTeam && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Convidar para o grupo</CardTitle>
                  <CardDescription>
                    Dois links separados: um para participantes e outro para admins.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InviteLinks
                    playerToken={team.player_invite_token}
                    adminToken={team.admin_invite_token}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="text-3xl">🧤</span>
                <div>
                  <p className="font-medium">
                    Olá, {profile?.full_name ?? "jogador"}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    &quot;Quem não vacila, não joga várzea.&quot; — Provérbio
                    anônimo do campinho.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

