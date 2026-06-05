import { Header } from "@/components/layout/header";
import { AddFictionalForm } from "@/components/members/add-fictional-form";
import { FictionalPlayerRow } from "@/components/members/fictional-player-row";
import { getDashboardContext } from "@/lib/auth";
import {
  getTeamMembers,
  getFictionalPlayers,
} from "@/lib/actions/member-actions";
import { getTeamPermissions, ROLE_LABELS } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = {
  title: "Membros | Só no Pelo FC",
};

export default async function MembrosPage() {
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  if (!team) {
    return (
      <div>
        <Header title="Membros" description="Gerencie o elenco do grupo." />
        <div className="p-6">
          <p className="text-muted-foreground">
            Entre em um grupo para ver os membros.
          </p>
        </div>
      </div>
    );
  }

  const [members, fictionalPlayers] = await Promise.all([
    getTeamMembers(team.id),
    getFictionalPlayers(team.id),
  ]);

  return (
    <div>
      <Header
        title="Membros"
        description="Elenco real e jogadores fictícios para testes."
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elenco ({members.length})</CardTitle>
            <CardDescription>Membros reais do grupo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum membro ainda. Convide a galera!
              </p>
            ) : (
              members.map((member) => {
                const name =
                  member.nickname ??
                  member.profile.full_name ??
                  "Jogador";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={member.profile.avatar_url ?? undefined}
                      />
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      {member.nickname && member.profile.full_name && (
                        <p className="text-xs text-muted-foreground">
                          {member.profile.full_name}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {permissions.canManageMembers && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Jogadores fictícios ({fictionalPlayers.length})
              </CardTitle>
              <CardDescription>
                Para testar estatísticas sem precisar de conta real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddFictionalForm />
              {fictionalPlayers.length > 0 && (
                <div className="space-y-2">
                  {fictionalPlayers.map((player) => (
                    <FictionalPlayerRow key={player.id} player={player} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
