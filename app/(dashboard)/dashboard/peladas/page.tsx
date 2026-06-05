import Link from "next/link";
import { Header } from "@/components/layout/header";
import { CreatePeladaForm } from "@/components/peladas/create-pelada-form";
import { getDashboardContext } from "@/lib/auth";
import { getTeamPeladas } from "@/lib/actions/pelada-actions";
import { getTeamPermissions } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { getPeladaSubtitle, getPeladaTitle } from "@/lib/peladas";

export const metadata = {
  title: "Peladas | Só no Pelo FC",
};

export default async function PeladasPage() {
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  if (!team) {
    return (
      <div>
        <Header title="Peladas" description="Histórico de jogos e estatísticas." />
        <div className="p-6">
          <p className="text-muted-foreground">
            Entre em um grupo para ver as peladas.
          </p>
        </div>
      </div>
    );
  }

  const peladas = await getTeamPeladas(team.id);

  return (
    <div>
      <Header
        title="Peladas"
        description="Crie peladas e lance estatísticas com +1."
      />

      <div className="space-y-6 p-6">
        {permissions.canCreatePelada && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nova pelada</CardTitle>
              <CardDescription>
                Cria uma pelada para começar a lançar stats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreatePeladaForm />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Histórico ({peladas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {peladas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pelada ainda. Crie a primeira acima!
              </p>
            ) : (
              peladas.map((pelada) => (
                <Button
                  key={pelada.id}
                  variant="outline"
                  className="h-auto w-full items-start justify-between gap-3 whitespace-normal px-4 py-3"
                  asChild
                >
                  <Link href={`/dashboard/peladas/${pelada.id}`}>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="break-words font-medium">
                        {getPeladaTitle(pelada)}
                      </p>
                      <p className="break-words text-xs text-muted-foreground">
                        {getPeladaSubtitle(pelada)}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                  </Link>
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
