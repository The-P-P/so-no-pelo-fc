import { Header } from "@/components/layout/header";
import { PersonalStatsDashboard } from "@/components/stats/personal-stats-dashboard";
import { getPersonalStatsBundle } from "@/lib/actions/personal-stats-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Plus, LogIn } from "lucide-react";

export const metadata = {
  title: "Minhas Estatísticas | Só no Pelo FC",
};

export default async function DashboardPage() {
  const bundle = await getPersonalStatsBundle();

  return (
    <div>
      <Header
        title="Minhas Estatísticas"
        description="Seu desempenho nas peladas — por grupo ou somando tudo."
      />

      <div className="p-4 pb-6 md:p-6">
        {!bundle || bundle.teams.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sem grupos ainda</CardTitle>
              <CardDescription>
                Entre em um grupo para começar a acumular estatísticas.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12">
                <Link href="/dashboard/grupo/criar">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar grupo
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12">
                <Link href="/dashboard/grupo/entrar">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar com convite
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PersonalStatsDashboard bundle={bundle} />
        )}
      </div>
    </div>
  );
}
