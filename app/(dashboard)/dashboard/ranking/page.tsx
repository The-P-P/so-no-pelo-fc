import { Header } from "@/components/layout/header";
import { PerformanceRankingSection } from "@/components/ranking/performance-ranking-section";
import { RankedBoard } from "@/components/ranked/ranked-board";
import {
  RankedEloLadderCard,
  RankedSeasonCard,
} from "@/components/ranked/ranked-settings";
import { getDashboardContext } from "@/lib/auth";
import {
  getRankingGeral,
  getTeamStatWeights,
} from "@/lib/actions/ranking-actions";
import { getRankingPdl } from "@/lib/actions/ranked-actions";
import { getTeamPermissions } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ranking | Só no Pelo FC",
};

export default async function RankingPage() {
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  const entries = team ? await getRankingGeral(team.id) : [];
  const weights = team ? await getTeamStatWeights(team.id) : null;
  const ranked = team ? await getRankingPdl(team.id) : null;

  return (
    <div>
      <Header
        title="Ranking"
        description="Stats da pelada e liga PDL por temporada."
      />
      <div className="space-y-6 p-6">
        {!team ? (
          <p className="text-sm text-muted-foreground">
            Entre em um grupo para ver o ranking.
          </p>
        ) : (
          <>
            {weights && (
              <PerformanceRankingSection
                teamId={team.id}
                initialEntries={entries}
                initialWeights={weights}
                canManageTeam={permissions.canManageTeam}
              />
            )}

            {ranked && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Liga PDL</CardTitle>
                    <CardDescription>
                      {ranked.season.name} · só vitórias contam · elos em
                      inglês + {ranked.customTopName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RankedBoard entries={ranked.entries} />
                  </CardContent>
                </Card>

                <RankedSeasonCard
                  seasonName={ranked.season.name}
                  canManageTeam={permissions.canManageTeam}
                />

                <RankedEloLadderCard
                  customTopName={ranked.customTopName}
                  isOwner={permissions.isOwner}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
