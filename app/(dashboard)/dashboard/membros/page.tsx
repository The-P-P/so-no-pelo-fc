import { Header } from "@/components/layout/header";
import { AddFictionalForm } from "@/components/members/add-fictional-form";
import { FictionalPlayerRow } from "@/components/members/fictional-player-row";
import { MemberRow } from "@/components/members/member-row";
import { PendingNameChangesBoard } from "@/components/members/pending-name-changes-board";
import { getDashboardContext } from "@/lib/auth";
import {
  getTeamMembers,
  getFictionalPlayers,
} from "@/lib/actions/member-actions";
import { getPendingProfileChangeRequests } from "@/lib/actions/name-change-actions";
import { getTeamPermissions } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Membros | Só no Pelo FC",
};

export default async function MembrosPage() {
  const { team, role, profile } = await getDashboardContext();
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

  const [members, fictionalPlayers, pendingNameChanges] = await Promise.all([
    getTeamMembers(team.id),
    getFictionalPlayers(team.id),
    permissions.canManageMembers
      ? getPendingProfileChangeRequests(team.id)
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <Header
        title="Membros"
        description="Elenco real e jogadores fictícios para testes."
      />

      <div className="space-y-6 p-6">
        {permissions.canManageMembers && pendingNameChanges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Alterações de nome pendentes ({pendingNameChanges.length})
              </CardTitle>
              <CardDescription>
                Aprove ou rejeite solicitações de nome e apelido dos jogadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingNameChangesBoard requests={pendingNameChanges} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elenco ({members.length})</CardTitle>
            <CardDescription>
              {permissions.canManageMembers
                ? "Promova admins, rebaixe ou remova membros do grupo."
                : "Membros reais do grupo"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum membro ainda. Convide a galera!
              </p>
            ) : (
              members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserId={profile?.id ?? ""}
                  currentUserRole={role}
                  canManage={permissions.canManageMembers}
                />
              ))
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
