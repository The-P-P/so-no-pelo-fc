import { Header } from "@/components/layout/header";
import { GroupSwitcher } from "@/components/profile/group-switcher";
import { LeaveTeamButton } from "@/components/profile/leave-team-button";
import { DeleteTeamForm } from "@/components/profile/delete-team-form";
import { LogoutButton } from "@/components/profile/logout-button";
import { ResetPinForm } from "@/components/profile/reset-pin-form";
import { ThemePicker } from "@/components/profile/theme-picker";
import { TransferOwnershipForm } from "@/components/profile/transfer-ownership-form";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdateNicknameForm } from "@/components/profile/update-nickname-form";
import { InviteLinks } from "@/components/teams/invite-links";
import { getTeamMembers } from "@/lib/actions/member-actions";
import { getDashboardContext } from "@/lib/auth";
import { getTeamPermissions } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhoneDisplay } from "@/lib/phone";
import { KeyRound, Palette, Sparkles, User } from "lucide-react";

export const metadata = {
  title: "Perfil | Só no Pelo FC",
};

export default async function PerfilPage() {
  const { profile, team, role, teams, nickname } = await getDashboardContext();
  const permissions = getTeamPermissions(role);
  const members = team ? await getTeamMembers(team.id) : [];

  const contact = profile?.phone
    ? formatPhoneDisplay(profile.phone)
    : (profile?.email ?? "");

  const initials = (profile?.full_name ?? contact)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <Header
        title="Perfil"
        description="Sua conta, aparência e grupo ativo."
      />

      <div className="space-y-6 p-4 pb-6 md:p-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-base text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">
                {profile?.full_name ?? "Jogador"}
              </p>
              {nickname && (
                <p className="truncate text-sm text-primary">
                  &quot;{nickname}&quot;
                </p>
              )}
              <p className="truncate text-sm text-muted-foreground">
                {contact}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Nome
            </CardTitle>
            <CardDescription>
              Como você aparece no app e no elenco.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateNameForm currentName={profile?.full_name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Apelido no grupo
            </CardTitle>
            <CardDescription>
              Apelido usado no ranking e nas peladas do grupo ativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateNicknameForm
              currentNickname={nickname}
              teamName={team?.name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Redefinir PIN
            </CardTitle>
            <CardDescription>
              Troca o PIN de 6 dígitos usado no login rápido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPinForm
              phoneE164={profile?.phone}
              phoneDisplay={profile?.phone ? formatPhoneDisplay(profile.phone) : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Temas
            </CardTitle>
            <CardDescription>
              Escolha a vibe do app — temas jovens e opções RGB animadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePicker />
          </CardContent>
        </Card>

        <GroupSwitcher
          teams={teams.map((t) => ({
            id: t.team.id,
            name: t.team.name,
            role: t.role,
          }))}
          activeTeamId={team?.id}
        />

        {team && permissions.canManageTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Convidar para o grupo</CardTitle>
              <CardDescription>
                Links separados para participantes e admins de{" "}
                <span className="font-medium text-foreground">{team.name}</span>
                .
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

        {team && permissions.isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transferir ownership</CardTitle>
              <CardDescription>
                Passe o grupo para outro membro antes de sair.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferOwnershipForm
                teamName={team.name}
                candidates={members
                  .filter(
                    (m): m is (typeof members)[number] & {
                      role: "admin" | "player";
                    } => m.role === "admin" || m.role === "player"
                  )
                  .map((m) => ({
                    userId: m.user_id,
                    displayName: m.nickname ?? m.profile.full_name ?? "Jogador",
                    role: m.role,
                  }))}
              />
            </CardContent>
          </Card>
        )}

        {team && !permissions.isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sair do grupo</CardTitle>
              <CardDescription>
                Você pode sair desse grupo quando quiser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveTeamButton />
            </CardContent>
          </Card>
        )}

        {team && permissions.isOwner && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Zona de perigo
              </CardTitle>
              <CardDescription>
                Apenas o dono pode apagar o grupo{" "}
                <span className="font-medium text-foreground">{team.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteTeamForm teamName={team.name} />
            </CardContent>
          </Card>
        )}

        <LogoutButton />
      </div>
    </div>
  );
}
