import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Ranking | Só no Pelo FC",
};

export default function RankingPage() {
  return (
    <div>
      <Header
        title="Ranking"
        description="Artilheiro, rei das assistências e campeão dos vacilos."
      />
      <div className="p-6">
        <p className="text-muted-foreground">
          Próxima etapa: tabelas de ranking com sorting.
        </p>
      </div>
    </div>
  );
}
