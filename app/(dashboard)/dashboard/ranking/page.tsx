import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { RankingSection } from "@/components/ranking/ranking-section";
import { getDashboardContext } from "@/lib/auth";
import {
  getRankingGeral,
  getTeamStatWeights,
} from "@/lib/actions/ranking-actions";
import { getRankingPdl } from "@/lib/actions/ranked-actions";
import { getTeamPermissions } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ranking | Só no Pelo FC",
};

type RankingPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const { tab } = await searchParams;
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  const entries = team ? await getRankingGeral(team.id) : [];
  const weights = team ? await getTeamStatWeights(team.id) : null;
  const ranked = team ? await getRankingPdl(team.id) : null;

  const initialTab = tab === "pdl" ? "pdl" : "performance";

  return (
    <div>
      <Header
        title="Ranking"
        description="Performance e liga PDL do grupo"
      />
      <div className="space-y-6 p-6">
        {!team ? (
          <p className="text-sm text-muted-foreground">
            Entre em um grupo para ver o ranking.
          </p>
        ) : weights ? (
          <Suspense fallback={null}>
            <RankingSection
              teamId={team.id}
              initialEntries={entries}
              initialWeights={weights}
              ranked={ranked}
              canManageTeam={permissions.canManageTeam}
              isOwner={permissions.isOwner}
              initialTab={initialTab}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
