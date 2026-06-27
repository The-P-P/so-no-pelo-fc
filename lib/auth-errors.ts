/** Traduz erros comuns do Supabase Auth para mensagens úteis em PT. */
export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Limite de e-mails do Supabase atingido. Aguarde cerca de 1 hora. No painel: Authentication → Providers → Email → desligue “Confirm email”.";
  }

  if (
    lower.includes("not confirmed") ||
    lower.includes("email not confirmed")
  ) {
    return "Confirma teu e-mail antes de entrar (olha inbox e spam). Ou desliga “Confirm email” no Supabase pra entrar na hora.";
  }

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "E-mail ou PIN incorretos. Se acabou de criar a conta, confirme o e-mail ou peça ao admin desligar confirmação no Supabase.";
  }

  if (lower.includes("user already registered")) {
    return "Este e-mail já tem conta. Entra com teu PIN ou usa “Esqueci o PIN”.";
  }

  if (
    lower.includes("password should be at least") ||
    lower.includes("password is too short")
  ) {
    return "PIN rejeitado pelo Supabase. Em Authentication → Providers → Email, defina tamanho mínimo de senha como 6.";
  }

  return message;
}
