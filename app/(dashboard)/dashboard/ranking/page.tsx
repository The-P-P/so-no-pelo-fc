import { Header } from "@/components/layout/header";
import { RankingBoard } from "@/components/ranking/ranking-board";
import { getDashboardContext } from "@/lib/auth";
import { getRankingGeral } from "@/lib/actions/ranking-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Ranking | Só no Pelo FC",
};

export default async function RankingPage() {
  const { team } = await getDashboardContext();

  const entries = team ? await getRankingGeral(team.id) : [];

  return (
    <div>
      <Header
        title="Ranking"
        description="Artilheiro, rei das assistências e campeão dos vacilos."
      />
      <div className="p-6">
        {!team ? (
          <p className="text-sm text-muted-foreground">
            Entre em um grupo para ver o ranking.
          </p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classificação geral</CardTitle>
              <CardDescription>
                Pontuação ponderada: gol +3, assistência +2, god save +2,
                vacilo -1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankingBoard entries={entries} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
