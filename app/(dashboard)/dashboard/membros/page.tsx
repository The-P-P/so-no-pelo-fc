import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Membros | Só no Pelo FC",
};

export default function MembrosPage() {
  return (
    <div>
      <Header
        title="Membros"
        description="Gerencie o elenco e as permissões do time."
      />
      <div className="p-6">
        <p className="text-muted-foreground">
          Próxima etapa: lista de membros e promoção de admins.
        </p>
      </div>
    </div>
  );
}
