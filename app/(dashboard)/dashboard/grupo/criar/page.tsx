import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { getCurrentTeamMembership } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Criar grupo | Só no Pelo FC",
};

export default async function CriarGrupoPage() {
  const membership = await getCurrentTeamMembership();
  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header
        title="Criar grupo"
        description="Monta teu grupo de várzea e convida a galera."
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
        <Card>
          <CardHeader>
            <CardTitle>Novo grupo</CardTitle>
            <CardDescription>
              Você será o <strong>dono</strong> do grupo e pode promover admins
              depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
