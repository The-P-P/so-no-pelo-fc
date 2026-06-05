/** Formata input de telefone brasileiro: (11) 99999-9999 */
export function formatBrazilPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Converte telefone BR para E.164 (+5511999999999) */
export function toE164Brazil(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  return null;
}

/** Mascara telefone E.164 para exibição */
export function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "").replace(/^55/, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}
