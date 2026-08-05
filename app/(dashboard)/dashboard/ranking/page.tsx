import { Header } from "@/components/layout/header";
import { RankingSection } from "@/components/ranking/ranking-section";
import { getDashboardContext } from "@/lib/auth";
import {
  getRankingGeral,
  getTeamStatWeights,
} from "@/lib/actions/ranking-actions";
import { getTeamPermissions } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ranking | Só no Pelo FC",
};

export default async function RankingPage() {
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  const entries = team ? await getRankingGeral(team.id) : [];
  const weights = team ? await getTeamStatWeights(team.id) : null;

  return (
    <div>
      <Header
        title="Ranking"
        description="Performance do grupo"
      />
      <div className="space-y-6 p-6">
        {!team ? (
          <p className="text-sm text-muted-foreground">
            Entre em um grupo para ver o ranking.
          </p>
        ) : weights ? (
          <RankingSection
            teamId={team.id}
            initialEntries={entries}
            initialWeights={weights}
            canManageTeam={permissions.canManageTeam}
          />
        ) : null}
      </div>
    </div>
  );
}
