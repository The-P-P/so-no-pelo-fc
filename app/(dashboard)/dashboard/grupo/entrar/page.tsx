import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { JoinTeamForm } from "@/components/teams/join-team-form";
import { getCurrentTeamMembership } from "@/lib/auth";
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
  const membership = await getCurrentTeamMembership();
  if (membership) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const token = params.token ?? "";

  const invite = token ? await getTeamByInviteToken(token) : null;

  return (
    <div>
      <Header
        title="Entrar no grupo"
        description="Usa o link de convite que o dono do grupo te mandou."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-lg p-6">
        {!token ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Link de convite inválido. Pede um convite novo pro dono do grupo
                em <strong>Grupo → Copiar convite</strong>.
              </p>
            </CardContent>
          </Card>
        ) : !invite ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Convite não encontrado ou expirado. Pede um link novo.
              </p>
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
