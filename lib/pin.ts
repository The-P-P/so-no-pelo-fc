/** PIN numérico de 6 dígitos usado como senha no Supabase Auth. */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function sanitizePinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function pinValidationError(pin: string): string | null {
  if (pin.length === 0) return null;
  if (!isValidPin(pin)) return "O PIN precisa ter exatamente 6 dígitos.";
  return null;
}
