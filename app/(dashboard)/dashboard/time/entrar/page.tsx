import { redirect } from "next/navigation";

interface EntrarTimeRedirectProps {
  searchParams: Promise<{ codigo?: string; token?: string }>;
}

export default async function EntrarTimeRedirect({
  searchParams,
}: EntrarTimeRedirectProps) {
  const params = await searchParams;
  const token = params.token ?? params.codigo;
  if (token) {
    redirect(`/dashboard/grupo/entrar?token=${token}`);
  }
  redirect("/dashboard/grupo/entrar");
}
