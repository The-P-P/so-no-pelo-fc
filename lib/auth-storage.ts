/** Lembra o e-mail no login (só conveniência local). */
const EMAIL_KEY = "spfc_email";

export function getSavedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function saveEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}
