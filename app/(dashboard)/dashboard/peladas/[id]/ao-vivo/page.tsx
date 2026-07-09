import { notFound, redirect } from "next/navigation";

import { LiveModeShell } from "@/components/peladas/live-mode/live-mode-shell";
import { getDashboardContext } from "@/lib/auth";
import { getPeladaById, getParticipants } from "@/lib/actions/pelada-actions";
import { getAttendanceMembers } from "@/lib/actions/attendance-actions";
import { getVictoryCountsByPelada } from "@/lib/actions/ranked-actions";
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

  const [participants, attendanceMembers, victoryCounts, teamDistribution] =
    await Promise.all([
      getParticipants(team.id),
      getAttendanceMembers(team.id, id),
      isAdmin ? getVictoryCountsByPelada(team.id, id) : Promise.resolve({}),
      isAdmin ? getTeamDistribution(id) : Promise.resolve(null),
    ]);

  const presentUserIds = new Set(
    attendanceMembers.filter((member) => member.present).map((member) => member.userId)
  );

  const isPresent = profile ? presentUserIds.has(profile.id) : false;

  if (!isAdmin && !isPresent) {
    redirect(`/dashboard/peladas/${id}`);
  }

  const filteredParticipants = participants.filter(
    (participant) =>
      participant.type === "fictional" || presentUserIds.has(participant.id)
  );

  return (
    <LiveModeShell
      peladaId={id}
      peladaTitle={getPeladaTitle(pelada)}
      peladaSubtitle={getPeladaSubtitle(pelada)}
      isAdmin={isAdmin}
      participants={
        isAdmin
          ? filteredParticipants
          : filteredParticipants.filter(
              (participant) =>
                participant.type === "member" && participant.id === profile?.id
            )
      }
      teamDistribution={teamDistribution}
      victoryCounts={victoryCounts}
    />
  );
}
