import { Header } from "@/components/layout/header";
import { getDashboardContext } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Trophy, Users, Plus } from "lucide-react";
import { ROLE_LABELS } from "@/types";

export const metadata = {
  title: "Time | Só no Pelo FC",
};

export default async function DashboardPage() {
  const { profile, team, role } = await getDashboardContext();

  return (
    <div>
      <Header
        title={team?.name ?? "Bem-vindo, craque!"}
        description={
          team
            ? `Você é ${ROLE_LABELS[role]} do time. Bora pra mais uma pelada?`
            : "Crie ou entre em um time pra começar."
        }
      />

      <div className="p-6">
        {!team ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Nenhum time ainda</CardTitle>
              <CardDescription>
                Cria teu time de várzea ou pede o link pro dono te adicionar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/time/criar">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar time
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Peladas</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">
                  Em breve: total de peladas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Artilheiro</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">
                  Em breve: rei dos gols
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Jogadores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">
                  Em breve: elenco completo
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {team && (
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
        )}
      </div>
    </div>
  );
}
