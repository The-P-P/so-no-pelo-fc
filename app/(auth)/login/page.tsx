import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | Só no Pelo FC",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await ensureProfile();
    if (profile) {
      redirect("/dashboard");
    }
  }

  return (
    <Suspense fallback={<div className="text-muted-foreground">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
