import { notFound } from "next/navigation";
import { LiveModeShell } from "@/components/peladas/live-mode/live-mode-shell";
import { getDashboardContext } from "@/lib/auth";
import { getPeladaById, getParticipants } from "@/lib/actions/pelada-actions";
import { getTeamDistribution } from "@/lib/actions/team-distribution-actions";
import { getPeladaSubtitle, getPeladaTitle } from "@/lib/peladas";
import { getTeamPermissions } from "@/types";

interface LiveModePageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveModePage({ params }: LiveModePageProps) {
  const { id } = await params;
  const { team, role, profile } = await getDashboardContext();

  if (!team) notFound();

  const pelada = await getPeladaById(id);
  if (!pelada || pelada.team_id !== team.id) notFound();

  const permissions = getTeamPermissions(role);
  const isAdmin = permissions.canApproveStats;

  const [participants, teamDistribution] = await Promise.all([
    getParticipants(team.id),
    isAdmin ? getTeamDistribution(id) : Promise.resolve(null),
  ]);

  return (
    <LiveModeShell
      peladaId={id}
      peladaTitle={getPeladaTitle(pelada)}
      peladaSubtitle={getPeladaSubtitle(pelada)}
      isAdmin={isAdmin}
      participants={
        isAdmin
          ? participants
          : participants.filter(
              (participant) =>
                participant.type === "member" && participant.id === profile?.id
            )
      }
      teamDistribution={teamDistribution}
    />
  );
}
