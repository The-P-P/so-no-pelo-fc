import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { JoinTeamForm } from "@/components/teams/join-team-form";
import { getTeamByInviteToken } from "@/lib/teams";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Entrar no grupo | Só no Pelo FC",
};

interface EntrarGrupoPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function EntrarGrupoPage({
  searchParams,
}: EntrarGrupoPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  const invite = token ? await getTeamByInviteToken(token) : null;

  return (
    <div>
      <Header
        title="Entrar no grupo"
        description="Cole o código/link de convite que o dono do grupo te mandou."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/perfil">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-lg p-6">
        {!token ? (
          <Card>
            <CardHeader>
              <CardTitle>Entrar com código</CardTitle>
              <CardDescription>
                Você pode entrar em outro grupo sem sair do atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JoinTeamForm />
            </CardContent>
          </Card>
        ) : !invite ? (
          <Card>
            <CardHeader>
              <CardTitle>Código inválido</CardTitle>
              <CardDescription>
                O código informado não foi encontrado ou expirou.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tente novamente com outro código ou cole o link inteiro de
                convite.
              </p>
              <JoinTeamForm initialToken={token} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Confirmar entrada</CardTitle>
              <CardDescription>
                Você foi convidado para o grupo abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JoinTeamForm
                token={token}
                teamName={invite.name}
                inviteRole={invite.inviteRole}
              />
            </CardContent>
          </Card>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Quer criar o teu?{" "}
          <Link
            href="/dashboard/grupo/criar"
            className="text-primary hover:underline"
          >
            Criar grupo
          </Link>
        </p>
      </div>
    </div>
  );
}

