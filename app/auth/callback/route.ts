import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth (Google) e confirmação de e-mail.
 * Troca o code por sessão e redireciona pro dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  // Erro retornado pelo Supabase/Google
  const authError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (authError) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", authError);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "Código de autenticação não encontrado. Tente novamente."
  );
  return NextResponse.redirect(loginUrl);
}
