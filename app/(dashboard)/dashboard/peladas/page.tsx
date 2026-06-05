import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Peladas | Só no Pelo FC",
};

export default function PeladasPage() {
  return (
    <div>
      <Header
        title="Peladas"
        description="Histórico de jogos, placares e estatísticas. Em construção."
      />
      <div className="p-6">
        <p className="text-muted-foreground">
          Próxima etapa: listagem e criação de peladas.
        </p>
      </div>
    </div>
  );
}
